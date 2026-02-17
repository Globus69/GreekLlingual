/**
 * Mobile Data Caching with IndexedDB
 *
 * Provides offline-first caching for mobile devices using IndexedDB.
 * Supports TTL-based expiry, CRUD operations, and cache invalidation.
 *
 * Database: greeklingua-mobile
 * Stores:
 * - practice_items: Practice mode cards
 * - vocabulary_cards: Vocabulary flashcards
 * - user_progress: User learning progress
 *
 * @module mobile-cache
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database schema definition
interface CacheDBSchema extends DBSchema {
  practice_items: {
    key: string;
    value: CachedItem<any>;
    indexes: { 'by-expiry': number };
  };
  vocabulary_cards: {
    key: string;
    value: CachedItem<any>;
    indexes: { 'by-expiry': number };
  };
  user_progress: {
    key: string;
    value: CachedItem<any>;
    indexes: { 'by-expiry': number };
  };
}

// Cached item wrapper with metadata
interface CachedItem<T> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt: number;
  version: number;
}

// Cache configuration
interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  version?: number; // Cache version for invalidation
}

// Database constants
const DB_NAME = 'greeklingua-mobile';
const DB_VERSION = 1;
const STORES = ['practice_items', 'vocabulary_cards', 'user_progress'] as const;
type StoreName = typeof STORES[number];

// Cache TTL defaults (milliseconds)
export const CACHE_TTL = {
  PRACTICE_ITEMS: 60 * 60 * 1000, // 1 hour
  VOCABULARY_CARDS: 30 * 60 * 1000, // 30 minutes
  USER_PROGRESS: 24 * 60 * 60 * 1000, // 24 hours (until sync)
} as const;

// Singleton database instance
let dbInstance: IDBPDatabase<CacheDBSchema> | null = null;

/**
 * Initialize IndexedDB database
 */
