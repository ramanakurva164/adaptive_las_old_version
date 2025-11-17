import json, threading, os
from typing import List, Optional
from models import MathProblem

class ProblemStore:
    def __init__(self, filename='ProblemSet.json'):
        self.filename = filename
        self.lock = threading.Lock()
        # ensure file exists
        if not os.path.exists(self.filename):
            with open(self.filename, 'w') as f:
                json.dump([], f)

    def _read_all(self):
        with self.lock:
            with open(self.filename, 'r') as f:
                return json.load(f)

    def _write_all(self, data):
        with self.lock:
            with open(self.filename, 'w') as f:
                json.dump(data, f, indent=2)

    def list_problems(self, skip=0, limit=100) -> List[MathProblem]:
        data = self._read_all()
        sliced = data[skip: skip + limit]
        return [MathProblem(**p) for p in sliced]

    def get_problem(self, problem_id: str) -> Optional[MathProblem]:
        data = self._read_all()
        for p in data:
            if p.get('id') == problem_id:
                return MathProblem(**p)
        return None

    def add_problem(self, problem_dict):
        data = self._read_all()
        data.append(problem_dict)
        self._write_all(data)

    def update_problem(self, problem_id, problem_dict):
        data = self._read_all()
        for i, p in enumerate(data):
            if p.get('id') == problem_id:
                data[i] = problem_dict
                self._write_all(data)
                return
        raise KeyError('Problem not found')

    def delete_problem(self, problem_id):
        data = self._read_all()
        new = [p for p in data if p.get('id') != problem_id]
        self._write_all(new)
