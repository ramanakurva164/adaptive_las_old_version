import uuid
from models import StudentProfile, AssessmentRequest
from typing import Dict, List

class Planner:
    """A deterministic Planner. Replaceable with an LLM-based planner later."""

    def __init__(self):
        pass

    def _strategy_to_distribution(self, strategy: str) -> Dict[str, int]:
        # maps pedagogical strategy to difficulty distribution (percent)
        s = strategy.upper()
        if s == 'REVIEW':
            return {'easy': 60, 'medium': 35, 'hard': 5}
        if s == 'NEW_TOPIC_INTRODUCTION':
            return {'easy': 50, 'medium': 40, 'hard': 10}
        if s == 'CHALLENGE':
            return {'easy': 20, 'medium': 50, 'hard': 30}
        # default safe option
        return {'easy': 50, 'medium': 40, 'hard': 10}

    def create_plan(self, student_profile: StudentProfile, assessment_request: AssessmentRequest) -> Dict:
        plan_id = str(uuid.uuid4())
        # Decide topics: prefer learning_goals first, else use mastered_topics to review
        if student_profile.learning_goals:
            selected_topics = student_profile.learning_goals[:3]
            reasoning = 'Focusing on learning goals.'
        elif student_profile.mastered_topics:
            selected_topics = student_profile.mastered_topics[:3]
            reasoning = 'No new goals; focusing on mastered topics for review.'
        else:
            selected_topics = ['General Math']
            reasoning = 'No explicit topics provided; using General Math.'

        distribution = self._strategy_to_distribution(assessment_request.pedagogical_strategy)
        # estimate number of questions by assuming average 5 minutes per question baseline
        avg_time_per_q = 5
        max_time = max(1, assessment_request.max_total_time_minutes)
        num_questions = max(1, int(max_time / avg_time_per_q))
        # Bound num_questions for quality
        if num_questions > 50:
            num_questions = 50

        reasoning_log = f"Planner reasoning: {reasoning} Strategy={assessment_request.pedagogical_strategy}. "                                 f"Estimated questions based on max_time {max_time} and avg_time_per_q {avg_time_per_q}."

        plan = {
            'plan_id': plan_id,
            'selected_topics': selected_topics,
            'difficulty_distribution': distribution,
            'num_questions': num_questions,
            'target_total_time': max_time,
            'reasoning_log': reasoning_log
        }
        return plan
