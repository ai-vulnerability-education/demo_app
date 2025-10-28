"""
API routes for question management
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.schemas import (
    Question, QuestionCreate, QuestionUpdate
)
from app.utils.database import db

router = APIRouter(prefix="/api/questions", tags=["questions"])


@router.get("", response_model=List[Question])
async def list_questions(
    course: Optional[str] = Query(None, description="Filter by course"),
    question_type: Optional[str] = Query(None, description="Filter by type"),
    min_es: Optional[float] = Query(None, ge=0, le=100, description="Minimum ES"),
    max_es: Optional[float] = Query(None, ge=0, le=100, description="Maximum ES"),
    bloom_level: Optional[int] = Query(None, ge=1, le=6, description="Bloom's level")
):
    """Get all questions with optional filters"""
    questions = db.get_all_questions(
        course=course,
        question_type=question_type,
        min_es=min_es,
        max_es=max_es,
        bloom_level=bloom_level
    )
    return questions


@router.get("/{question_id}", response_model=Question)
async def get_question(question_id: str):
    """Get a single question by ID"""
    question = db.get_question(question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


@router.post("", response_model=Question, status_code=201)
async def create_question(question: QuestionCreate):
    """Create a new question"""
    new_question = db.create_question(question)
    return new_question


@router.put("/{question_id}", response_model=Question)
async def update_question(question_id: str, updates: QuestionUpdate):
    """Update an existing question"""
    updated_question = db.update_question(
        question_id,
        updates.model_dump(exclude_unset=True)
    )
    if not updated_question:
        raise HTTPException(status_code=404, detail="Question not found")
    return updated_question


@router.delete("/{question_id}", status_code=204)
async def delete_question(question_id: str):
    """Delete a question"""
    success = db.delete_question(question_id)
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")
    return None
