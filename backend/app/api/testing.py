"""
API routes for AI testing
"""
from fastapi import APIRouter, HTTPException
from typing import List
from app.models.schemas import AITestRequest, AITestResult, Question
from app.services.openrouter import openrouter_client, response_scorer
from app.services.es_calculator import ESCalculator
from app.utils.database import db
from datetime import datetime
import random
import re

router = APIRouter(prefix="/api/test", tags=["testing"])


def _normalize_answer(answer) -> str:
    """Normalize answer to letter format (A, B, C, D)"""
    if isinstance(answer, int):
        return chr(65 + answer)  # 0->A, 1->B, etc
    if isinstance(answer, str):
        return answer.upper().strip()
    return 'A'


def _extract_answer_from_response(response: str, options: List[str]) -> str:
    """
    Extract the selected answer (A, B, C, D) from AI's response.
    Uses multiple heuristics to identify the answer.
    """
    response_upper = response.upper()
    
    # Method 1: Look for explicit patterns like "Answer: A", "Option A", "(A)", etc.
    patterns = [
        r'\b([A-D])\)',  # (A), (B), etc.
        r'\b([A-D])\.',  # A., B., etc.
        r'ANSWER[:\s]+([A-D])',  # Answer: A
        r'OPTION[:\s]+([A-D])',  # Option: A
        r'SELECT[:\s]+([A-D])',  # Select: A
        r'CHOOSE[:\s]+([A-D])',  # Choose: A
        r'\b([A-D])\s+IS\s+CORRECT',  # A is correct
        r'CORRECT\s+ANSWER\s+IS\s+([A-D])',  # Correct answer is A
    ]
    
    for pattern in patterns:
        match = re.search(pattern, response_upper)
        if match:
            return match.group(1)
    
    # Method 2: Look for the option text itself
    for idx, option in enumerate(options):
        # Check if significant part of option text appears in response
        option_words = set(option.lower().split())
        if len(option_words) > 3:  # Only check if option has enough words
            # Check if at least 60% of option words appear in response
            matches = sum(1 for word in option_words if word in response.lower())
            if matches / len(option_words) >= 0.6:
                return chr(65 + idx)
    
    # Method 3: Look for standalone A, B, C, D at start of sentences or paragraphs
    standalone_match = re.search(r'(?:^|\n)([A-D])(?:\s|$)', response_upper)
    if standalone_match:
        return standalone_match.group(1)
    
    # Method 4: Find first occurrence of A, B, C, or D
    for letter in ['A', 'B', 'C', 'D'][:len(options)]:
        if letter in response_upper:
            return letter
    
    # Fallback: Return A if nothing found
    return 'A'


@router.post("/single")
async def test_single_question(request: AITestRequest):
    """Test a single question with AI models"""
    # Get question
    question = db.get_question(request.questionId)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Test with selected models
    results = []
    for model in request.models:
        try:
            # For multiple choice questions, test with real AI
            if question.type == "multiple-choice" and question.options:
                ai_result = await _test_multiple_choice_question_real(
                    question=question,
                    model=model
                )
                
                test_result = AITestResult(
                    model=model,
                    accuracy=ai_result["accuracy"],
                    coherence=ai_result["coherence"],
                    response=ai_result["response"],
                    selectedOption=ai_result.get("selectedOption"),
                    isCorrect=ai_result.get("isCorrect"),
                    confidence=ai_result.get("confidence"),
                    timestamp=datetime.now()
                )
            else:
                # For other question types (essay, short-answer, etc.)
                ai_result = await _test_open_ended_question_real(
                    question=question,
                    model=model
                )
                
                test_result = AITestResult(
                    model=model,
                    accuracy=ai_result["accuracy"],
                    coherence=ai_result["coherence"],
                    response=ai_result["response"],
                    confidence=ai_result.get("confidence"),
                    timestamp=datetime.now()
                )
            
            results.append(test_result)
        except Exception as e:
            # Log error but continue with other models
            print(f"Error testing with {model}: {e}")
            continue
    
    # Update question with results (UPDATE existing, don't duplicate)
    if not question.aiTestResults:
        question.aiTestResults = []
    
    # Update or add new results
    for new_result in results:
        # Find if this model already has a result
        existing_idx = next(
            (i for i, r in enumerate(question.aiTestResults) if r.model == new_result.model),
            None
        )
        
        if existing_idx is not None:
            # UPDATE existing result
            question.aiTestResults[existing_idx] = new_result
        else:
            # ADD new result
            question.aiTestResults.append(new_result)
    
    # Recalculate ES with AI accuracy
    if question.aiTestResults:
        avg_accuracy = sum(r.accuracy for r in question.aiTestResults) / len(question.aiTestResults)
        question.exploitabilityScore = ESCalculator.calculate(
            bloom_level=question.bloomLevel,
            context_dependency=question.contextDependency,
            novelty=question.novelty,
            ai_accuracy=avg_accuracy
        )
    
    question.updatedAt = datetime.now()
    
    # Save updates
    db.questions[question.id] = question
    db.save_data()
    
    return {
        "questionId": question.id,
        "exploitabilityScore": question.exploitabilityScore,
        "testResults": [
            {
                "model": r.model,
                "accuracy": r.accuracy,
                "coherence": r.coherence,
                "response": r.response,
                "selectedOption": r.selectedOption,
                "isCorrect": r.isCorrect,
                "confidence": r.confidence,
                "timestamp": r.timestamp.isoformat() if isinstance(r.timestamp, datetime) else r.timestamp
            }
            for r in results
        ]
    }


