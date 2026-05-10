@echo off
echo Starting AI Image Search Service...
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Run the service
echo.
echo Starting service on http://localhost:8087
echo API docs available at http://localhost:8087/docs
echo.
python run.py
