import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

/**
 * GET /api/health - Health check endpoint
 * Verifies database connectivity and system status
 */
export async function GET() {
  const checks = {
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: false,
      environment: false,
      memory: false,
    },
    details: {} as Record<string, any>,
  };

  try {
    // Check database connectivity
    try {
      const testQuery = query(collection(db, 'prompts'), limit(1));
      await getDocs(testQuery);
      checks.checks.database = true;
    } catch (dbError) {
      checks.status = 'degraded';
      checks.details.database = 'Database connection failed';
    }

    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    ];
    
    const missingEnvVars = requiredEnvVars.filter(
      varName => !process.env[varName]
    );
    
    if (missingEnvVars.length === 0) {
      checks.checks.environment = true;
    } else {
      checks.status = 'degraded';
      checks.details.environment = `Missing env vars: ${missingEnvVars.length}`;
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    if (heapUsedPercent < 90) {
      checks.checks.memory = true;
    } else {
      checks.status = checks.status === 'healthy' ? 'degraded' : checks.status;
      checks.details.memory = `Heap usage: ${heapUsedPercent.toFixed(2)}%`;
    }

    // Add system metrics
    checks.details.uptime = process.uptime();
    checks.details.memory = {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      external: Math.round(memUsage.external / 1024 / 1024) + ' MB',
    };

    // Determine overall status
    const allChecksPass = Object.values(checks.checks).every(check => check);
    if (!allChecksPass && checks.status === 'healthy') {
      checks.status = 'degraded';
    }

    return NextResponse.json(checks, {
      status: checks.status === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}