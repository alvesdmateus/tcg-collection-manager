import { useEffect, useRef, useCallback } from 'react';

interface ConnectionMonitorOptions {
  onConnectionLost: () => void;
  onConnectionRestored: () => void;
}

const HEALTH_ENDPOINT = '/health';
const PING_INTERVAL_CONNECTED = 30000;    // 30s when connected
const PING_INTERVAL_DISCONNECTED = 5000;  // 5s when disconnected
const HEALTH_TIMEOUT = 5000;              // 5s timeout per check

export function useConnectionMonitor({
  onConnectionLost,
  onConnectionRestored,
}: ConnectionMonitorOptions): {
  checkNow: () => Promise<boolean>;
} {
  const isConnectedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const onConnectionLostRef = useRef(onConnectionLost);
  const onConnectionRestoredRef = useRef(onConnectionRestored);
  onConnectionLostRef.current = onConnectionLost;
  onConnectionRestoredRef.current = onConnectionRestored;

  const performHealthCheck = useCallback(async (): Promise<boolean> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT);
      const response = await fetch(HEALTH_ENDPOINT, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        if (!isConnectedRef.current) {
          isConnectedRef.current = true;
          onConnectionRestoredRef.current();
        }
        return true;
      }

      if (isConnectedRef.current) {
        isConnectedRef.current = false;
        onConnectionLostRef.current();
      }
      return false;
    } catch {
      if (isConnectedRef.current) {
        isConnectedRef.current = false;
        onConnectionLostRef.current();
      }
      return false;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const poll = (): void => {
      const interval = isConnectedRef.current
        ? PING_INTERVAL_CONNECTED
        : PING_INTERVAL_DISCONNECTED;

      intervalRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          performHealthCheck().then(() => {
            // Restart polling with updated interval if connection state changed
            const newInterval = isConnectedRef.current
              ? PING_INTERVAL_CONNECTED
              : PING_INTERVAL_DISCONNECTED;
            if (newInterval !== interval) {
              poll();
            }
          });
        }
      }, interval);
    };

    poll();
  }, [performHealthCheck]);

  // Listen for custom events from fetchWithConnectionCheck
  useEffect(() => {
    const handleApiLost = (): void => {
      if (isConnectedRef.current) {
        isConnectedRef.current = false;
        onConnectionLostRef.current();
        startPolling(); // Switch to faster retry interval
      }
    };

    const handleApiConnected = (): void => {
      if (!isConnectedRef.current) {
        isConnectedRef.current = true;
        onConnectionRestoredRef.current();
        startPolling(); // Switch back to normal interval
      }
    };

    window.addEventListener('api:connection-lost', handleApiLost);
    window.addEventListener('api:connected', handleApiConnected);

    return () => {
      window.removeEventListener('api:connection-lost', handleApiLost);
      window.removeEventListener('api:connected', handleApiConnected);
    };
  }, [startPolling]);

  // Listen for browser online/offline events
  useEffect(() => {
    const handleOffline = (): void => {
      if (isConnectedRef.current) {
        isConnectedRef.current = false;
        onConnectionLostRef.current();
        startPolling();
      }
    };

    const handleOnline = (): void => {
      // When browser comes back online, verify with actual health check
      performHealthCheck();
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [performHealthCheck, startPolling]);

  // Resume polling when tab becomes visible
  useEffect(() => {
    const handleVisibility = (): void => {
      if (document.visibilityState === 'visible') {
        performHealthCheck();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [performHealthCheck]);

  // Start polling on mount
  useEffect(() => {
    startPolling();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      abortRef.current?.abort();
    };
  }, [startPolling]);

  return { checkNow: performHealthCheck };
}
