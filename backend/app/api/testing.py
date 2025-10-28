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

router = APIRouter(prefix="/api/test", tags=["testing"])


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
        # Get AI response
        ai_result = await openrouter_client.test_question(
            question_text=question.text,
            model=model
        )
        
        # Score the response
        scores = response_scorer.score_response(
            response=ai_result["response"],
            question_text=question.text,
            expected_answer=question.expectedAnswer,
            rubric=question.rubric
        )
        
        # Create result object
        test_result = AITestResult(
            model=model,
            accuracy=scores["accuracy"],
            coherence=scores["coherence"],
            response=ai_result["response"],
            timestamp=datetime.now()
        )
        results.append(test_result)
    
    # Update question with results
    if not question.aiTestResults:
        question.aiTestResults = []
    question.aiTestResults.extend(results)
    
    # Recalculate ES with AI accuracy
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
        "testResults": results
    }


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
