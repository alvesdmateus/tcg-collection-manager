import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { collectionsApi } from '../services/api';
import { Collection, CreateCollectionRequest } from '../types/collection';
import CollectionCard from '../components/Collections/CollectionCard';
import CollectionModal from '../components/Collections/CollectionModal';
import './Collections.css';

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const IconFilter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const IconSort = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="16" y2="6" />
    <line x1="4" y1="12" x2="12" y2="12" />
    <line x1="4" y1="18" x2="8" y2="18" />
    <polyline points="15 15 18 18 21 15" />
    <line x1="18" y1="9" x2="18" y2="18" />
  </svg>
);

export default function Collections() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCollections();
  }, []);

  const portfolioValue = useMemo(() => {
    return collections.reduce((sum, c) => sum + parseFloat(String(c.total_value || 0)), 0);
  }, [collections]);

  const filteredCollections = useMemo(() => {
    if (!searchQuery) return collections;
    return collections.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [collections, searchQuery]);

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

  const handleCreateCollection = async (data: CreateCollectionRequest) => {
    try {
      await collectionsApi.create(data);
      await loadCollections();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || t('collections.failedToCreate'));
      throw err;
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
      throw err;
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
    <div className="collections-page">
      {/* Page header */}
      <div className="collections-header">
        <div className="collections-header-left">
          <h1 className="collections-heading">{t('collections.myCollections')}</h1>
          <div className="collections-portfolio-value">
            <span className="portfolio-label">{t('collections.totalPortfolioValue')}</span>
            <span className="portfolio-amount">${portfolioValue.toFixed(2)}</span>
          </div>
        </div>
        <button onClick={openCreateModal} className="btn-new-collection">
          {t('collections.newCollection')}
        </button>
      </div>

      {/* Search / Filter / Sort bar */}
      <div className="collections-filter-bar">
        <div className="collections-search-box">
          <span className="collections-search-icon"><IconSearch /></span>
          <input
            type="text"
            placeholder={t('collections.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="collections-search-input"
          />
        </div>
        <button className="collections-filter-btn" type="button">
          <IconFilter /> {t('collections.filter')}
        </button>
        <button className="collections-sort-btn" type="button">
          <IconSort /> {t('collections.sort')}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="collections-error">
          {error}
          <button onClick={loadCollections} className="collections-retry-btn">
            {t('common.retry')}
          </button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="collections-loading">
          <div className="collections-spinner" />
          <p>{t('collections.loadingCollections')}</p>
        </div>
      ) : collections.length === 0 && !searchQuery ? (
        <div className="collections-empty">
          <div className="collections-empty-icon">📚</div>
          <h3>{t('collections.noCollections')}</h3>
          <p>{t('collections.noCollectionsDescription')}</p>
          <button onClick={openCreateModal} className="btn-new-collection" style={{ marginTop: '1rem' }}>
            {t('collections.createCollection')}
          </button>
        </div>
      ) : (
        <div className="collections-grid">
          {filteredCollections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onEdit={openEditModal}
              onDelete={handleDeleteCollection}
              onView={(c) => navigate(`/collections/${c.id}`)}
            />
          ))}
          {/* Add Collection placeholder card */}
          <div className="collection-card collection-card--add" onClick={openCreateModal}>
            <div className="collection-card-add-icon">+</div>
            <span className="collection-card-add-label">{t('collections.addCollection')}</span>
            <span className="collection-card-add-sub">{t('collections.trackMoreCards')}</span>
          </div>
        </div>
      )}

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
