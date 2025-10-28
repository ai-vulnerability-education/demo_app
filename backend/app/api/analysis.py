"""
API routes for statistical analysis
"""
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.models.schemas import StatisticsResponse, CorrelationResponse
from app.utils.database import db
import numpy as np
from scipy import stats
import json
import io

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.get("/statistics", response_model=StatisticsResponse)
async def get_statistics():
    """Get overall statistics"""
    questions = db.get_all_questions()
    
    if not questions:
        return StatisticsResponse(
            totalQuestions=0,
            averageES=0,
            aiResistantPercentage=0,
            testsRun=0,
            questionsByType={},
            questionsByCourse={},
            esDistribution={}
        )
    
    # Calculate statistics
    total = len(questions)
    total_es = sum(q.exploitabilityScore or 0 for q in questions)
    avg_es = total_es / total if total > 0 else 0
    
    ai_resistant = sum(1 for q in questions if (q.exploitabilityScore or 100) < 30)
    ai_resistant_pct = (ai_resistant / total * 100) if total > 0 else 0
    
    tests_run = sum(
        len(q.aiTestResults) if q.aiTestResults else 0
        for q in questions
    )
    
    # Questions by type
    by_type = {}
    for q in questions:
        by_type[q.type] = by_type.get(q.type, 0) + 1
    
    # Questions by course
    by_course = {}
    for q in questions:
        by_course[q.course] = by_course.get(q.course, 0) + 1
    
    # ES distribution (bins)
    es_bins = {
        "0-30": 0,    # AI-Resistant
        "30-50": 0,   # Moderately Resistant
        "50-70": 0,   # Moderately Vulnerable
        "70-100": 0   # Highly Vulnerable
    }
    
    for q in questions:
        es = q.exploitabilityScore or 0
        if es < 30:
            es_bins["0-30"] += 1
        elif es < 50:
            es_bins["30-50"] += 1
        elif es < 70:
            es_bins["50-70"] += 1
        else:
            es_bins["70-100"] += 1
    
    return StatisticsResponse(
        totalQuestions=total,
        averageES=round(avg_es, 2),
        aiResistantPercentage=round(ai_resistant_pct, 2),
        testsRun=tests_run,
        questionsByType=by_type,
        questionsByCourse=by_course,
        esDistribution=es_bins
    )


@router.get("/correlation", response_model=CorrelationResponse)
async def get_correlation():
    """Get correlation analysis"""
    questions = db.get_all_questions()
    
    if len(questions) < 2:
        return CorrelationResponse(
            bloomVsES=0,
            contextVsES=0,
            noveltyVsES=0,
            correlationMatrix={}
        )
    
    # Extract data
    bloom_levels = [q.bloomLevel for q in questions]
    context_deps = [q.contextDependency for q in questions]
    novelties = [q.novelty for q in questions]
    es_scores = [q.exploitabilityScore or 0 for q in questions]
    
    # Calculate correlations
    bloom_vs_es = np.corrcoef(bloom_levels, es_scores)[0, 1]
    context_vs_es = np.corrcoef(context_deps, es_scores)[0, 1]
    novelty_vs_es = np.corrcoef(novelties, es_scores)[0, 1]
    
    # Full correlation matrix
    data = np.array([bloom_levels, context_deps, novelties, es_scores])
    corr_matrix = np.corrcoef(data)
    
    correlation_matrix = {
        "labels": ["Bloom's Level", "Context Dependency", "Novelty", "ES"],
        "matrix": corr_matrix.tolist()
    }
    
    return CorrelationResponse(
        bloomVsES=round(float(bloom_vs_es), 3),
        contextVsES=round(float(context_vs_es), 3),
        noveltyVsES=round(float(novelty_vs_es), 3),
        correlationMatrix=correlation_matrix
    )


@router.post("/regression")
async def run_regression():
    """Run regression analysis"""
    questions = db.get_all_questions()
    
    if len(questions) < 10:
        return {
            "error": "Not enough data for regression analysis (minimum 10 questions)"
        }
    
    # Prepare data
    X = np.array([
        [q.bloomLevel, q.contextDependency, q.novelty]
        for q in questions
    ])
    y = np.array([q.exploitabilityScore or 0 for q in questions])
    
    # Simple linear regression for each feature
    results = {}
    features = ["bloomLevel", "contextDependency", "novelty"]
    
    for i, feature in enumerate(features):
        slope, intercept, r_value, p_value, std_err = stats.linregress(X[:, i], y)
        results[feature] = {
            "slope": round(float(slope), 3),
            "intercept": round(float(intercept), 3),
            "r_squared": round(float(r_value ** 2), 3),
            "p_value": round(float(p_value), 4),
            "std_error": round(float(std_err), 3)
        }
    
    return {
        "message": "Regression analysis completed",
        "sampleSize": len(questions),
        "results": results,
        "interpretation": {
            "bloomLevel": "Negative slope indicates higher Bloom's level reduces ES",
            "contextDependency": "Negative slope indicates higher context reduces ES",
            "novelty": "Negative slope indicates higher novelty reduces ES"
        }
    }


@router.get("/export")
async def export_data(format: str = "json"):
    """Export data for analysis"""
    questions = db.get_all_questions()
    
    if format == "json":
        data = [q.model_dump() for q in questions]
        
        # Convert to JSON string
        json_str = json.dumps(data, indent=2, default=str)
        
        # Create streaming response
        return StreamingResponse(
            io.StringIO(json_str),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=questions_export.json"}
        )
    
    elif format == "csv":
        import csv
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "ID", "Text", "Course", "Type", "Bloom Level",
            "Context Dependency", "Novelty", "Exploitability Score"
        ])
        
        # Data
        for q in questions:
            writer.writerow([
                q.id, q.text, q.course, q.type,
                q.bloomLevel, q.contextDependency, q.novelty,
                q.exploitabilityScore or 0
            ])
        
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=questions_export.csv"}
        )
    
    else:
        return {"error": "Invalid format. Use 'json' or 'csv'"}
