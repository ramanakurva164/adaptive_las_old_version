# Adaptive Learning Orchestrator - Assessment Generation Service

## What this project contains
- A small FastAPI-based web API implementing a decoupled Planner + Executor orchestration pattern.
- CRUD endpoints for managing problems (`/api/problems`).
- The main orchestration endpoint: `POST /api/assessments/generate` which returns planner reasoning and executor output.
- A small `problems.json` sample dataset (you can replace this with a larger JSON file or a proper DB).

## How the system is structured (short)
- `main.py` - FastAPI application and route wiring.
- `models.py` - Pydantic models used across the app.
- `data_access.py` - Simple file-backed CRUD for `problems.json` (safe for dev; use a DB in prod).
- `planner.py` - The Planner component (deterministic logic that produces an AssessmentPlan).
- `executor.py` - The Executor component (follows the AssessmentPlan and selects problems).
- `problems.json` - Sample problems dataset.

## Running locally (quick)
1. Create a virtual environment and install requirements:
   ```bash
   python -m venv .venv
   source .venv/bin/activate   # or .venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```
2. Start the app:
   ```bash
   uvicorn main:app --reload
   ```
3. Open interactive docs at `http://127.0.0.1:8000/docs`.

## Notes (what's intentionally omitted)
- This repository intentionally does **not** include deployment instructions or testing files, per request.
- For production readiness: replace JSON-backed storage with a DB (Postgres/Mongo), add caching, and secure endpoints.

## Planner-Executor contract (short)
- `AssessmentPlan` (returned by Planner) contains:
  - `plan_id`, `selected_topics`, `difficulty_distribution` (easy/medium/hard as percentages),
    `num_questions`, `target_total_time`, and `reasoning_log`.
- The Executor receives an `AssessmentPlan` and returns a `GeneratedAssessment` containing selected problems,
  total estimated time, and metadata linking back to the plan.

## Extending
- Swap `planner.py` with an LLM-based planner by implementing the same `create_plan(...)` signature.
- Use `executor.py` as-is or replace the selection strategy to support richer constraints.