async function initDB(): Promise<IDBPDatabase<CacheDBSchema>> {
  if (dbInstance) return dbInstance;

  try {
    dbInstance = await openDB<CacheDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log('📦 [IndexedDB] Upgrading database:', { oldVersion, newVersion });

        // Create stores if they don't exist
        for (const storeName of STORES) {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'key' });
            // Index for expiry-based queries
            store.createIndex('by-expiry', 'expiresAt');
            console.log(`📦 [IndexedDB] Created store: ${storeName}`);
          }
        }
      },
      blocked() {
        console.warn('⚠️ [IndexedDB] Database blocked by older version');
      },
      blocking() {
        console.warn('⚠️ [IndexedDB] Blocking newer version');
      },
    });

    console.log('✅ [IndexedDB] Database initialized successfully');
    return dbInstance;
  } catch (error) {
    console.error('❌ [IndexedDB] Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Get cached item from IndexedDB
 * Returns null if not found or expired
 */
export async function getCached<T>(
  storeName: StoreName,
  key: string
): Promise<T | null> {
  try {
    const db = await initDB();
    const cached = await db.get(storeName, key);

    // 🐛 DEBUG: Log what we found
    console.log(`🔍 [DEBUG] getCached result:`, {
      storeName,
      key,
      found: !!cached,
      hasData: cached ? !!cached.data : false,
      timestamp: cached?.timestamp,
      expiresAt: cached?.expiresAt,
      now: Date.now(),
      isExpired: cached ? cached.expiresAt < Date.now() : null,
    });

    if (!cached) {
      console.log(`🔍 [Cache] Miss: ${storeName}/${key}`);
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (cached.expiresAt < now) {
      console.log(`⏰ [Cache] Expired: ${storeName}/${key}`);
      // Clean up expired item
      await db.delete(storeName, key);
      return null;
    }

    console.log(`✅ [Cache] Hit: ${storeName}/${key}`);
    return cached.data;
  } catch (error) {
    console.error(`❌ [Cache] Get error: ${storeName}/${key}`, error);
    return null;
  }
}

/**
 * Set cached item in IndexedDB
 */
export async function setCached<T>(
  storeName: StoreName,
  key: string,
  data: T,
  config: CacheConfig = {}
): Promise<void> {
  try {
    const db = await initDB();
    const now = Date.now();
    const ttl = config.ttl || CACHE_TTL.PRACTICE_ITEMS; // Default TTL
    const version = config.version || 1;

    const cached: CachedItem<T> = {
      key,
      data,
      timestamp: now,
      expiresAt: now + ttl,
      version,
    };

    // 🐛 DEBUG: Log what we're saving
    console.log(`🔍 [DEBUG] setCached:`, {
      storeName,
      key,
      dataLength: Array.isArray(data) ? data.length : 'N/A',
      ttl,
      now,
      expiresAt: now + ttl,
      expiresIn: `${Math.round(ttl / 1000 / 60)} minutes`,
    });

    await db.put(storeName, cached as any);
    console.log(`💾 [Cache] Saved: ${storeName}/${key} (TTL: ${ttl}ms)`);
  } catch (error) {
    console.error(`❌ [Cache] Set error: ${storeName}/${key}`, error);
    throw error;
  }
}

/**
 * Delete cached item from IndexedDB
 */
export async function deleteCached(
  storeName: StoreName,
  key: string
): Promise<void> {
  try {
    const db = await initDB();
    await db.delete(storeName, key);
    console.log(`🗑️ [Cache] Deleted: ${storeName}/${key}`);
  } catch (error) {
    console.error(`❌ [Cache] Delete error: ${storeName}/${key}`, error);
    throw error;
  }
}

/**
 * Clear all items from a store
 */
export async function clearStore(storeName: StoreName): Promise<void> {
  try {
    const db = await initDB();
    await db.clear(storeName);
    console.log(`🧹 [Cache] Cleared store: ${storeName}`);
  } catch (error) {
    console.error(`❌ [Cache] Clear error: ${storeName}`, error);
    throw error;
  }
}

/**
 * Clear all expired items from a store
 */
export async function clearExpired(storeName: StoreName): Promise<number> {
  try {
    const db = await initDB();
    const now = Date.now();
    const tx = db.transaction(storeName, 'readwrite');
    const index = tx.store.index('by-expiry');

    let deleted = 0;
    let cursor = await index.openCursor(IDBKeyRange.upperBound(now));

    while (cursor) {
      await cursor.delete();
      deleted++;
      cursor = await cursor.continue();
    }

    await tx.done;
    console.log(`🧹 [Cache] Cleared ${deleted} expired items from ${storeName}`);
    return deleted;
  } catch (error) {
    console.error(`❌ [Cache] Clear expired error: ${storeName}`, error);
    return 0;
  }
}

/**
 * Get all keys from a store
 */
export async function getAllKeys(storeName: StoreName): Promise<string[]> {
  try {
    const db = await initDB();
    const keys = await db.getAllKeys(storeName);
    return keys;
  } catch (error) {
    console.error(`❌ [Cache] Get all keys error: ${storeName}`, error);
    return [];
  }
}

/**
 * Get cache statistics for a store
 */
export async function getCacheStats(storeName: StoreName): Promise<{
  totalItems: number;
  expiredItems: number;
  size: number;
}> {
  try {
    const db = await initDB();
    const allItems = await db.getAll(storeName);
    const now = Date.now();

    const expired = allItems.filter((item) => item.expiresAt < now).length;
    const size = JSON.stringify(allItems).length;

    return {
      totalItems: allItems.length,
      expiredItems: expired,
      size,
    };
  } catch (error) {
    console.error(`❌ [Cache] Stats error: ${storeName}`, error);
    return { totalItems: 0, expiredItems: 0, size: 0 };
  }
}

/**
 * Invalidate cache by version
 * Removes all items with version less than specified
 */
export async function invalidateByVersion(
  storeName: StoreName,
  minVersion: number
): Promise<number> {
  try {
    const db = await initDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.store;

    let deleted = 0;
    let cursor = await store.openCursor();

    while (cursor) {
      if (cursor.value.version < minVersion) {
        await cursor.delete();
        deleted++;
      }
      cursor = await cursor.continue();
    }

    await tx.done;
    console.log(`🔄 [Cache] Invalidated ${deleted} items in ${storeName} (version < ${minVersion})`);
    return deleted;
  } catch (error) {
    console.error(`❌ [Cache] Invalidate error: ${storeName}`, error);
    return 0;
  }
}

/**
 * Prefetch multiple items and cache them
 */
export async function prefetchAndCache<T>(
  storeName: StoreName,
  items: Array<{ key: string; data: T }>,
  config: CacheConfig = {}
): Promise<void> {
  try {
    const db = await initDB();
    const now = Date.now();
    const ttl = config.ttl || CACHE_TTL.PRACTICE_ITEMS;
    const version = config.version || 1;

    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.store;

    for (const item of items) {
      const cached: CachedItem<T> = {
        key: item.key,
        data: item.data,
        timestamp: now,
        expiresAt: now + ttl,
        version,
      };
      await store.put(cached as any);
    }

    await tx.done;
    console.log(`📦 [Cache] Prefetched ${items.length} items to ${storeName}`);
  } catch (error) {
    console.error(`❌ [Cache] Prefetch error: ${storeName}`, error);
    throw error;
  }
}

/**
 * Check if cache exists for a key (without returning data)
 */
export async function hasCached(
  storeName: StoreName,
  key: string
): Promise<boolean> {
  try {
    const db = await initDB();
    const cached = await db.get(storeName, key);

    if (!cached) return false;

    // Check if expired
    const now = Date.now();
    if (cached.expiresAt < now) {
      await db.delete(storeName, key);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`❌ [Cache] Has cached error: ${storeName}/${key}`, error);
    return false;
  }
}

/**
 * Clear all caches (all stores)
 */
export async function clearAllCaches(): Promise<void> {
  try {
    for (const storeName of STORES) {
      await clearStore(storeName);
    }
    console.log('🧹 [Cache] Cleared all caches');
  } catch (error) {
    console.error('❌ [Cache] Clear all error:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log('🔒 [IndexedDB] Database closed');
  }
}
