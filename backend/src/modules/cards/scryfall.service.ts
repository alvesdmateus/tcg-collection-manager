import {
  ScryfallCard,
  ScryfallSearchResponse,
  ScryfallAutocompleteResponse,
  AppError,
} from '../../types';

/**
 * Cache entry for Scryfall data
 */
interface CacheEntry {
  data: ScryfallCard;
  timestamp: number;
}

/**
 * Scryfall API Service with Caching
 *
 * Wrapper for Scryfall API calls with in-memory caching.
 * Scryfall is a comprehensive Magic: The Gathering card database.
 *
 * API Documentation: https://scryfall.com/docs/api
 *
 * Features:
 * - Card search by name
 * - Get card by ID (with caching)
 * - Get card by exact name
 * - Autocomplete suggestions
 * - In-memory cache with configurable TTL
 *
 * Rate Limiting:
 * Scryfall requests 50-100ms between requests.
 * Caching significantly reduces API calls.
 */
class ScryfallService {
  private readonly baseUrl = 'https://api.scryfall.com';
  private readonly cache = new Map<string, CacheEntry>();
  private readonly cacheTTL = 60 * 60 * 1000; // 1 hour in milliseconds
  private cacheHits = 0;
  private cacheMisses = 0;

  /**
   * Search cards by name
   * 
   * @param query - Search query
   * @returns Search results with cards
   */
  async searchCards(query: string): Promise<ScryfallSearchResponse> {
    try {
      const url = `${this.baseUrl}/cards/search?q=${encodeURIComponent(query)}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          return {
            object: 'list',
            total_cards: 0,
            has_more: false,
            data: [],
          };
        }
        throw new Error(`Scryfall API error: ${response.statusText}`);
      }

      return (await response.json()) as ScryfallSearchResponse;
    } catch (error) {
      console.error('Scryfall search error:', error);
      throw new AppError('Erro ao buscar cartas no Scryfall', 500);
    }
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.cacheTTL;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { hits: number; misses: number; size: number; hitRate: string } {
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total > 0 ? ((this.cacheHits / total) * 100).toFixed(2) : '0.00';
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      size: this.cache.size,
      hitRate: `${hitRate}%`,
    };
  }

  /**
   * Clear expired cache entries
   */
  private cleanCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= this.cacheTTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get card by Scryfall ID (with caching)
   *
   * @param scryfallId - Scryfall card ID
   * @returns Card data
   */
  async getCardById(scryfallId: string): Promise<ScryfallCard> {
    // Check cache first
    const cached = this.cache.get(scryfallId);
    if (cached && this.isCacheValid(cached)) {
      this.cacheHits++;
      return cached.data;
    }

    // Cache miss - fetch from API
    this.cacheMisses++;

    try {
      const url = `${this.baseUrl}/cards/${scryfallId}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          throw new AppError('Carta não encontrada no Scryfall', 404);
        }
        throw new Error(`Scryfall API error: ${response.statusText}`);
      }

      const data = (await response.json()) as ScryfallCard;

      // Store in cache
      this.cache.set(scryfallId, {
        data,
        timestamp: Date.now(),
      });

      // Periodically clean expired entries
      if (this.cacheMisses % 100 === 0) {
        this.cleanCache();
      }

      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Scryfall get card error:', error);
      throw new AppError('Erro ao buscar carta no Scryfall', 500);
    }
  }

  /**
   * Get card by exact name
   * 
   * @param name - Exact card name
   * @returns Card data
   */
  async getCardByName(name: string): Promise<ScryfallCard> {
    try {
      const url = `${this.baseUrl}/cards/named?exact=${encodeURIComponent(name)}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          throw new AppError('Carta não encontrada no Scryfall', 404);
        }
        throw new Error(`Scryfall API error: ${response.statusText}`);
      }

      return (await response.json()) as ScryfallCard;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Scryfall get by name error:', error);
      throw new AppError('Erro ao buscar carta no Scryfall', 500);
    }
  }

  /**
   * Autocomplete card names
   * 
   * @param query - Partial card name
   * @returns List of matching card names
   */
  async autocomplete(query: string): Promise<ScryfallAutocompleteResponse> {
    try {
      const url = `${this.baseUrl}/cards/autocomplete?q=${encodeURIComponent(query)}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Scryfall API error: ${response.statusText}`);
      }

      return (await response.json()) as ScryfallAutocompleteResponse;
    } catch (error) {
      console.error('Scryfall autocomplete error:', error);
      throw new AppError('Erro ao buscar sugestões no Scryfall', 500);
    }
  }
}

export default new ScryfallService();