import { Collection, CreateCollectionRequest, UpdateCollectionRequest } from '../types/collection';
import { getAuthHeaders, handleResponse, fetchWithConnectionCheck } from './fetchClient';

/**
 * Collections API
 * All methods require authentication via JWT token
 */
export const collectionsApi = {
  /**
   * Get all collections for the current user
   */
  getAll: async (): Promise<Collection[]> => {
    const response = await fetchWithConnectionCheck('/api/collections', {
      headers: getAuthHeaders(),
    });

    return handleResponse<Collection[]>(response);
  },

  /**
   * Get a single collection by ID
   */
  getById: async (id: string): Promise<Collection> => {
    const response = await fetchWithConnectionCheck(`/api/collections/${id}`, {
      headers: getAuthHeaders(),
    });

    return handleResponse<Collection>(response);
  },

  /**
   * Create a new collection
   */
  create: async (collection: CreateCollectionRequest): Promise<Collection> => {
    const response = await fetchWithConnectionCheck('/api/collections', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(collection),
    });

    return handleResponse<Collection>(response);
  },

  /**
   * Update a collection
   */
  update: async (id: string, updates: UpdateCollectionRequest): Promise<Collection> => {
    const response = await fetchWithConnectionCheck(`/api/collections/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    return handleResponse<Collection>(response);
  },

  /**
   * Delete a collection
   */
  delete: async (id: string): Promise<void> => {
    const response = await fetchWithConnectionCheck(`/api/collections/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    // Delete returns { success: true, message: string }
    // We don't need the message, just verify success
    await handleResponse<{ message: string }>(response);
  },
};
