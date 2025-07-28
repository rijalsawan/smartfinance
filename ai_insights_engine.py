#!/usr/bin/env python3
"""
Independent AI Insights Service for SmartFinance
This service provides AI-powered financial insights without relying on external services.
"""

import json
import sys
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from collections import defaultdict
import statistics

class FinancialAIInsights:
    def __init__(self):
        self.insights = []
        self.health_score = {}
        
    def analyze_transactions(self, transactions_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Main method to analyze transactions and generate insights
        """
        try:
            # Handle both string and list inputs for backward compatibility
            if isinstance(transactions_data, str):
                transactions = json.loads(transactions_data)
            else:
                transactions = transactions_data
            
            if not transactions:
                return self.get_demo_insights()
            
            # Convert to pandas DataFrame for easier analysis
            df = pd.DataFrame(transactions)
            df['date'] = pd.to_datetime(df['date'])
            df['amount'] = pd.to_numeric(df['amount'])
            
            # Ensure timezone consistency
            if df['date'].dt.tz is None:
                df['date'] = df['date'].dt.tz_localize('UTC')
            else:
                df['date'] = df['date'].dt.tz_convert('UTC')
            
            insights = []
            
            # Generate various types of insights
            insights.extend(self.analyze_spending_patterns(df))
            insights.extend(self.detect_anomalies(df))
            insights.extend(self.predict_future_spending(df))
            insights.extend(self.identify_savings_opportunities(df))
            insights.extend(self.analyze_cash_flow(df))
            insights.extend(self.detect_recurring_charges(df))
            
            # Calculate financial health score
            health_score = self.calculate_health_score(df)
            
            # Sort insights by priority and confidence
            insights.sort(key=lambda x: (x['priority'], x['confidence']), reverse=True)
            
            return {
                'insights': insights[:8],  # Top 8 insights
                'healthScore': health_score,
                'success': True
            }
            
        except Exception as e:
            return {
                'insights': self.get_demo_insights()['insights'],
                'healthScore': self.get_demo_insights()['healthScore'],
                'success': False,
                'error': str(e)
            }
    
    def analyze_spending_patterns(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Analyze spending patterns and trends"""
        insights = []
        
        # Filter expenses (negative amounts)
        expenses = df[df['amount'] < 0].copy()
        expenses['amount'] = expenses['amount'].abs()
        
        if expenses.empty:
            return insights
        
        # Group by category and analyze trends
        category_spending = expenses.groupby('category')['amount'].agg(['sum', 'mean', 'count']).reset_index()
        
        # Analyze monthly trends
        current_date = pd.Timestamp.now(tz='UTC')
        last_30_days = current_date - pd.Timedelta(days=30)
        last_60_days = current_date - pd.Timedelta(days=60)
        
        # Ensure date column is timezone-aware
        if df['date'].dt.tz is None:
            df['date'] = df['date'].dt.tz_localize('UTC')
        
        recent_expenses = expenses[expenses['date'] >= last_30_days]
        previous_expenses = expenses[(expenses['date'] >= last_60_days) & (expenses['date'] < last_30_days)]
        
        if not recent_expenses.empty and not previous_expenses.empty:
            recent_total = recent_expenses['amount'].sum()
            previous_total = previous_expenses['amount'].sum()
            
            if previous_total > 0:
                change_percent = ((recent_total - previous_total) / previous_total) * 100
                
                if abs(change_percent) > 15:
                    insights.append({
                        'id': 'spending-trend',
                        'type': 'alert' if change_percent > 0 else 'prediction',
                        'title': f'Spending {"Increased" if change_percent > 0 else "Decreased"} by {abs(change_percent):.1f}%',
                        'description': f'Your total spending has {"increased" if change_percent > 0 else "decreased"} by ${abs(recent_total - previous_total):.2f} compared to last month.',
                        'impact': 'High' if abs(change_percent) > 30 else 'Medium',
                        'confidence': min(95, 70 + abs(change_percent)),
                        'category': 'Spending Analysis',
                        'actionable': change_percent > 0,
                        'priority': 9 if abs(change_percent) > 30 else 7,
                        'metadata': {
                            'amount': recent_total,
                            'change': change_percent,
                            'previous_amount': previous_total
                        }
                    })
        
        # Analyze category-specific patterns
        for _, row in category_spending.iterrows():
            category = row['category']
            total_spent = row['sum']
            avg_transaction = row['mean']
            
            category_recent = recent_expenses[recent_expenses['category'] == category]['amount'].sum()
            category_previous = previous_expenses[previous_expenses['category'] == category]['amount'].sum()
            
            if category_previous > 0 and category_recent > 0:
                category_change = ((category_recent - category_previous) / category_previous) * 100
                
                if abs(category_change) > 25:
                    insights.append({
                        'id': f'category-trend-{category.lower().replace(" ", "-")}',
                        'type': 'recommendation' if category_change > 0 else 'opportunity',
                        'title': f'{category} Spending Alert',
                        'description': f'Your {category.lower()} spending has {"increased" if category_change > 0 else "decreased"} by {abs(category_change):.1f}% this month.',
                        'impact': 'Medium',
                        'confidence': 85,
                        'category': category,
                        'actionable': True,
                        'priority': 6,
                        'metadata': {
                            'amount': category_recent,
                            'change': category_change
                        }
                    })
        
        return insights
    
    def detect_anomalies(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect unusual spending patterns"""
        insights = []
        
        expenses = df[df['amount'] < 0].copy()
        expenses['amount'] = expenses['amount'].abs()
        
        if len(expenses) < 5:
            return insights
        
        # Daily spending analysis
        daily_spending = expenses.groupby(expenses['date'].dt.date)['amount'].sum()
        
        if len(daily_spending) >= 7:
            mean_daily = daily_spending.mean()
            std_daily = daily_spending.std()
            
            # Find outlier days (spending > mean + 2*std)
            outliers = daily_spending[daily_spending > mean_daily + 2 * std_daily]
            
            if not outliers.empty:
                latest_outlier = outliers.iloc[-1]
                outlier_date = outliers.index[-1]
                
                insights.append({
                    'id': 'anomaly-spending',
                    'type': 'alert',
                    'title': 'Unusual Spending Detected',
                    'description': f'You spent ${latest_outlier:.2f} on {outlier_date}, which is {((latest_outlier / mean_daily - 1) * 100):.0f}% above your daily average.',
                    'impact': 'Medium',
                    'confidence': 90,
                    'category': 'Budget Control',
                    'actionable': True,
                    'priority': 8,
                    'metadata': {
                        'amount': latest_outlier,
                        'date': str(outlier_date),
                        'deviation_percent': (latest_outlier / mean_daily - 1) * 100
                    }
                })
        
        # Large transaction detection
        large_transactions = expenses[expenses['amount'] > expenses['amount'].quantile(0.95)]
        
        if not large_transactions.empty:
            current_time = pd.Timestamp.now(tz='UTC')
            week_ago = current_time - pd.Timedelta(days=7)
            recent_large = large_transactions[large_transactions['date'] >= week_ago]
            
            if not recent_large.empty:
                largest = recent_large.iloc[recent_large['amount'].idxmax()]
                
                insights.append({
                    'id': 'large-transaction',
                    'type': 'alert',
                    'title': 'Large Transaction Alert',
                    'description': f'Large expense of ${largest["amount"]:.2f} detected at {largest["merchant"]} in {largest["category"]}.',
                    'impact': 'Medium',
                    'confidence': 100,
                    'category': 'Transaction Monitoring',
                    'actionable': True,
                    'priority': 7,
                    'metadata': {
                        'amount': largest['amount'],
                        'merchant': largest['merchant'],
                        'category': largest['category']
                    }
                })
        
        return insights
    
    def predict_future_spending(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Predict future spending based on historical patterns"""
        insights = []
        
        expenses = df[df['amount'] < 0].copy()
        expenses['amount'] = expenses['amount'].abs()
        
        if expenses.empty:
            return insights
        
        # Monthly spending prediction
        # Convert to timezone-naive datetime to avoid warnings
        expenses_naive = expenses.copy()
        expenses_naive['date'] = pd.to_datetime(expenses_naive['date']).dt.tz_localize(None)
        monthly_spending = expenses_naive.groupby(expenses_naive['date'].dt.to_period('M'))['amount'].sum()
        
        if len(monthly_spending) >= 2:
            # Simple linear trend calculation
            months = range(len(monthly_spending))
            amounts = monthly_spending.values
            
            if len(amounts) >= 3:
                # Calculate trend using simple linear regression
                trend = np.polyfit(months, amounts, 1)[0]
                last_month = amounts[-1]
                predicted_next = last_month + trend
                
                if abs(trend) > 100:  # Significant trend
                    insights.append({
                        'id': 'spending-prediction',
                        'type': 'prediction',
                        'title': 'Monthly Spending Forecast',
                        'description': f'Based on your recent patterns, you\'re projected to spend ${predicted_next:.0f} next month, a {"$" + str(abs(int(trend))) + " increase" if trend > 0 else "$" + str(abs(int(trend))) + " decrease"}.',
                        'impact': 'High' if abs(trend) > 300 else 'Medium',
                        'confidence': 75,
                        'category': 'Budget Planning',
                        'actionable': trend > 0,
                        'priority': 8 if trend > 0 else 6,
                        'metadata': {
                            'predicted_amount': predicted_next,
                            'trend': trend,
                            'last_month_amount': last_month
                        }
                    })
        
        return insights
    
    def identify_savings_opportunities(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Identify opportunities to save money"""
        insights = []
        
        expenses = df[df['amount'] < 0].copy()
        expenses['amount'] = expenses['amount'].abs()
        
        if expenses.empty:
            return insights
        
        # Subscription analysis
        recurring_charges = self.find_recurring_charges(expenses)
        
        if recurring_charges:
            total_subscriptions = sum(charge['amount'] for charge in recurring_charges)
            
            insights.append({
                'id': 'subscription-optimization',
                'type': 'recommendation',
                'title': 'Optimize Subscriptions',
                'description': f'You have {len(recurring_charges)} recurring subscriptions totaling ${total_subscriptions:.2f}/month. Review and cancel unused ones.',
                'impact': 'High' if total_subscriptions > 100 else 'Medium',
                'confidence': 95,
                'category': 'Cost Optimization',
                'actionable': True,
                'priority': 9,
                'metadata': {
                    'total_amount': total_subscriptions,
                    'subscription_count': len(recurring_charges),
                    'subscriptions': recurring_charges
                }
            })
        
        # Category optimization
        category_spending = expenses.groupby('category')['amount'].sum().sort_values(ascending=False)
        
        if not category_spending.empty:
            top_category = category_spending.index[0]
            top_amount = category_spending.iloc[0]
            
            if top_amount > 500:  # Significant spending category
                insights.append({
                    'id': f'optimize-{top_category.lower().replace(" ", "-")}',
                    'type': 'opportunity',
                    'title': f'Reduce {top_category} Spending',
                    'description': f'{top_category} is your highest spending category at ${top_amount:.2f}. Consider ways to reduce this expense.',
                    'impact': 'Medium',
                    'confidence': 80,
                    'category': top_category,
                    'actionable': True,
                    'priority': 6,
                    'metadata': {
                        'amount': top_amount,
                        'category': top_category
                    }
                })
        
        return insights
    
    def analyze_cash_flow(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Analyze cash flow patterns"""
        insights = []
        
        income = df[df['amount'] > 0]['amount'].sum()
        expenses = df[df['amount'] < 0]['amount'].abs().sum()
        
        if income > 0:
            savings_rate = ((income - expenses) / income) * 100
            
            if savings_rate < 10:
                insights.append({
                    'id': 'low-savings-rate',
                    'type': 'goal',
                    'title': 'Improve Savings Rate',
                    'description': f'Your current savings rate is {savings_rate:.1f}%. Aim for at least 10-20% to build financial security.',
                    'impact': 'High',
                    'confidence': 100,
                    'category': 'Savings Goals',
                    'actionable': True,
                    'priority': 9,
                    'metadata': {
                        'current_rate': savings_rate,
                        'target_rate': 20,
                        'monthly_income': income,
                        'monthly_expenses': expenses
                    }
                })
            elif savings_rate > 30:
                insights.append({
                    'id': 'high-savings-rate',
                    'type': 'opportunity',
                    'title': 'Excellent Savings Rate',
                    'description': f'Your savings rate of {savings_rate:.1f}% is excellent! Consider investing surplus funds for growth.',
                    'impact': 'Medium',
                    'confidence': 100,
                    'category': 'Investment Opportunity',
                    'actionable': True,
                    'priority': 5,
                    'metadata': {
                        'savings_rate': savings_rate,
                        'surplus_amount': income - expenses
                    }
                })
        
        return insights
    
    def detect_recurring_charges(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect new or changed recurring charges"""
        insights = []
        
        expenses = df[df['amount'] < 0].copy()
        expenses['amount'] = expenses['amount'].abs()
        
        recurring_charges = self.find_recurring_charges(expenses)
        
        # Check for new recurring charges (appeared in last 30 days)
        recent_date = pd.Timestamp.now(tz='UTC') - pd.Timedelta(days=30)
        
        for charge in recurring_charges:
            # Check if this charge started recently
            charge_transactions = expenses[
                (expenses['merchant'] == charge['merchant']) & 
                (abs(expenses['amount'] - charge['amount']) < 1)
            ]
            
            if not charge_transactions.empty:
                first_occurrence = charge_transactions['date'].min()
                
                if first_occurrence >= recent_date:
                    insights.append({
                        'id': f'new-recurring-{charge["merchant"].lower().replace(" ", "-")}',
                        'type': 'alert',
                        'title': 'New Recurring Charge',
                        'description': f'New recurring charge of ${charge["amount"]:.2f} from {charge["merchant"]} detected. Verify this is authorized.',
                        'impact': 'Medium',
                        'confidence': 85,
                        'category': 'Account Monitoring',
                        'actionable': True,
                        'priority': 8,
                        'metadata': {
                            'amount': charge['amount'],
                            'merchant': charge['merchant'],
                            'first_seen': str(first_occurrence.date())
                        }
                    })
        
        return insights
    
    def find_recurring_charges(self, expenses: pd.DataFrame) -> List[Dict[str, Any]]:
        """Find recurring charges in transaction data"""
        recurring = []
        
        # Group by merchant and amount
        grouped = expenses.groupby(['merchant', expenses['amount'].round(2)])
        
        for (merchant, amount), group in grouped:
            if len(group) >= 2:  # At least 2 occurrences
                # Check if transactions are roughly monthly
                dates = sorted(group['date'].dt.date)
                if len(dates) >= 2:
                    intervals = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
                    avg_interval = np.mean(intervals)
                    
                    # Consider as recurring if interval is between 25-35 days (roughly monthly)
                    if 20 <= avg_interval <= 40:
                        recurring.append({
                            'merchant': merchant,
                            'amount': amount,
                            'frequency': len(group),
                            'avg_interval_days': avg_interval
                        })
        
        return recurring
    
    def calculate_health_score(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate comprehensive financial health score"""
        
        income = df[df['amount'] > 0]['amount'].sum()
        expenses = df[df['amount'] < 0]['amount'].abs().sum()
        
        # Component scores (0-100)
        spending_control = self._calculate_spending_control_score(df)
        savings_rate = self._calculate_savings_rate_score(income, expenses)
        budget_adherence = self._calculate_budget_adherence_score(df)
        financial_stability = self._calculate_stability_score(df)
        cash_flow_health = self._calculate_cash_flow_score(income, expenses)
        
        # Overall score (weighted average)
        overall = (
            spending_control * 0.25 +
            savings_rate * 0.25 +
            budget_adherence * 0.2 +
            financial_stability * 0.15 +
            cash_flow_health * 0.15
        )
        
        return {
            'overall': round(overall / 10, 1),  # Convert to 0-10 scale
            'components': {
                'spendingControl': round(spending_control),
                'savingsRate': round(savings_rate),
                'budgetAdherence': round(budget_adherence),
                'financialStability': round(financial_stability),
                'cashFlowHealth': round(cash_flow_health)
            },
            'recommendations': self._generate_health_recommendations(overall, {
                'spending_control': spending_control,
                'savings_rate': savings_rate,
                'budget_adherence': budget_adherence,
                'financial_stability': financial_stability,
                'cash_flow_health': cash_flow_health
            })
        }
    
    def _calculate_spending_control_score(self, df: pd.DataFrame) -> float:
        """Calculate spending control score based on volatility"""
        expenses = df[df['amount'] < 0]['amount'].abs()
        
        if len(expenses) < 3:
            return 75  # Default score for insufficient data
        
        # Calculate coefficient of variation
        cv = expenses.std() / expenses.mean() if expenses.mean() > 0 else 1
        
        # Convert to score (lower volatility = higher score)
        score = max(0, 100 - cv * 50)
        return min(100, score)
    
    def _calculate_savings_rate_score(self, income: float, expenses: float) -> float:
        """Calculate savings rate score"""
        if income <= 0:
            return 0
        
        savings_rate = ((income - expenses) / income) * 100
        
        # Score based on savings rate (20% = 100 points)
        score = min(100, max(0, savings_rate * 5))
        return score
    
    def _calculate_budget_adherence_score(self, df: pd.DataFrame) -> float:
        """Calculate budget adherence score"""
        expenses = df[df['amount'] < 0]['amount'].abs()
        
        if len(expenses) < 7:
            return 70  # Default score for insufficient data
        
        # Calculate daily spending consistency
        daily_spending = expenses.groupby(df[df['amount'] < 0]['date'].dt.date).sum()
        cv = daily_spending.std() / daily_spending.mean() if daily_spending.mean() > 0 else 1
        
        # Convert to score (more consistent = higher score)
        score = max(0, 100 - cv * 30)
        return min(100, score)
    
    def _calculate_stability_score(self, df: pd.DataFrame) -> float:
        """Calculate financial stability score"""
        # Convert to timezone-naive datetime to avoid warnings
        df_naive = df.copy()
        df_naive['date'] = pd.to_datetime(df_naive['date']).dt.tz_localize(None)
        
        monthly_expenses = df_naive[df_naive['amount'] < 0].groupby(
            df_naive[df_naive['amount'] < 0]['date'].dt.to_period('M')
        )['amount'].sum().abs()
        
        if len(monthly_expenses) < 2:
            return 70  # Default score
        
        # Calculate month-to-month consistency
        cv = monthly_expenses.std() / monthly_expenses.mean() if monthly_expenses.mean() > 0 else 1
        
        # Convert to score
        score = max(0, 100 - cv * 40)
        return min(100, score)
    
    def _calculate_cash_flow_score(self, income: float, expenses: float) -> float:
        """Calculate cash flow health score"""
        if income <= 0:
            return 0
        
        ratio = expenses / income
        
        if ratio <= 0.7:  # Spending 70% or less of income
            return 100
        elif ratio <= 0.8:
            return 85
        elif ratio <= 0.9:
            return 70
        elif ratio <= 1.0:
            return 50
        else:  # Spending more than income
            return max(0, 50 - (ratio - 1) * 100)
    
    def _generate_health_recommendations(self, overall_score: float, components: Dict[str, float]) -> List[str]:
        """Generate personalized recommendations based on scores"""
        recommendations = []
        
        if components['savings_rate'] < 50:
            recommendations.append('Increase your savings rate to at least 10-15% of income')
        
        if components['spending_control'] < 70:
            recommendations.append('Work on reducing spending volatility by creating a budget')
        
        if components['budget_adherence'] < 70:
            recommendations.append('Improve budget adherence by tracking daily expenses')
        
        if components['financial_stability'] < 70:
            recommendations.append('Focus on creating more consistent monthly spending patterns')
        
        if components['cash_flow_health'] < 60:
            recommendations.append('Review and reduce monthly expenses to improve cash flow')
        
        if overall_score > 80:
            recommendations.append('Great job! Consider investing surplus funds for long-term growth')
        
        return recommendations[:3]  # Return top 3 recommendations
    
    def get_demo_insights(self) -> Dict[str, Any]:
        """Return demo insights when no real data is available"""
        return {
            'insights': [
                {
                    'id': 'demo-spending-trend',
                    'type': 'prediction',
                    'title': 'Monthly Spending Forecast',
                    'description': 'Based on current patterns, you\'re on track to spend $2,850 this month.',
                    'impact': 'Medium',
                    'confidence': 82,
                    'category': 'Budget Planning',
                    'actionable': True,
                    'priority': 8
                },
                {
                    'id': 'demo-subscription',
                    'type': 'recommendation',
                    'title': 'Subscription Optimization',
                    'description': 'You could save $47/month by reviewing and canceling unused subscriptions.',
                    'impact': 'High',
                    'confidence': 94,
                    'category': 'Cost Optimization',
                    'actionable': True,
                    'priority': 9
                },
                {
                    'id': 'demo-savings',
                    'type': 'goal',
                    'title': 'Improve Savings Rate',
                    'description': 'Increase monthly savings by $150 to reach the recommended 20% savings rate.',
                    'impact': 'High',
                    'confidence': 85,
                    'category': 'Savings Goals',
                    'actionable': True,
                    'priority': 8
                }
            ],
            'healthScore': {
                'overall': 7.8,
                'components': {
                    'spendingControl': 82,
                    'savingsRate': 75,
                    'budgetAdherence': 79,
                    'financialStability': 81,
                    'cashFlowHealth': 77
                },
                'recommendations': [
                    'Increase your savings rate to at least 15% of income',
                    'Consider investing surplus funds for long-term growth',
                    'Review monthly subscriptions for optimization opportunities'
                ]
            }
        }

def main():
    """Main function to process transaction data and return insights"""
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Transaction data file path required as argument'}))
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    try:
        # Read transaction data from file (handle BOM for Windows files)
        with open(file_path, 'r', encoding='utf-8-sig') as f:
            transaction_data = json.load(f)
        
        ai_insights = FinancialAIInsights()
        result = ai_insights.analyze_transactions(transaction_data)
        
        print(json.dumps(result, default=str))
        
    except FileNotFoundError:
        print(json.dumps({'error': f'Transaction data file not found: {file_path}'}))
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(json.dumps({'error': f'Invalid JSON in transaction data file: {e}'}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({'error': f'Error processing transaction data: {e}'}))
        sys.exit(1)

if __name__ == '__main__':
    main()
