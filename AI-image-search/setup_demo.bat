@echo off
REM Setup script for Photo Similarity Demo
REM This script installs required dependencies and runs the demo

echo ========================================
echo Photo Similarity Search Demo - Setup
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.7 or higher
    pause
    exit /b 1
)

echo [1/4] Checking Python installation...
python --version
echo.

echo [2/4] Installing Gradio...
pip install gradio>=3.50.0
if errorlevel 1 (
    echo ERROR: Failed to install Gradio
    pause
    exit /b 1
)
echo.

echo [3/4] Verifying installation...
python -c "import gradio; print(f'Gradio {gradio.__version__} installed successfully')"
if errorlevel 1 (
    echo ERROR: Gradio installation verification failed
    pause
    exit /b 1
)
echo.

echo [4/4] Checking embeddings...
if not exist "embeddings\all_embeddings.csv" (
    echo.
    echo WARNING: Embeddings not found!
    echo Please run: python extract_features.py
    echo.
    pause
    exit /b 1
)
echo Embeddings found: embeddings\all_embeddings.csv
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the demo, run:
echo   python similarity_demo.py
echo.
echo Or press any key to start now...
pause >nul

echo.
echo Starting demo...
python similarity_demo.py
