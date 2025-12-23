import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collectionsApi } from '../services/api';
import { Collection, CreateCollectionRequest } from '../types/collection';
import CollectionCard from '../components/Collections/CollectionCard';
import CollectionModal from '../components/Collections/CollectionModal';
import Header from '../components/Header/Header';
import './Collections.css';

export default function Collections() {
  const { t } = useTranslation();
  const { logout } = useAuth();
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
      setError(err.message || t('collections.failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateCollection = async (data: CreateCollectionRequest) => {
    try {
      await collectionsApi.create(data);
      await loadCollections();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || t('collections.failedToCreate'));
      throw err; // Re-throw so modal can show error
    }
  };

  const handleUpdateCollection = async (data: CreateCollectionRequest) => {
    if (!editingCollection) return;

    try {
      await collectionsApi.update(editingCollection.id, data);
      await loadCollections();
      setEditingCollection(null);
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || t('collections.failedToUpdate'));
      throw err; // Re-throw so modal can show error
    }
  };

  const handleDeleteCollection = async (collection: Collection) => {
    try {
      await collectionsApi.delete(collection.id);
      await loadCollections();
    } catch (err: any) {
      alert(err.message || t('collections.failedToDelete'));
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
      <Header onLogout={handleLogout} showUserInfo={true} />

      <main className="collections-main">
        <div className="collections-toolbar">
          <div>
            <h2>{t('collections.title')}</h2>
            <p className="collections-count">
              {t('collections.count', { count: collections.length })}
            </p>
          </div>
          <button onClick={openCreateModal} className="btn-primary">
            {t('collections.newCollection')}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={loadCollections} className="retry-button">
              {t('common.retry')}
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>{t('collections.loadingCollections')}</p>
          </div>
        ) : collections.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>{t('collections.noCollections')}</h3>
            <p>{t('collections.noCollectionsDescription')}</p>
            <button onClick={openCreateModal} className="btn-primary">
              {t('collections.createCollection')}
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
        title={editingCollection ? t('collections.editCollection') : t('collections.createCollection')}
      />
    </div>
  );
}
