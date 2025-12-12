import {
  ScryfallCard,
  ScryfallSearchResponse,
  ScryfallAutocompleteResponse,
  AppError,
} from '../../types';

/**
 * Scryfall API Service
 * 
 * Wrapper for Scryfall API calls.
 * Scryfall is a comprehensive Magic: The Gathering card database.
 * 
 * API Documentation: https://scryfall.com/docs/api
 * 
 * Features:
 * - Card search by name
 * - Get card by ID
 * - Get card by exact name
 * - Autocomplete suggestions
 * 
 * Rate Limiting:
 * Scryfall requests 50-100ms between requests.
 * For production, implement rate limiting and caching.
 */
class ScryfallService {
  private readonly baseUrl = 'https://api.scryfall.com';

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
   * Get card by Scryfall ID
   * 
   * @param scryfallId - Scryfall card ID
   * @returns Card data
   */
  async getCardById(scryfallId: string): Promise<ScryfallCard> {
    try {
      const url = `${this.baseUrl}/cards/${scryfallId}`;
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