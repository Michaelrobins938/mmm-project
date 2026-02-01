@echo off
REM Setup script for Bayesian Media Mix Model (MMM) - Windows

echo Setting up Bayesian MMM...

REM Check Python version
python --version

REM Create virtual environment
echo Creating virtual environment...
python -m venv venv

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate

REM Upgrade pip
echo Upgrading pip...
pip install --upgrade pip

REM Install requirements
echo Installing dependencies...
pip install -r requirements.txt

REM Create necessary directories
echo Creating directories...
mkdir data 2>nul
mkdir models 2>nul

REM Run quick test
echo Running quick test...
python src\main.py --quick

if %errorlevel% equ 0 (
    echo ✅ Setup complete! All tests passed.
    echo.
    echo To get started:
    echo   1. Activate virtual environment: venv\Scripts\activate
    echo   2. Run demo: python src\main.py
    echo   3. Start API: python api.py
    echo   4. Start dashboard: cd frontend ^&^& npm install ^&^& npm start
) else (
    echo ❌ Setup failed. Please check the error messages above.
    exit /b 1
)