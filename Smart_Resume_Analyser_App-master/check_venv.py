#!/usr/bin/env python
"""Quick script to check virtual environment status"""
import sys
import os

print("=" * 60)
print("Python Environment Check")
print("=" * 60)
print(f"Python executable: {sys.executable}")
print(f"Python version: {sys.version}")
print(f"Virtual env: {os.environ.get('VIRTUAL_ENV', 'Not in virtual env')}")
print(f"Python path: {sys.path[:3]}")
print("=" * 60)

# Check if flask is importable
try:
    import flask
    print(f"✅ Flask found: {flask.__file__}")
except ImportError:
    print("❌ Flask NOT found")
    
# Check other key packages
packages = ['flask', 'flask_cors', 'google.generativeai', 'fer', 'textblob', 'vaderSentiment']
print("\nPackage Status:")
for pkg in packages:
    try:
        __import__(pkg)
        print(f"  ✅ {pkg}")
    except ImportError:
        print(f"  ❌ {pkg}")

