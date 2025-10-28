"""
Pydantic models for the AAD Framework
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime


class AITestResult(BaseModel):
    """Result from AI testing a question"""
    model: str
    accuracy: float = Field(ge=0, le=100, description="Accuracy score 0-100")
    coherence: float = Field(ge=0, le=100, description="Coherence score 0-100")
    response: str
    timestamp: datetime = Field(default_factory=datetime.now)


class Question(BaseModel):
    """Core question model"""
    id: str
    text: str
    course: Literal["NLP", "Software Engineering I"] = "NLP"
    type: Literal["multiple-choice", "short-answer", "essay", "coding", "project"]
    
    # AAD Framework Criteria
    bloomLevel: int = Field(ge=1, le=6, description="Bloom's Taxonomy level 1-6")
    contextDependency: int = Field(ge=1, le=5, description="Context dependency 1-5")
    novelty: int = Field(ge=1, le=5, description="Novelty level 1-5")
    
    # Results
    exploitabilityScore: Optional[float] = Field(None, ge=0, le=100)
    aiTestResults: Optional[List[AITestResult]] = None
    
    # Metadata
    createdAt: datetime = Field(default_factory=datetime.now)
    updatedAt: datetime = Field(default_factory=datetime.now)
    tags: Optional[List[str]] = None
    
    # Additional fields for richer questions
    expectedAnswer: Optional[str] = None
    rubric: Optional[dict] = None
    options: Optional[List[str]] = None  # For multiple choice
    correctAnswer: Optional[int] = None  # Index for multiple choice


class QuestionCreate(BaseModel):
    """Model for creating a new question"""
    text: str
    course: Literal["NLP", "Software Engineering I"] = "NLP"
    type: Literal["multiple-choice", "short-answer", "essay", "coding", "project"]
    bloomLevel: int = Field(ge=1, le=6)
    contextDependency: int = Field(ge=1, le=5)
    novelty: int = Field(ge=1, le=5)
    tags: Optional[List[str]] = None
    expectedAnswer: Optional[str] = None
    rubric: Optional[dict] = None
    options: Optional[List[str]] = None
    correctAnswer: Optional[int] = None


class QuestionUpdate(BaseModel):
    """Model for updating a question"""
    text: Optional[str] = None
    course: Optional[Literal["NLP", "Software Engineering I"]] = None
    type: Optional[Literal["multiple-choice", "short-answer", "essay", "coding", "project"]] = None
    bloomLevel: Optional[int] = Field(None, ge=1, le=6)
    contextDependency: Optional[int] = Field(None, ge=1, le=5)
    novelty: Optional[int] = Field(None, ge=1, le=5)
    tags: Optional[List[str]] = None


class ESCalculationRequest(BaseModel):
    """Request to calculate Exploitability Score"""
    bloomLevel: int = Field(ge=1, le=6)
    contextDependency: int = Field(ge=1, le=5)
    novelty: int = Field(ge=1, le=5)
    aiAccuracy: Optional[float] = Field(None, ge=0, le=100)


class ESCalculationResponse(BaseModel):
    """Response with calculated ES"""
    exploitabilityScore: float
    interpretation: str
    breakdown: dict


class AITestRequest(BaseModel):
    """Request to test question with AI"""
    questionId: str
    models: List[str]


class BatchTestRequest(BaseModel):
    """Request to test multiple questions"""
    questionIds: List[str]
    models: List[str]


class StatisticsResponse(BaseModel):
    """Overall statistics"""
    totalQuestions: int
    averageES: float
    aiResistantPercentage: float
    testsRun: int
    questionsByType: dict
    questionsByCourse: dict
    esDistribution: dict


class CorrelationResponse(BaseModel):
    """Correlation analysis results"""
    bloomVsES: float
    contextVsES: float
    noveltyVsES: float
    correlationMatrix: dict
