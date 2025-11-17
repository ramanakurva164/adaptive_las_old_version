from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from models import StudentProfile, AssessmentRequest, AssessmentGenerationResponse, MathProblem
from data_access import ProblemStore
from planner import Planner
from executor import Executor
import uuid
import datetime

app = FastAPI(title='Adaptive Learning Orchestrator - Assessment Service')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['localhost', 'http://localhost:3000', 'https://localhost:3000'],
    allow_methods=['*'],
    allow_headers=['*'],
)

store = ProblemStore('ProblemSet.json')
planner = Planner()
executor = Executor(store)

# CRUD for problems
@app.get('/api/problems', response_model=list[MathProblem])
def list_problems(skip: int = 0, limit: int = 500):
    return store.list_problems(skip=skip, limit=limit)

@app.get('/api/problems/{problem_id}', response_model=MathProblem)
def get_problem(problem_id: str):
    p = store.get_problem(problem_id)
    if not p:
        raise HTTPException(status_code=404, detail='Problem not found')
    return p

@app.post('/api/problems', response_model=MathProblem, status_code=201)
def create_problem(problem: MathProblem):
    if store.get_problem(problem.id):
        raise HTTPException(status_code=400, detail='Problem with this id already exists')
    store.add_problem(problem.dict())
    return problem

@app.put('/api/problems/{problem_id}', response_model=MathProblem)
def update_problem(problem_id: str, problem: MathProblem):
    if not store.get_problem(problem_id):
        raise HTTPException(status_code=404, detail='Problem not found')
    store.update_problem(problem_id, problem.dict())
    return problem

@app.delete('/api/problems/{problem_id}', status_code=204)
def delete_problem(problem_id: str):
    if not store.get_problem(problem_id):
        raise HTTPException(status_code=404, detail='Problem not found')
    store.delete_problem(problem_id)
    return None

# Orchestration endpoint
@app.post('/api/assessments/generate', response_model=AssessmentGenerationResponse)
def generate_assessment(payload: dict = Body(...)):
    # Basic validation & parsing via Pydantic models
    try:
        student_profile = StudentProfile(**payload['student_profile'])
        assessment_request = AssessmentRequest(**payload['assessment_request'])
    except Exception as e:
        raise HTTPException(status_code=422, detail=f'Invalid payload: {e}')

    plan = planner.create_plan(student_profile, assessment_request)
    generated = executor.execute_plan(plan)

    response = {
        'assessment_id': str(uuid.uuid4()),
        'planner_output': {
            'plan_id': plan['plan_id'],
            'reasoning_log': plan['reasoning_log'],
            'assessment_plan': plan,
        },
        'executor_output': generated,
        'generated_at': datetime.datetime.utcnow().isoformat() + 'Z'
    }
    return response
