from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class StudentProfile(BaseModel):
    student_id: str = Field(alias='id')
    current_level: str
    learning_history: List[dict] = []
    learning_goals: List[str] = []
    mastered_topics: List[str] = []  # Add this field too
    
    class Config:
        populate_by_name = True

class AssessmentRequest(BaseModel):
    max_total_time_minutes: int
    pedagogical_strategy: str

class MathProblem(BaseModel):
    id: str
    text: str
    topic: str
    difficulty: int
    estimated_time_to_solve_minutes: int

class AssessmentPlan(BaseModel):
    plan_id: str
    selected_topics: List[str]
    difficulty_distribution: Dict[str, int]
    num_questions: int
    target_total_time: int
    reasoning_log: str

class GeneratedAssessment(BaseModel):
    assessment_id: str
    plan_id: str
    problems: List[MathProblem]
    total_estimated_time: int
    metadata: Dict[str, str]

class AssessmentGenerationResponse(BaseModel):
    assessment_id: str
    planner_output: Dict
    executor_output: GeneratedAssessment
    generated_at: str
