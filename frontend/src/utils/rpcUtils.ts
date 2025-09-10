// RPC Error Handling Utilities

export interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoff?: boolean;
}

export async function retryRpcCall<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, delay = 2000, backoff = true } = options;
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's an RPC error that we should retry
      const isRetryableError = 
        error.message?.includes('circuit breaker') ||
        error.message?.includes('UNKNOWN_ERROR') ||
        error.message?.includes('network error') ||
        error.message?.includes('timeout') ||
        error.code === 'NETWORK_ERROR' ||
        error.code === 'TIMEOUT';
      
      if (!isRetryableError || attempt === maxRetries) {
        throw error;
      }
      
      console.warn(`RPC call failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error.message);
      
      if (attempt < maxRetries) {
        const waitTime = backoff ? delay * Math.pow(2, attempt) : delay;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError!;
}

export function isCircuitBreakerError(error: any): boolean {
  return error.message?.includes('circuit breaker') || 
         error.message?.includes('Execution prevented because the circuit breaker is open');
}

export function getErrorMessage(error: any): string {
  if (isCircuitBreakerError(error)) {
    return 'Network is temporarily unavailable. Please try again in a few moments.';
  }
  
  if (error.message?.includes('UNKNOWN_ERROR')) {
    return 'Network connection issue. Please check your internet connection and try again.';
  }
  
  return error.message || 'An unexpected error occurred';
}
