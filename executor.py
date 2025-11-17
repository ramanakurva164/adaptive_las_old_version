import uuid
from models import MathProblem, GeneratedAssessment
from typing import Dict, List
import random

class Executor:
    def __init__(self, problem_store):
        self.store = problem_store

    def _difficulty_to_ranges(self, difficulty_label: str) -> List[int]:
        # Map easy/medium/hard label to integer difficulty values
        if difficulty_label == 'easy':
            return [1,2]
        if difficulty_label == 'medium':
            return [3]
        if difficulty_label == 'hard':
            return [4,5]
        return [1,2,3]

    def execute_plan(self, plan: Dict) -> Dict:
        selected_topics = plan.get('selected_topics', [])
        distribution = plan.get('difficulty_distribution', {'easy':50,'medium':40,'hard':10})
        num_questions = plan.get('num_questions', 5)
        target_time = plan.get('target_total_time', 30)

        # flatten candidate problems for selected topics
        candidates = []
        all_problems = self.store._read_all()  # direct read to keep selection deterministic and simple
        for p in all_problems:
            if p.get('topic') in selected_topics:
                candidates.append(p)
        # if not enough candidates, widen to all topics
        if len(candidates) < num_questions:
            candidates = all_problems.copy()

        # Build counts by difficulty from distribution
        counts = {}
        for label, pct in distribution.items():
            counts[label] = max(0, int((pct/100.0) * num_questions))

        # adjust counts so sum == num_questions
        assigned = sum(counts.values())
        i = 0
        labels = list(counts.keys())
        while assigned < num_questions:
            counts[labels[i % len(labels)]] += 1
            assigned += 1
            i += 1
        while assigned > num_questions and any(counts.values()):
            # remove from the label with largest count
            max_label = max(counts, key=lambda k: counts[k])
            if counts[max_label] > 0:
                counts[max_label] -= 1
                assigned -= 1
            else:
                break

        chosen = []
        total_time = 0

        # select problems by label
        random.shuffle(candidates)
        for label, cnt in counts.items():
            allowed_diffs = self._difficulty_to_ranges(label)
            picked = [p for p in candidates if p.get('difficulty') in allowed_diffs and p not in chosen]
            # take up to cnt
            take = picked[:cnt]
            chosen.extend(take)

        # If still fewer than required, fill with any remaining candidates
        if len(chosen) < num_questions:
            for p in candidates:
                if p not in chosen:
                    chosen.append(p)
                if len(chosen) >= num_questions:
                    break

        # Respect target_time: if over time, drop lowest-priority problems (hard -> medium -> easy)
        total_time = sum(p.get('estimated_time_to_solve_minutes', 1) for p in chosen)
        if total_time > target_time:
            # sort chosen by difficulty descending (hardest first) and remove until fits
            chosen_sorted = sorted(chosen, key=lambda x: x.get('difficulty', 1), reverse=True)
            while chosen_sorted and total_time > target_time:
                removed = chosen_sorted.pop(0)
                chosen.remove(removed)
                total_time = sum(p.get('estimated_time_to_solve_minutes', 1) for p in chosen)

        # build response
        assessment = {
            'assessment_id': str(uuid.uuid4()),
            'plan_id': plan.get('plan_id'),
            'problems': chosen,
            'total_estimated_time': total_time,
            'metadata': {
                'strategy': str(plan.get('difficulty_distribution')),
                'target_time': str(target_time)
            }
        }
        return assessment
