#!/usr/bin/env python3
"""
Populate database with initial AI test results for demonstration.
This script tests a few questions with different models to show how the system works.
"""
import requests
import json
import time

API_URL = "http://localhost:8000"

# Models to test with
MODELS = [
    "openai/gpt-4",
    "openai/gpt-3.5-turbo",
    "anthropic/claude-3-opus",
    "google/gemini-pro"
]

# Questions to test (a few multiple choice ones)
QUESTION_IDS = [
    "nlp_003",  # BERT advantages
    "nlp_006",  # Word embeddings
    "nlp_011",  # LSTM vs GRU
    "nlp_015",  # Softmax
    "nlp_024",  # Dropout
    "nlp_028",  # Confusion matrix
]

def test_question_with_model(question_id: str, model: str):
    """Test a single question with a single model."""
    print(f"Testing {question_id} with {model}...")
    
    try:
        response = requests.post(
            f"{API_URL}/api/test/single",
            json={
                "questionId": question_id,
                "models": [model]
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            result = data.get("testResults", [{}])[0]
            selected = result.get("selectedOption", "?")
            is_correct = result.get("isCorrect", False)
            confidence = result.get("confidence", 0)
            
            status = "✓ CORRECT" if is_correct else "✗ WRONG"
            print(f"  → {status} | Selected: {selected} | Confidence: {confidence:.0f}%")
            return True
        else:
            print(f"  ✗ Error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"  ✗ Exception: {e}")
        return False


def main():
    print("=" * 60)
    print("AI Test Results Population Script")
    print("=" * 60)
    print()
    
    # Check if backend is running
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        if response.status_code != 200:
            print("❌ Backend is not responding properly!")
            print(f"   Please start the backend: cd backend && python main.py")
            return
    except Exception as e:
        print("❌ Cannot connect to backend!")
        print(f"   Error: {e}")
        print(f"   Please start the backend: cd backend && python main.py")
        return
    
    print("✓ Backend is running\n")
    
    # Test each question with each model
    total_tests = len(QUESTION_IDS) * len(MODELS)
    completed = 0
    
    for question_id in QUESTION_IDS:
        print(f"\n📝 Question: {question_id}")
        print("-" * 60)
        
        for model in MODELS:
            if test_question_with_model(question_id, model):
                completed += 1
            
            # Small delay to avoid overwhelming the backend
            time.sleep(0.5)
    
    print("\n" + "=" * 60)
    print(f"Completed {completed}/{total_tests} tests")
    print("=" * 60)
    print()
    print("✓ Done! You can now:")
    print("  1. Start the frontend: cd frontend && npm run dev")
    print("  2. Open http://localhost:3000")
    print("  3. Click on any of the tested questions to see AI results")
    print()


if __name__ == "__main__":
    main()
