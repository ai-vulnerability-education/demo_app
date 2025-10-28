"""
Exploitability Score (ES) Calculation Service

This module implements the core algorithm for calculating how vulnerable
an assessment question is to AI exploitation.

Formula:
ES = (w1 * bloom_factor) + (w2 * context_factor) + 
     (w3 * novelty_factor) + (w4 * ai_accuracy)

Lower ES = More AI-resistant
"""
from typing import Optional, Dict, List


class ESCalculator:
    """Calculate Exploitability Scores for assessment questions"""
    
    # Weights for ES calculation (must sum to 1.0)
    BLOOM_WEIGHT = 0.15
    CONTEXT_WEIGHT = 0.25
    NOVELTY_WEIGHT = 0.25
    AI_ACCURACY_WEIGHT = 0.35
    
    # Scaling factors
    BLOOM_SCALE = 10
    CONTEXT_SCALE = 15
    NOVELTY_SCALE = 15
    
    @classmethod
    def calculate(
        cls,
        bloom_level: int,
        context_dependency: int,
        novelty: int,
        ai_accuracy: Optional[float] = None
    ) -> float:
        """
        Calculate Exploitability Score (0-100)
        
        Args:
            bloom_level: Bloom's Taxonomy level (1-6)
            context_dependency: Context dependency (1-5)
            novelty: Novelty level (1-5)
            ai_accuracy: Average AI accuracy from tests (0-100), optional
            
        Returns:
            Exploitability Score (0-100)
        """
        # Invert scales - higher values should reduce ES
        # Bloom: 1=Remember (easy for AI) → 6=Create (hard for AI)
        bloom_factor = (7 - bloom_level) * cls.BLOOM_SCALE
        
        # Context: 1=Generic (easy for AI) → 5=Course-specific (hard for AI)
        context_factor = (6 - context_dependency) * cls.CONTEXT_SCALE
        
        # Novelty: 1=Common (easy for AI) → 5=Unique (hard for AI)
        novelty_factor = (6 - novelty) * cls.NOVELTY_SCALE
        
        # Calculate base ES from criteria
        base_es = (
            cls.BLOOM_WEIGHT * bloom_factor +
            cls.CONTEXT_WEIGHT * context_factor +
            cls.NOVELTY_WEIGHT * novelty_factor
        )
        
        # Add AI accuracy component if available
        if ai_accuracy is not None:
            base_es += cls.AI_ACCURACY_WEIGHT * ai_accuracy
        
        # Ensure ES is in valid range
        return max(0.0, min(100.0, base_es))
    
    @classmethod
    def get_interpretation(cls, es: float) -> str:
        """Get human-readable interpretation of ES"""
        if es < 30:
            return "AI-Resistant"
        elif es < 50:
            return "Moderately Resistant"
        elif es < 70:
            return "Moderately Vulnerable"
        else:
            return "Highly Vulnerable"
    
    @classmethod
    def get_color_code(cls, es: float) -> str:
        """Get color code for UI display"""
        if es < 30:
            return "green"
        elif es < 50:
            return "blue"
        elif es < 70:
            return "yellow"
        else:
            return "red"
    
    @classmethod
    def get_breakdown(
        cls,
        bloom_level: int,
        context_dependency: int,
        novelty: int,
        ai_accuracy: Optional[float] = None
    ) -> Dict[str, any]:
        """Get detailed breakdown of ES calculation"""
        bloom_factor = (7 - bloom_level) * cls.BLOOM_SCALE
        context_factor = (6 - context_dependency) * cls.CONTEXT_SCALE
        novelty_factor = (6 - novelty) * cls.NOVELTY_SCALE
        
        bloom_contribution = cls.BLOOM_WEIGHT * bloom_factor
        context_contribution = cls.CONTEXT_WEIGHT * context_factor
        novelty_contribution = cls.NOVELTY_WEIGHT * novelty_factor
        
        breakdown = {
            "bloomContribution": round(bloom_contribution, 2),
            "contextContribution": round(context_contribution, 2),
            "noveltyContribution": round(novelty_contribution, 2),
            "criteriaTotal": round(
                bloom_contribution + context_contribution + novelty_contribution, 2
            ),
        }
        
        if ai_accuracy is not None:
            ai_contribution = cls.AI_ACCURACY_WEIGHT * ai_accuracy
            breakdown["aiAccuracyContribution"] = round(ai_contribution, 2)
            breakdown["totalES"] = round(
                breakdown["criteriaTotal"] + ai_contribution, 2
            )
        else:
            breakdown["aiAccuracyContribution"] = None
            breakdown["totalES"] = breakdown["criteriaTotal"]
        
        return breakdown
    
    @classmethod
    def get_recommendations(
        cls,
        bloom_level: int,
        context_dependency: int,
        novelty: int,
        es: float
    ) -> List[str]:
        """Generate actionable recommendations to improve AI-resistance"""
        recommendations = []
        
        # Check each dimension and provide specific advice
        if bloom_level < 4:
            recommendations.append(
                "⬆️ Increase cognitive complexity: Move from recall/comprehension "
                "to analysis, evaluation, or creation tasks"
            )
        
        if context_dependency < 3:
            recommendations.append(
                "🎯 Add course-specific context: Reference specific projects, "
                "lectures, or datasets from your course"
            )
        
        if novelty < 3:
            recommendations.append(
                "✨ Increase uniqueness: Create scenarios specific to your "
                "institution or require synthesis of multiple course concepts"
            )
        
        if es > 70:
            recommendations.append(
                "🔄 Consider redesigning as a project-based or reflective "
                "assessment that requires personal experience"
            )
        
        if es > 50:
            recommendations.append(
                "📝 Add a metacognitive component: Ask students to explain "
                "their reasoning or reflect on their learning process"
            )
        
        # Always include at least one recommendation
        if not recommendations:
            recommendations.append(
                "✅ This question shows good AI-resistance! Consider using "
                "similar patterns for other assessments"
            )
        
        return recommendations


def calculate_batch_statistics(questions: List[Dict]) -> Dict:
    """Calculate statistics across multiple questions"""
    if not questions:
        return {
            "totalQuestions": 0,
            "averageES": 0,
            "aiResistantCount": 0,
            "aiResistantPercentage": 0
        }
    
    total = len(questions)
    total_es = sum(q.get("exploitabilityScore", 0) for q in questions)
    ai_resistant = sum(1 for q in questions if q.get("exploitabilityScore", 100) < 30)
    
    return {
        "totalQuestions": total,
        "averageES": round(total_es / total, 2) if total > 0 else 0,
        "aiResistantCount": ai_resistant,
        "aiResistantPercentage": round((ai_resistant / total) * 100, 2) if total > 0 else 0
    }
