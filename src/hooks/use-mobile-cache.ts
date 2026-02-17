/**
 * Mobile Cache Hook
 *
 * React hook for using IndexedDB cache with automatic fetching,
 * loading states, and cache invalidation.
 *
 * Features:
 * - Automatic cache-first strategy
 * - Loading and error states
 * - Manual refresh capability
 * - Cache status tracking
 * - Offline support
 *
 * @module use-mobile-cache
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getCached,
  setCached,
  deleteCached,
  CACHE_TTL,
} from '@/lib/cache/mobile-cache';

type StoreName = 'practice_items' | 'vocabulary_cards' | 'user_progress';

interface UseMobileCacheOptions<T> {
  /**
   * Storage name to use
   */
  storeName: StoreName;

  /**
   * Cache key
   */
  key: string;

  /**
   * Data fetcher function (called on cache miss or refresh)
   */
  fetcher: () => Promise<T>;

  /**
   * Cache TTL in milliseconds (default: varies by store)
   */
  ttl?: number;

  /**
   * Enable automatic fetching on mount (default: true)
   */
  enabled?: boolean;

  /**
   * Cache version for invalidation (default: 1)
   */
  version?: number;

  /**
   * Callback when cache hit occurs
   */
  onCacheHit?: (data: T) => void;

  /**
   * Callback when cache miss occurs
   */
  onCacheMiss?: () => void;

  /**
   * Callback when fetch error occurs
   */
  onError?: (error: Error) => void;
}

interface UseMobileCacheResult<T> {
  /**
   * Cached or fetched data
   */
  data: T | null;

  /**
   * Loading state
   */
  loading: boolean;

  /**
   * Error state
   */
  error: Error | null;

  /**
   * Whether data came from cache
   */
  cached: boolean;

  /**
   * Manually refresh data (bypasses cache)
   */
  refresh: () => Promise<void>;

  /**
   * Clear cached data for this key
   */
  clearCache: () => Promise<void>;

  /**
   * Check if cache exists
   */
  hasCached: boolean;
}

/**
 * Hook for mobile data caching with IndexedDB
 *
 * @example
 * ```typescript
 * const { data, loading, cached, refresh } = useMobileCache({
 *   storeName: 'vocabulary_cards',
 *   key: 'due-cards-user-123',
 *   fetcher: async () => {
 *     const { data } = await supabase.rpc('get_due_vocabulary_cards', {
 *       p_user_id: userId,
 *       p_limit: 20
 *     });
 *     return data;
 *   },
 *   ttl: CACHE_TTL.VOCABULARY_CARDS,
 * });
 * ```
 */
