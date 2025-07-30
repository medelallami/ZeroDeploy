import os
import sys

# Add the parent directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))) 

# Import the app from main.py
from backend.main import app

# This file serves as the entry point for uvicorn
# The app object is imported from main.py