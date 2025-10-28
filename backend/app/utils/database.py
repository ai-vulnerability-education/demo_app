"""
In-memory database for storing questions and results

For production, this could be replaced with SQLAlchemy + PostgreSQL
"""
import json
from typing import List, Optional, Dict
from pathlib import Path
from datetime import datetime
from app.models.schemas import Question, QuestionCreate


class Database:
    """Simple in-memory database with JSON persistence"""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        self.questions_file = self.data_dir / "questions.json"
        self.questions: Dict[str, Question] = {}
        self.load_data()
    
    def load_data(self):
        """Load questions from JSON file"""
        # Try to load from questions.json (runtime data)
        if self.questions_file.exists():
            with open(self.questions_file, 'r') as f:
                data = json.load(f)
                for q_data in data:
                    question = Question(**q_data)
                    self.questions[question.id] = question
        
        # If empty, load from sample_questions.json
        if not self.questions:
            sample_file = self.data_dir / "sample_questions.json"
            if sample_file.exists():
                with open(sample_file, 'r') as f:
                    data = json.load(f)
                    for q_data in data:
                        # Calculate initial ES if not present
                        if "exploitabilityScore" not in q_data:
                            from app.services.es_calculator import ESCalculator
                            q_data["exploitabilityScore"] = ESCalculator.calculate(
                                bloom_level=q_data["bloomLevel"],
                                context_dependency=q_data["contextDependency"],
                                novelty=q_data["novelty"]
                            )
                        question = Question(**q_data)
                        self.questions[question.id] = question
                self.save_data()
    
    def save_data(self):
        """Save questions to JSON file"""
        data = [q.model_dump() for q in self.questions.values()]
        # Convert datetime objects to ISO format strings
        for q in data:
            if isinstance(q.get('createdAt'), datetime):
                q['createdAt'] = q['createdAt'].isoformat()
            if isinstance(q.get('updatedAt'), datetime):
                q['updatedAt'] = q['updatedAt'].isoformat()
            if q.get('aiTestResults'):
                for result in q['aiTestResults']:
                    if isinstance(result.get('timestamp'), datetime):
                        result['timestamp'] = result['timestamp'].isoformat()
        
        with open(self.questions_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def get_all_questions(
        self,
        course: Optional[str] = None,
        question_type: Optional[str] = None,
        min_es: Optional[float] = None,
        max_es: Optional[float] = None,
        bloom_level: Optional[int] = None
    ) -> List[Question]:
        """Get all questions with optional filters"""
        questions = list(self.questions.values())
        
        if course:
            questions = [q for q in questions if q.course == course]
        
        if question_type:
            questions = [q for q in questions if q.type == question_type]
        
        if min_es is not None:
            questions = [
                q for q in questions 
                if q.exploitabilityScore is not None and q.exploitabilityScore >= min_es
            ]
        
        if max_es is not None:
            questions = [
                q for q in questions 
                if q.exploitabilityScore is not None and q.exploitabilityScore <= max_es
            ]
        
        if bloom_level is not None:
            questions = [q for q in questions if q.bloomLevel == bloom_level]
        
        return questions
    
    def get_question(self, question_id: str) -> Optional[Question]:
        """Get a single question by ID"""
        return self.questions.get(question_id)
    
    def create_question(self, question: QuestionCreate) -> Question:
        """Create a new question"""
        from app.services.es_calculator import ESCalculator
        
        # Generate ID
        question_id = f"q_{len(self.questions) + 1:04d}"
        
        # Calculate initial ES
        es = ESCalculator.calculate(
            bloom_level=question.bloomLevel,
            context_dependency=question.contextDependency,
            novelty=question.novelty
        )
        
        # Create question object
        new_question = Question(
            id=question_id,
            **question.model_dump(),
            exploitabilityScore=es,
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        self.questions[question_id] = new_question
        self.save_data()
        
        return new_question
    
    def update_question(self, question_id: str, updates: dict) -> Optional[Question]:
        """Update an existing question"""
        question = self.questions.get(question_id)
        if not question:
            return None
        
        # Update fields
        for key, value in updates.items():
            if value is not None and hasattr(question, key):
                setattr(question, key, value)
        
        # Recalculate ES if criteria changed
        if any(k in updates for k in ['bloomLevel', 'contextDependency', 'novelty']):
            from app.services.es_calculator import ESCalculator
            question.exploitabilityScore = ESCalculator.calculate(
                bloom_level=question.bloomLevel,
                context_dependency=question.contextDependency,
                novelty=question.novelty,
                ai_accuracy=(
                    sum(r.accuracy for r in question.aiTestResults) / len(question.aiTestResults)
                    if question.aiTestResults else None
                )
            )
        
        question.updatedAt = datetime.now()
        self.save_data()
        
        return question
    
    def delete_question(self, question_id: str) -> bool:
        """Delete a question"""
        if question_id in self.questions:
            del self.questions[question_id]
            self.save_data()
            return True
        return False


# Global database instance
db = Database()
