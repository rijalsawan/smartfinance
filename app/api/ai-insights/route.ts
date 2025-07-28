import { NextRequest, NextResponse } from 'next/server';
import { independentAIInsightsService } from '../../services/independentAIInsightsService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactions, action } = body;

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json({
        error: 'Invalid transaction data provided'
      }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'generateInsights':
        result = await independentAIInsightsService.generateInsights(transactions);
        break;
      
      case 'calculateHealthScore':
        result = await independentAIInsightsService.calculateFinancialHealthScore(transactions);
        break;
      
      case 'analyzeSpendingPatterns':
        const categories = body.categories;
        result = await independentAIInsightsService.analyzeSpendingPatterns(transactions, categories);
        break;
      
      case 'detectAnomalies':
        result = await independentAIInsightsService.detectAnomalies(transactions);
        break;
      
      case 'getSavingsOpportunities':
        result = await independentAIInsightsService.getSavingsOpportunities(transactions);
        break;
      
      case 'checkDependencies':
        result = await independentAIInsightsService.checkDependencies();
        break;
      
      case 'installDependencies':
        result = await independentAIInsightsService.installDependencies();
        break;
      
      default:
        return NextResponse.json({
          error: 'Invalid action specified'
        }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('AI Insights API Error:', error);
    
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  // Health check endpoint
  try {
    const dependencies = await independentAIInsightsService.checkDependencies();
    
    return NextResponse.json({
      status: 'healthy',
      pythonAvailable: dependencies.available,
      missingDependencies: dependencies.missing,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