export function useMobileCache<T>({
  storeName,
  key,
  fetcher,
  ttl,
  enabled = true,
  version = 1,
  onCacheHit,
  onCacheMiss,
  onError,
}: UseMobileCacheOptions<T>): UseMobileCacheResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [cached, setCached] = useState<boolean>(false);
  const [hasCached, setHasCached] = useState<boolean>(false);

  /**
   * Load data from cache or fetch
   */
  const loadData = useCallback(
    async (forceRefresh: boolean = false) => {
      if (!enabled) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 🐛 DEBUG: Log cache key details
        console.log('🔑 [DEBUG] Cache Key Details:', {
          storeName,
          key,
          enabled,
          forceRefresh,
          ttl,
          timestamp: new Date().toISOString(),
        });

        // Try cache first (unless forcing refresh)
        if (!forceRefresh) {
          console.log(`🔍 [useMobileCache] Checking cache: ${storeName}/${key}`);
          const cachedData = await getCached<T>(storeName, key);

          if (cachedData !== null) {
            console.log(`✅ [useMobileCache] Cache hit: ${storeName}/${key}`);
            setData(cachedData);
            setCached(true);
            setHasCached(true);
            setLoading(false);
            onCacheHit?.(cachedData);
            return;
          }

          console.log(`❌ [useMobileCache] Cache miss: ${storeName}/${key}`);
          onCacheMiss?.();
        } else {
          console.log(`🔄 [useMobileCache] Force refresh: ${storeName}/${key}`);
        }

        // Fetch fresh data
        console.log(`📡 [useMobileCache] Fetching: ${storeName}/${key}`);
        const freshData = await fetcher();

        // Cache the fetched data
        const cacheTTL = ttl || getDefaultTTL(storeName);
        await setCached(storeName, key, freshData, {
          ttl: cacheTTL,
          version,
        });

        setData(freshData);
        setCached(false);
        setHasCached(true);
        console.log(`💾 [useMobileCache] Cached fresh data: ${storeName}/${key}`);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`❌ [useMobileCache] Error: ${storeName}/${key}`, error);
        setError(error);
        onError?.(error);

        // If offline and no cached data, keep loading state
        if (!navigator.onLine && data === null) {
          console.warn('⚠️ [useMobileCache] Offline and no cached data available');
        }
      } finally {
        setLoading(false);
      }
    },
    [storeName, key, fetcher, ttl, version, enabled, onCacheHit, onCacheMiss, onError]
  );

  /**
   * Manual refresh (bypasses cache)
   */
  const refresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  /**
   * Clear cache for this key
   */
  const clearCache = useCallback(async () => {
    try {
      await deleteCached(storeName, key);
      setHasCached(false);
      console.log(`🗑️ [useMobileCache] Cache cleared: ${storeName}/${key}`);
    } catch (err) {
      console.error(`❌ [useMobileCache] Clear cache error: ${storeName}/${key}`, err);
    }
  }, [storeName, key]);

  // Load data on mount or when dependencies change
  useEffect(() => {
    loadData(false);
  }, [loadData]);

  return {
    data,
    loading,
    error,
    cached,
    refresh,
    clearCache,
    hasCached,
  };
}

/**
 * Get default TTL for a store
 */
function getDefaultTTL(storeName: StoreName): number {
  switch (storeName) {
    case 'practice_items':
      return CACHE_TTL.PRACTICE_ITEMS;
    case 'vocabulary_cards':
      return CACHE_TTL.VOCABULARY_CARDS;
    case 'user_progress':
      return CACHE_TTL.USER_PROGRESS;
    default:
      return CACHE_TTL.PRACTICE_ITEMS;
  }
}

/**
 * Hook for checking online status
 */
export function useOnlineStatus(): {
  isOnline: boolean;
  wasOffline: boolean;
} {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 [Network] Back online');
      setIsOnline(true);
      // Track that we were offline
      if (!isOnline) {
        setWasOffline(true);
        // Reset wasOffline after 5 seconds
        setTimeout(() => setWasOffline(false), 5000);
      }
    };

    const handleOffline = () => {
      console.log('📡 [Network] Offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  return { isOnline, wasOffline };
}

/**
 * Hook for prefetching data
 * Fetches data in background and caches it without blocking UI
 */
export function usePrefetch<T>(
  storeName: StoreName,
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    ttl?: number;
    version?: number;
    delay?: number; // Delay before prefetch (ms)
  }
) {
  const [prefetched, setPrefetched] = useState(false);

  useEffect(() => {
    const delay = options?.delay || 0;

    const timer = setTimeout(async () => {
      try {
        console.log(`📦 [Prefetch] Starting: ${storeName}/${key}`);
        const data = await fetcher();

        const cacheTTL = options?.ttl || getDefaultTTL(storeName);
        await setCached(storeName, key, data, {
          ttl: cacheTTL,
          version: options?.version || 1,
        });

        setPrefetched(true);
        console.log(`✅ [Prefetch] Complete: ${storeName}/${key}`);
      } catch (err) {
        console.error(`❌ [Prefetch] Error: ${storeName}/${key}`, err);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [storeName, key, fetcher, options]);

  return { prefetched };
}
