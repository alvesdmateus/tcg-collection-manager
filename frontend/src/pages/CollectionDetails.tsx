import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collectionsApi } from '../services/api';
import { cardsApi } from '../services/cardsApi';
import { Collection } from '../types/collection';
import { CardWithDetails, AddCardRequest } from '../types/card';
import CardsTable from '../components/Cards/CardsTable';
import CardSearchModal from '../components/Cards/CardSearchModal';
import Header from '../components/Header/Header';
import { useAuth } from '../contexts/AuthContext';
import './CollectionDetails.css';

export default function CollectionDetails() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { logout } = useAuth();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [cards, setCards] = useState<CardWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [deckFilter, setDeckFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'owned' | 'borrowed'>('all');

  // Get unique owners and decks for filter dropdowns
  const filterOptions = useMemo(() => {
    const owners = Array.from(new Set(cards.map(c => c.owner_name).filter(Boolean)));
    const decks = Array.from(new Set(cards.map(c => c.current_deck).filter(Boolean)));
    return { owners, decks };
  }, [cards]);

  // Filter and search cards
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      // Search by card name
      const matchesSearch = !searchQuery ||
        card.scryfall_data?.name.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter by owner
      const matchesOwner = !ownerFilter || card.owner_name === ownerFilter;

      // Filter by deck
      const matchesDeck = !deckFilter || card.current_deck === deckFilter;

      // Filter by status
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'borrowed' && card.is_borrowed) ||
        (statusFilter === 'owned' && !card.is_borrowed);

      return matchesSearch && matchesOwner && matchesDeck && matchesStatus;
    });
  }, [cards, searchQuery, ownerFilter, deckFilter, statusFilter]);

  // Calculate total cards and total value based on filtered cards
  const collectionStats = useMemo(() => {
    const totalCards = filteredCards.reduce((sum, card) => sum + (card.quantity || 1), 0);
    const totalValue = filteredCards.reduce((sum, card) => {
      const price = parseFloat(card.scryfall_data?.prices?.usd || card.scryfall_data?.prices?.usd_foil || '0');
      const quantity = card.quantity || 1;
      return sum + (price * quantity);
    }, 0);

    return { totalCards, totalValue };
  }, [filteredCards]);

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
    if (!confirm(t('cards.confirmDelete') || 'Are you sure you want to delete this card?')) return;

    try {
      await cardsApi.delete(cardId);
      await loadCollectionData();
    } catch (err: any) {
      setError(err.message || t('cards.failedToDelete'));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
      <Header onLogout={handleLogout} showUserInfo={true} />

      <header className="collection-header">
        <div className="header-top">
          <Link to="/collections" className="back-link">
            ← {t('collections.backToCollections') || 'Back to Collections'}
          </Link>
        </div>

        <div className="collection-info">
          <h1>{collection.name}</h1>
          <span className="tcg-badge">{collection.tcg_type.toUpperCase()}</span>
        </div>

        <div className="collection-stats">
          <div className="stat-card">
            <span className="stat-label">{t('cards.totalCards') || 'Total Cards'}</span>
            <span className="stat-value">{collectionStats.totalCards}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">{t('cards.uniqueCards') || 'Unique Cards'}</span>
            <span className="stat-value">{cards.length}</span>
          </div>
          <div className="stat-card stat-value-highlight">
            <span className="stat-label">{t('cards.totalValue') || 'Total Value'}</span>
            <span className="stat-value stat-price">
              ${collectionStats.totalValue.toFixed(2)}
            </span>
          </div>
        </div>
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
            <h3>{t('cards.noCards')}</h3>
            <p>{t('cards.noCardsDescription')}</p>
            <button onClick={() => setIsSearchModalOpen(true)} className="btn-primary">
              {t('cards.searchCard')}
            </button>
          </div>
        ) : (
          <>
            {/* Search and Filter Bar */}
            <div className="search-filter-bar">
              <div className="search-row">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder={t('cards.searchPlaceholder') || 'Search cards by name...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="clear-search"
                      title={t('common.clear') || 'Clear'}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button onClick={() => setIsSearchModalOpen(true)} className="btn-add-card">
                  {t('cards.addCard') || '+ Add Card'}
                </button>
              </div>

              <div className="filters">
                <select
                  value={ownerFilter}
                  onChange={(e) => setOwnerFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">{t('cards.allOwners') || 'All Owners'}</option>
                  {filterOptions.owners.map(owner => (
                    <option key={owner} value={owner}>{owner}</option>
                  ))}
                </select>

                <select
                  value={deckFilter}
                  onChange={(e) => setDeckFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">{t('cards.allDecks') || 'All Decks'}</option>
                  {filterOptions.decks.map(deck => (
                    <option key={deck ?? ''} value={deck ?? ''}>{deck}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="filter-select"
                >
                  <option value="all">{t('cards.allStatus') || 'All Status'}</option>
                  <option value="owned">{t('cards.owned')}</option>
                  <option value="borrowed">{t('cards.borrowed')}</option>
                </select>

                {(searchQuery || ownerFilter || deckFilter || statusFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setOwnerFilter('');
                      setDeckFilter('');
                      setStatusFilter('all');
                    }}
                    className="btn-clear-filters"
                  >
                    {t('cards.clearFilters') || 'Clear All Filters'}
                  </button>
                )}
              </div>
            </div>

            {/* Results count */}
            <div className="results-info">
              {t('cards.showingResults', {
                count: filteredCards.length,
                total: cards.length
              }) || `Showing ${filteredCards.length} of ${cards.length} cards`}
            </div>

            <CardsTable
              cards={filteredCards}
              onUpdate={handleUpdateCard}
              onDelete={handleDeleteCard}
            />
          </>
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
