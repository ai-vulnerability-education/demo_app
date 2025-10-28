"""
API routes for exploitability score calculation
"""
from fastapi import APIRouter
from app.models.schemas import ESCalculationRequest, ESCalculationResponse
from app.services.es_calculator import ESCalculator

router = APIRouter(prefix="/api/es", tags=["exploitability-score"])


@router.post("/calculate", response_model=ESCalculationResponse)
async def calculate_es(request: ESCalculationRequest):
    """Calculate Exploitability Score from criteria"""
    es = ESCalculator.calculate(
        bloom_level=request.bloomLevel,
        context_dependency=request.contextDependency,
        novelty=request.novelty,
        ai_accuracy=request.aiAccuracy
    )
    
    interpretation = ESCalculator.get_interpretation(es)
    breakdown = ESCalculator.get_breakdown(
        bloom_level=request.bloomLevel,
        context_dependency=request.contextDependency,
        novelty=request.novelty,
        ai_accuracy=request.aiAccuracy
    )
    
    recommendations = ESCalculator.get_recommendations(
        bloom_level=request.bloomLevel,
        context_dependency=request.contextDependency,
        novelty=request.novelty,
        es=es
    )
    
    breakdown["recommendations"] = recommendations
    breakdown["colorCode"] = ESCalculator.get_color_code(es)
    
    return ESCalculationResponse(
        exploitabilityScore=round(es, 2),
        interpretation=interpretation,
        breakdown=breakdown
    )


@router.post("/predict")
async def predict_es(
    bloomLevel: int,
    contextDependency: int,
    novelty: int
):
    """Predict ES without AI testing (criteria only)"""
    es = ESCalculator.calculate(
        bloom_level=bloomLevel,
        context_dependency=contextDependency,
        novelty=novelty
    )
    
    return {
        "estimatedES": round(es, 2),
        "interpretation": ESCalculator.get_interpretation(es),
        "note": "This is an estimate based on criteria only. Actual ES may vary after AI testing."
    }
