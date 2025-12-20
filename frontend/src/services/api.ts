import { Collection, CreateCollectionRequest, UpdateCollectionRequest } from '../types/collection';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const collectionsApi = {
  // Get all collections for the current user
  getAll: async (): Promise<Collection[]> => {
    const response = await fetch('/api/collections', {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch collections');
    }

    const data = await response.json();
    return data.collections;
  },

  // Get a single collection by ID
  getById: async (id: string): Promise<Collection> => {
    const response = await fetch(`/api/collections/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch collection');
    }

    const data = await response.json();
    return data.collection;
  },

  // Create a new collection
  create: async (collection: CreateCollectionRequest): Promise<Collection> => {
    const response = await fetch('/api/collections', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(collection),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create collection');
    }

    const data = await response.json();
    return data.collection;
  },

  // Update a collection
  update: async (id: string, updates: UpdateCollectionRequest): Promise<Collection> => {
    const response = await fetch(`/api/collections/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update collection');
    }

    const data = await response.json();
    return data.collection;
  },

  // Delete a collection
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`/api/collections/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete collection');
    }
  },
};
