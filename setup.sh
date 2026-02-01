#!/bin/bash

# Setup script for Bayesian Media Mix Model (MMM)

echo "Setting up Bayesian MMM..."

# Check Python version
python_version=$(python --version 2>&1 | awk '{print $2}')
echo "Python version: $python_version"

# Create virtual environment
echo "Creating virtual environment..."
python -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate || .\venv\Scripts\activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "Installing dependencies..."
pip install -r requirements.txt

# Create necessary directories
echo "Creating directories..."
mkdir -p data models

# Run quick test
echo "Running quick test..."
python src/main.py --quick

if [ $? -eq 0 ]; then
    echo "✅ Setup complete! All tests passed."
    echo ""
    echo "To get started:"
    echo "  1. Activate virtual environment: source venv/bin/activate"
    echo "  2. Run demo: python src/main.py"
    echo "  3. Start API: python api.py"
    echo "  4. Start dashboard: cd frontend && npm install && npm start"
else
    echo "❌ Setup failed. Please check the error messages above."
    exit 1
fi