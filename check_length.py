import json
from pathlib import Path

# load JSON file from the same directory as this script
data_path = Path(__file__).with_name("ProblemSet.json")
with data_path.open("r", encoding="utf-8") as f:
	data = json.load(f)

print(len(data))