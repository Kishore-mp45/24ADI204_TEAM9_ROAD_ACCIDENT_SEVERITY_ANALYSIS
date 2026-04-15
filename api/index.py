import sys
import os

# Ensure the parent directory is in the Python path so the 'backend' folder module can be identified during the Vercel remote serverless build.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app
