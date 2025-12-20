import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collectionsApi } from '../services/api';
import { Collection, CreateCollectionRequest } from '../types/collection';
import CollectionCard from '../components/Collections/CollectionCard';
import CollectionModal from '../components/Collections/CollectionModal';
import './Collections.css';

export default function Collections() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await collectionsApi.getAll();
      setCollections(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load collections');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateCollection = async (data: CreateCollectionRequest) => {
    await collectionsApi.create(data);
    await loadCollections();
  };

  const handleUpdateCollection = async (data: CreateCollectionRequest) => {
    if (editingCollection) {
      await collectionsApi.update(editingCollection.id, data);
      await loadCollections();
      setEditingCollection(null);
    }
  };

  const handleDeleteCollection = async (collection: Collection) => {
    try {
      await collectionsApi.delete(collection.id);
      await loadCollections();
    } catch (err: any) {
      alert(err.message || 'Failed to delete collection');
    }
  };

  const openCreateModal = () => {
    setEditingCollection(null);
    setIsModalOpen(true);
  };

  const openEditModal = (collection: Collection) => {
    setEditingCollection(collection);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCollection(null);
  };

  return (
    <div className="collections-container">
      <header className="collections-header">
        <h1>TCG Collection Manager</h1>
        <div className="user-info">
          <span>Welcome, {user?.email}</span>
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <main className="collections-main">
        <div className="collections-toolbar">
          <div>
            <h2>Your Collections</h2>
            <p className="collections-count">
              {collections.length} {collections.length === 1 ? 'collection' : 'collections'}
            </p>
          </div>
          <button onClick={openCreateModal} className="btn-primary">
            + New Collection
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={loadCollections} className="retry-button">
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading collections...</p>
          </div>
        ) : collections.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No collections yet</h3>
            <p>Create your first collection to start managing your TCG cards</p>
            <button onClick={openCreateModal} className="btn-primary">
              Create Collection
            </button>
          </div>
        ) : (
          <div className="collections-grid">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onEdit={openEditModal}
                onDelete={handleDeleteCollection}
              />
            ))}
          </div>
        )}
      </main>

      <CollectionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={editingCollection ? handleUpdateCollection : handleCreateCollection}
        collection={editingCollection}
        title={editingCollection ? 'Edit Collection' : 'Create Collection'}
      />
    </div>
  );
}
