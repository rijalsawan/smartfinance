#!/usr/bin/env python3
"""
Test script for AI Insights Engine
"""

import json
from ai_insights_engine import FinancialAIInsights

def test_ai_engine():
    # Read test data
    with open('test_transactions.json', 'r') as f:
        transactions_data = f.read()
    
    # Initialize AI engine
    ai_engine = FinancialAIInsights()
    
    # Analyze transactions
    result = ai_engine.analyze_transactions(transactions_data)
    
    # Print results in a formatted way
    print("=" * 50)
    print("AI INSIGHTS TEST RESULTS")
    print("=" * 50)
    
    if result['success']:
        print("✅ Analysis successful!")
    else:
        print("❌ Analysis failed:", result.get('error', 'Unknown error'))
    
    print("\n📊 FINANCIAL HEALTH SCORE:")
    health = result['healthScore']
    print(f"Overall: {health['overall']}/10")
    
    print("\nComponents:")
    for component, score in health['components'].items():
        print(f"  {component}: {score}%")
    
    print("\nRecommendations:")
    for i, rec in enumerate(health['recommendations'], 1):
        print(f"  {i}. {rec}")
    
    print("\n🧠 AI INSIGHTS:")
    for i, insight in enumerate(result['insights'], 1):
        print(f"\n{i}. {insight['title']}")
        print(f"   Type: {insight['type']}")
        print(f"   Impact: {insight['impact']}")
        print(f"   Confidence: {insight['confidence']}%")
        print(f"   Description: {insight['description']}")
        print(f"   Category: {insight['category']}")

if __name__ == '__main__':
    test_ai_engine()
