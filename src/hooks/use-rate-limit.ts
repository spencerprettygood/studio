import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RateLimitState {
  remaining: number;
  resetAt: Date | null;
  isLimited: boolean;
}

interface UseRateLimitOptions {
  endpoint: 'ai' | 'optimize' | 'batch' | 'write' | 'auth' | 'api';
  onLimitExceeded?: () => void;
}

export function useRateLimit(options: UseRateLimitOptions) {
  const { toast } = useToast();
  const [state, setState] = useState<RateLimitState>({
    remaining: -1, // -1 means unknown
    resetAt: null,
    isLimited: false,
  });

  // Check headers from response and update state
  const checkRateLimit = useCallback((response: Response) => {
    const limit = response.headers.get('X-RateLimit-Limit');
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');

    if (remaining !== null) {
      const remainingNum = parseInt(remaining, 10);
      const resetDate = reset ? new Date(reset) : null;
      
      setState({
        remaining: remainingNum,
        resetAt: resetDate,
        isLimited: remainingNum === 0,
      });

      // Show warning when getting close to limit
      if (remainingNum > 0 && remainingNum <= 5) {
        toast({
          title: "Rate Limit Warning",
          description: `Only ${remainingNum} requests remaining. Resets at ${resetDate?.toLocaleTimeString()}.`,
          variant: "default",
        });
      }

      // Show error when limit exceeded
      if (remainingNum === 0) {
        toast({
          title: "Rate Limit Exceeded",
          description: `Please wait until ${resetDate?.toLocaleTimeString()} to continue.`,
          variant: "destructive",
        });
        options.onLimitExceeded?.();
      }
    }
  }, [toast, options]);

  // Reset timer
  useEffect(() => {
    if (state.resetAt && state.isLimited) {
      const now = new Date();
      const resetTime = new Date(state.resetAt);
      const timeUntilReset = resetTime.getTime() - now.getTime();

      if (timeUntilReset > 0) {
        const timer = setTimeout(() => {
          setState(prev => ({
            ...prev,
            isLimited: false,
            remaining: -1, // Will be updated on next request
          }));
          
          toast({
            title: "Rate Limit Reset",
            description: "You can now continue using this feature.",
          });
        }, timeUntilReset);

        return () => clearTimeout(timer);
      }
    }
  }, [state.resetAt, state.isLimited, toast]);

  // Format time until reset for display
  const getTimeUntilReset = useCallback(() => {
    if (!state.resetAt) return '';
    
    const now = new Date();
    const resetTime = new Date(state.resetAt);
    const seconds = Math.ceil((resetTime.getTime() - now.getTime()) / 1000);
    
    if (seconds <= 0) return 'now';
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.ceil(seconds / 60)} minutes`;
    return `${Math.ceil(seconds / 3600)} hours`;
  }, [state.resetAt]);

  return {
    ...state,
    checkRateLimit,
    timeUntilReset: getTimeUntilReset(),
  };
}