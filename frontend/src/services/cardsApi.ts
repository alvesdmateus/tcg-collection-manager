import {
  CardWithDetails,
  AddCardRequest,
  UpdateCardRequest,
  ScryfallSearchResponse,
  ScryfallAutocompleteResponse,
} from '../types/card';
import { getAuthHeaders, handleResponse, fetchWithConnectionCheck } from './fetchClient';

/**
 * Cards API
 * All methods require authentication via JWT token
 */
export const cardsApi = {
  /**
   * Get all cards in a collection
   */
  getCollectionCards: async (collectionId: string): Promise<CardWithDetails[]> => {
    const response = await fetchWithConnectionCheck(`/api/collections/${collectionId}/cards`, {
      headers: getAuthHeaders(),
    });

    return handleResponse<CardWithDetails[]>(response);
  },

  /**
   * Get a single card by ID
   */
  getById: async (cardId: string): Promise<CardWithDetails> => {
    const response = await fetchWithConnectionCheck(`/api/cards/${cardId}`, {
      headers: getAuthHeaders(),
    });

    return handleResponse<CardWithDetails>(response);
  },

  /**
   * Add a card to a collection
   */
  addCard: async (collectionId: string, card: AddCardRequest): Promise<CardWithDetails> => {
    const response = await fetchWithConnectionCheck(`/api/collections/${collectionId}/cards`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(card),
    });

    return handleResponse<CardWithDetails>(response);
  },

  /**
   * Update a card
   */
  update: async (cardId: string, updates: UpdateCardRequest): Promise<CardWithDetails> => {
    const response = await fetchWithConnectionCheck(`/api/cards/${cardId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    return handleResponse<CardWithDetails>(response);
  },

  /**
   * Delete a card
   */
  delete: async (cardId: string): Promise<void> => {
    const response = await fetchWithConnectionCheck(`/api/cards/${cardId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    await handleResponse<{ message: string }>(response);
  },

  /**
   * Import a deck list (bulk add cards by name)
   */
  importDeckList: async (
    collectionId: string,
    entries: { name: string; quantity: number }[],
    ownerName: string
  ): Promise<{ imported: CardWithDetails[]; failed: { name: string; reason: string }[] }> => {
    const response = await fetchWithConnectionCheck(`/api/collections/${collectionId}/cards/import`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ entries, owner_name: ownerName }),
    });

    return handleResponse<{ imported: CardWithDetails[]; failed: { name: string; reason: string }[] }>(response);
  },

  /**
   * Search cards via Scryfall
   */
  searchCards: async (query: string): Promise<ScryfallSearchResponse> => {
    const response = await fetchWithConnectionCheck(`/api/cards/search?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders(),
    });

    return handleResponse<ScryfallSearchResponse>(response);
  },

  /**
   * Get autocomplete suggestions from Scryfall
   */
  autocomplete: async (query: string): Promise<ScryfallAutocompleteResponse> => {
    const response = await fetchWithConnectionCheck(`/api/cards/autocomplete?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders(),
    });

    return handleResponse<ScryfallAutocompleteResponse>(response);
  },
};
