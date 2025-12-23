import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collectionsApi } from '../services/api';
import { cardsApi } from '../services/cardsApi';
import { Collection } from '../types/collection';
import { CardWithDetails, AddCardRequest } from '../types/card';
import CardsTable from '../components/Cards/CardsTable';
import CardSearchModal from '../components/Cards/CardSearchModal';
import './CollectionDetails.css';

export default function CollectionDetails() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [cards, setCards] = useState<CardWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  useEffect(() => {
    if (collectionId) {
      loadCollectionData();
    }
  }, [collectionId]);

  const loadCollectionData = async () => {
    if (!collectionId) return;

    try {
      setIsLoading(true);
      setError('');

      const [collectionData, cardsData] = await Promise.all([
        collectionsApi.getById(collectionId),
        cardsApi.getCollectionCards(collectionId),
      ]);

      setCollection(collectionData);
      setCards(cardsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load collection');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCard = async (cardData: AddCardRequest) => {
    if (!collectionId) return;

    try {
      await cardsApi.addCard(collectionId, cardData);
      await loadCollectionData();
      setIsSearchModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add card');
      throw err;
    }
  };

  const handleUpdateCard = async (cardId: string, updates: any) => {
    try {
      await cardsApi.update(cardId, updates);
      await loadCollectionData();
    } catch (err: any) {
      setError(err.message || 'Failed to update card');
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return;

    try {
      await cardsApi.delete(cardId);
      await loadCollectionData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete card');
    }
  };

  if (isLoading) {
    return (
      <div className="collection-details-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading collection...</p>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="collection-details-container">
        <div className="error-state">
          <h2>Collection not found</h2>
          <Link to="/collections" className="btn-primary">
            Back to Collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="collection-details-container">
      <header className="collection-header">
        <div className="header-content">
          <Link to="/collections" className="back-link">
            ← Back to Collections
          </Link>
          <div className="collection-info">
            <h1>{collection.name}</h1>
            <span className="tcg-badge">{collection.tcg_type.toUpperCase()}</span>
          </div>
          <p className="card-count">
            {cards.length} {cards.length === 1 ? 'card' : 'cards'}
          </p>
        </div>
        <button onClick={() => setIsSearchModalOpen(true)} className="btn-primary">
          + Add Card
        </button>
      </header>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={loadCollectionData} className="retry-button">
            Retry
          </button>
        </div>
      )}

      <main className="collection-main">
        {cards.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎴</div>
            <h3>No cards yet</h3>
            <p>Add your first card to this collection</p>
            <button onClick={() => setIsSearchModalOpen(true)} className="btn-primary">
              Search Cards
            </button>
          </div>
        ) : (
          <CardsTable
            cards={cards}
            onUpdate={handleUpdateCard}
            onDelete={handleDeleteCard}
          />
        )}
      </main>

      <CardSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onAddCard={handleAddCard}
      />
    </div>
  );
}
