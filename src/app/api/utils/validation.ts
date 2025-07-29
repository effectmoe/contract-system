import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter } from '@/lib/db/kv';
import { ERROR_MESSAGES } from '@/lib/utils/constants';

/**
 * Rate limiting check
 */
export async function checkRateLimit(
  request: NextRequest,
  key: string,
  limit: number,
  window: number
): Promise<NextResponse | null> {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { allowed } = await rateLimiter.checkLimit(`${key}:${ip}`, limit, window);
  
  if (!allowed) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.RATE_LIMIT },
      { status: 429 }
    );
  }
  
  return null;
}

/**
 * Validate request body
 */
export function validateRequestBody<T extends Record<string, any>>(
  body: any,
  requiredFields: (keyof T)[]
): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'リクエストボディが無効です' };
  }
  
  for (const field of requiredFields) {
    if (!body[field]) {
      return { valid: false, error: `${String(field)}が必要です` };
    }
  }
  
  return { valid: true };
}

/**
 * Create error response
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage: string,
  status: number = 500
): NextResponse {
  console.error('API Error:', {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });

  return NextResponse.json(
    { 
      error: defaultMessage,
      details: error instanceof Error ? error.message : 'Unknown error'
    },
    { status }
  );
}