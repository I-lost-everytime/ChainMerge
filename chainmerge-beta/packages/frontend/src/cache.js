// cache.js — shared in-memory tx cache
// ChainIndex writes to it, ChainView reads from it

const cache = new Map()

export function cacheKey(chain, hash) {
  return `${chain}::${hash}`
}

export function getFromCache(chain, hash) {
  return cache.get(cacheKey(chain, hash)) || null
}

export function saveToCache(chain, hash, data) {
  const key = cacheKey(chain, hash)
  cache.set(key, {
    ...data,
    _cached_at: Date.now(),
    _key: key,
  })
}

export function getAllCached() {
  return Array.from(cache.values()).sort((a, b) => b._cached_at - a._cached_at)
}

export function getCacheSize() {
  return cache.size
}

export function clearCache() {
  cache.clear()
}

// Query the cache with filters
// filters: { chain, status, type, search }
export function queryCache(filters = {}) {
  let results = getAllCached()

  if (filters.chain && filters.chain !== 'all') {
    results = results.filter(tx => tx.chain === filters.chain)
  }
  if (filters.status && filters.status !== 'all') {
    results = results.filter(tx => tx.status === filters.status)
  }
  if (filters.type && filters.type !== 'all') {
    results = results.filter(tx =>
      tx.events?.some(e => e.type === filters.type)
    )
  }
  if (filters.search) {
    const s = filters.search.toLowerCase()
    results = results.filter(tx =>
      tx.tx_hash?.toLowerCase().includes(s) ||
      tx.sender?.toLowerCase().includes(s) ||
      tx.receiver?.toLowerCase().includes(s)
    )
  }

  return results
}