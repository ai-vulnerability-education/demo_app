"""
OpenRouter API Client for AI Testing

This service handles communication with OpenRouter to test questions
against various AI models (GPT-4, Claude, Gemini, etc.)
"""
import asyncio
import httpx
from typing import Dict, List
from app.config import settings


class OpenRouterClient:
    """Client for OpenRouter API"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.openrouter_api_key
        self.base_url = settings.openrouter_base_url
    
    async def test_question(
        self,
        question_text: str,
        model: str,
        system_prompt: str = None
    ) -> Dict:
        """
        Test a question with an AI model
        
        Args:
            question_text: The question to test
            model: Model identifier (e.g., 'openai/gpt-4-turbo')
            system_prompt: Optional system prompt override
            
        Returns:
            Dict with 'response' and 'model' keys
        """
        if not self.api_key or self.api_key == "your_openrouter_api_key_here":
            # Return mock response for demo purposes
            return await self._mock_response(question_text, model)
        
        # Default adversarial prompt
        if not system_prompt:
            system_prompt = (
                "You are a student trying to complete this assessment question "
                "using AI assistance. Provide the best possible answer."
            )
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": question_text}
                        ]
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                return {
                    "response": data["choices"][0]["message"]["content"],
                    "model": model
                }
        except Exception as e:
            print(f"Error calling OpenRouter: {e}")
            # Fallback to mock response
            return await self._mock_response(question_text, model)
    
    async def _mock_response(self, question_text: str, model: str) -> Dict:
        """Generate mock AI response for demo purposes"""
        # Simulate API delay
        await asyncio.sleep(1)
        
        # Generate different responses based on question complexity
        question_lower = question_text.lower()
        
        if "what is" in question_lower or "define" in question_lower:
            # Simple factual question - high quality response
            response = (
                "Based on the question, here is a comprehensive answer: "
                "[This is a simulated AI response for demo purposes. "
                "In production, this would be replaced with actual AI model output.] "
                "The concept can be explained by understanding its fundamental principles "
                "and applications in the field. Key points include theoretical foundations, "
                "practical implementations, and real-world examples."
            )
        elif "compare" in question_lower or "analyze" in question_lower:
            # Medium complexity - moderate quality
            response = (
                "A comparative analysis reveals several important distinctions. "
                "[Simulated response] While both approaches share common ground, "
                "they differ in methodology, application scope, and expected outcomes. "
                "The trade-offs between them depend on specific use cases."
            )
        elif "project" in question_lower or "uvu" in question_lower or "canvas" in question_lower:
            # Context-specific question - lower quality (AI struggles)
            response = (
                "I can provide general guidance on this topic. [Simulated response] "
                "However, without access to the specific project details, course materials, "
                "or institutional context mentioned, I can only offer generic suggestions. "
                "A complete answer would require familiarity with the particular scenario described."
            )
        else:
            # Default response
            response = (
                "[This is a simulated AI response for demonstration purposes] "
                "The question addresses important concepts in the field. "
                "A thorough answer would consider multiple perspectives and "
                "provide evidence-based reasoning."
            )
        
        return {
            "response": response,
            "model": model
        }
    
    async def test_multiple_models(
        self,
        question_text: str,
        models: List[str]
    ) -> List[Dict]:
        """Test question against multiple models concurrently"""
        tasks = [
            self.test_question(question_text, model)
            for model in models
        ]
        results = await asyncio.gather(*tasks)
        return results


class ResponseScorer:
    """Score AI responses for accuracy and coherence"""
    
    @staticmethod
    def score_response(
        response: str,
        question_text: str,
        expected_answer: str = None,
        rubric: Dict = None
    ) -> Dict[str, float]:
        """
        Score an AI response for accuracy and coherence
        
        For demo purposes, this uses heuristics.
        In production, this could use:
        - Semantic similarity (sentence transformers)
        - Rubric-based evaluation
        - Human-in-the-loop validation
        
        Args:
            response: AI-generated response
            question_text: Original question
            expected_answer: Expected answer (if available)
            rubric: Grading rubric (if available)
            
        Returns:
            Dict with 'accuracy' and 'coherence' scores (0-100)
        """
        # Coherence scoring based on response quality indicators
        coherence = ResponseScorer._score_coherence(response)
        
        # Accuracy scoring
        if expected_answer:
            accuracy = ResponseScorer._score_accuracy_with_answer(
                response, expected_answer, question_text
            )
        else:
            accuracy = ResponseScorer._score_accuracy_heuristic(
                response, question_text
            )
        
        return {
            "accuracy": round(accuracy, 2),
            "coherence": round(coherence, 2)
        }
    
    @staticmethod
    def _score_coherence(response: str) -> float:
        """Score response coherence (0-100)"""
        score = 50.0  # Base score
        
        # Length indicators (not too short, not too verbose)
        word_count = len(response.split())
        if 50 <= word_count <= 300:
            score += 20
        elif 30 <= word_count < 50 or 300 < word_count <= 500:
            score += 10
        
        # Structure indicators
        if ". " in response:  # Multiple sentences
            score += 10
        
        if any(marker in response.lower() for marker in ["however", "therefore", "additionally", "furthermore"]):
            score += 10  # Logical connectors
        
        # Quality indicators
        if "[" not in response and "simulated" not in response.lower():
            score += 10  # Not a mock response
        
        return min(100.0, score)
    
    @staticmethod
    def _score_accuracy_with_answer(
        response: str,
        expected: str,
        question: str
    ) -> float:
        """Score accuracy when expected answer is available"""
        # Simple keyword matching (in production, use semantic similarity)
        expected_keywords = set(expected.lower().split())
        response_keywords = set(response.lower().split())
        
        # Jaccard similarity
        intersection = expected_keywords & response_keywords
        union = expected_keywords | response_keywords
        
        if not union:
            return 0.0
        
        similarity = len(intersection) / len(union)
        return similarity * 100
    
    @staticmethod
    def _score_accuracy_heuristic(response: str, question: str) -> float:
        """Score accuracy using heuristics when no expected answer"""
        score = 50.0
        
        # Check if response addresses the question
        question_keywords = set(question.lower().split())
        response_keywords = set(response.lower().split())
        overlap = len(question_keywords & response_keywords)
        
        if overlap > len(question_keywords) * 0.3:
            score += 20
        
        # Penalize if AI admits limitation (good for context-heavy questions)
        if any(phrase in response.lower() for phrase in [
            "without access", "would require", "specific context",
            "cannot provide", "general guidance"
        ]):
            score -= 30  # Lower accuracy when AI acknowledges limitations
        
        # Reward comprehensive responses
        if len(response.split()) > 100:
            score += 15
        
        return max(0.0, min(100.0, score))


# Global client instance
openrouter_client = OpenRouterClient()
response_scorer = ResponseScorer()