async def _test_multiple_choice_question_real(question: Question, model: str) -> dict:
    """
    Test a multiple choice question with REAL AI via OpenRouter.
    """
    if not question.options:
        raise ValueError("Multiple choice question must have options")
    
    # Format the question with options
    options_text = "\n".join([
        f"{chr(65 + i)}. {option}"
        for i, option in enumerate(question.options)
    ])
    
    full_question = f"{question.text}\n\n{options_text}\n\nProvide your answer as a single letter (A, B, C, or D)."
    
    # Call OpenRouter API
    ai_response = await openrouter_client.test_question(
        question_text=full_question,
        model=model,
        system_prompt=(
            "You are taking an assessment. Answer the following multiple choice question "
            "by selecting the best option. Provide your answer clearly."
        )
    )
    
    # Extract the selected answer
    selected = _extract_answer_from_response(ai_response["response"], question.options)
    
    # Check if correct
    correct_answer = _normalize_answer(question.correctAnswer)
    is_correct = (selected == correct_answer)
    
    # Estimate confidence based on response clarity
    confidence = _estimate_confidence(ai_response["response"])
    
    # Score coherence
    coherence_score = response_scorer._score_coherence(ai_response["response"])
    
    return {
        "accuracy": 100.0 if is_correct else 0.0,
        "coherence": coherence_score,
        "response": ai_response["response"][:500],  # Truncate for storage
        "selectedOption": selected,
        "isCorrect": is_correct,
        "confidence": confidence
    }


async def _test_open_ended_question_real(question: Question, model: str) -> dict:
    """
    Test an open-ended question (essay, short-answer) with REAL AI via OpenRouter.
    """
    # Call OpenRouter API
    ai_response = await openrouter_client.test_question(
        question_text=question.text,
        model=model,
        system_prompt=(
            "You are a student taking an assessment. Provide a clear, "
            "comprehensive answer to the following question."
        )
    )
    
    # Score the response
    scores = response_scorer.score_response(
        response=ai_response["response"],
        question_text=question.text,
        expected_answer=question.expectedAnswer or "",
        rubric=question.rubric or {}
    )
    
    # Estimate confidence
    confidence = _estimate_confidence(ai_response["response"])
    
    return {
        "accuracy": scores["accuracy"],
        "coherence": scores["coherence"],
        "response": ai_response["response"][:500],  # Truncate for storage
        "confidence": confidence
    }


def _estimate_confidence(response: str) -> float:
    """
    Estimate AI's confidence based on response characteristics.
    Higher confidence when response is definitive and clear.
    """
    confidence = 70.0  # Base confidence
    
    # Increase for definitive language
    if any(word in response.lower() for word in ["clearly", "definitely", "certainly", "obviously"]):
        confidence += 15
    
    # Decrease for hedging language
    if any(word in response.lower() for word in ["might", "possibly", "perhaps", "could be", "seems"]):
        confidence -= 15
    
    # Increase for brevity and clarity (not over-explaining)
    word_count = len(response.split())
    if word_count < 50:
        confidence += 10
    elif word_count > 200:
        confidence -= 10
    
    # Decrease if AI admits uncertainty
    if any(phrase in response.lower() for phrase in ["not sure", "uncertain", "don't know", "cannot determine"]):
        confidence -= 20
    
    return max(20.0, min(95.0, confidence))


@router.post("/batch")
async def test_batch_questions(questionIds: List[str], models: List[str]):
    """Test multiple questions with AI models"""
    results = []
    
    for question_id in questionIds:
        try:
            result = await test_single_question(
                AITestRequest(questionId=question_id, models=models)
            )
            results.append(result)
        except Exception as e:
            results.append({
                "questionId": question_id,
                "error": str(e)
            })
    
    return {
        "total": len(questionIds),
        "completed": len([r for r in results if "error" not in r]),
        "results": results
    }


@router.get("/results/{question_id}")
async def get_test_results(question_id: str):
    """Get test results for a question"""
    question = db.get_question(question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return {
        "questionId": question.id,
        "exploitabilityScore": question.exploitabilityScore,
        "testResults": question.aiTestResults or []
    }
