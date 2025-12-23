import {
  CardWithDetails,
  AddCardRequest,
  UpdateCardRequest,
  ScryfallSearchResponse,
  ScryfallAutocompleteResponse,
} from '../types/card';

/**
 * Get authorization headers with JWT token
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

/**
 * Handle API response and extract data
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || `Request failed with status ${response.status}`);
  }

  return result.data;
}

/**
 * Cards API
 * All methods require authentication via JWT token
 */
export const cardsApi = {
  /**
   * Get all cards in a collection
   */
  getCollectionCards: async (collectionId: string): Promise<CardWithDetails[]> => {
    const response = await fetch(`/api/collections/${collectionId}/cards`, {
      headers: getAuthHeaders(),
    });

    return handleResponse<CardWithDetails[]>(response);
  },

  /**
   * Get a single card by ID
   */
  getById: async (cardId: string): Promise<CardWithDetails> => {
    const response = await fetch(`/api/cards/${cardId}`, {
      headers: getAuthHeaders(),
    });

    return handleResponse<CardWithDetails>(response);
  },

  /**
   * Add a card to a collection
   */
  addCard: async (collectionId: string, card: AddCardRequest): Promise<CardWithDetails> => {
    const response = await fetch(`/api/collections/${collectionId}/cards`, {
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
    const response = await fetch(`/api/cards/${cardId}`, {
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
    const response = await fetch(`/api/cards/${cardId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    await handleResponse<{ message: string }>(response);
  },

  /**
   * Search cards via Scryfall
   */
  searchCards: async (query: string): Promise<ScryfallSearchResponse> => {
    const response = await fetch(`/api/cards/search?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders(),
    });

    return handleResponse<ScryfallSearchResponse>(response);
  },

  /**
   * Get autocomplete suggestions from Scryfall
   */
  autocomplete: async (query: string): Promise<ScryfallAutocompleteResponse> => {
    const response = await fetch(`/api/cards/autocomplete?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders(),
    });

    return handleResponse<ScryfallAutocompleteResponse>(response);
  },
};
