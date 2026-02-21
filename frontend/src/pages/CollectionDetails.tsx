import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collectionsApi } from '../services/api';
import { cardsApi } from '../services/cardsApi';
import { Collection } from '../types/collection';
import { CardWithDetails, AddCardRequest } from '../types/card';
import CardsTable from '../components/Cards/CardsTable';
import CardSearchModal from '../components/Cards/CardSearchModal';
import DeckImportModal from '../components/Cards/DeckImportModal';
import './CollectionDetails.css';

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const IconFolderPlus = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    <line x1="12" y1="11" x2="12" y2="17" />
    <line x1="9" y1="14" x2="15" y2="14" />
  </svg>
);

const IconStar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export default function CollectionDetails() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const { t } = useTranslation();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [cards, setCards] = useState<CardWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [setFilter, setSetFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'owned' | 'borrowed'>('all');

  // Get unique owners, decks, and sets for filter dropdowns
  const filterOptions = useMemo(() => {
    const owners = Array.from(new Set(cards.map(c => c.owner_name).filter(Boolean)));
    const decks = Array.from(new Set(cards.map(c => c.current_deck).filter(Boolean))) as string[];
    const sets = Array.from(new Set(
      cards.map(c => c.set_name ?? c.scryfall_data?.set_name ?? null).filter(Boolean)
    )) as string[];
    return { owners, decks, sets };
  }, [cards]);

  // Filter and search cards
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      const matchesSearch = !searchQuery ||
        card.scryfall_data?.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesOwner = !ownerFilter || card.owner_name === ownerFilter;
      const matchesSet = !setFilter ||
        (card.set_name ?? card.scryfall_data?.set_name) === setFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'borrowed' && card.is_borrowed) ||
        (statusFilter === 'owned' && !card.is_borrowed);

      return matchesSearch && matchesOwner && matchesSet && matchesStatus;
    });
  }, [cards, searchQuery, ownerFilter, setFilter, statusFilter]);

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
      setLastSyncedAt(new Date());
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

  const varietyPct = Math.round(cards.length / Math.max(collectionStats.totalCards, 1) * 100);

  if (isLoading) {
    return (
      <div className="cd-page">
        <div className="cd-body">
          <div className="cd-loading">
            <p>{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="cd-page">
        <div className="cd-body">
          <div className="cd-empty-state">
            <h2>Collection not found</h2>
            <Link to="/collections" className="cd-btn-add" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}>
              {t('collections.backToCollections')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cd-page">
      <div className="cd-body">
        {/* Back link */}
        <Link to="/collections" className="cd-back-link">
          ← {t('collections.backToCollections')}
        </Link>

        {/* Collection heading */}
        <div className="cd-heading">
          <div>
            <h1 className="cd-title">{collection.name}</h1>
            <p className="cd-subtitle">{t('collections.manageSubtitle')}</p>
          </div>
          <span className="cd-tcg-badge">{collection.tcg_type.toUpperCase()}</span>
        </div>

        {/* Stat cards */}
        <div className="cd-stats">
          <div className="cd-stat-card">
            <div className="cd-stat-label">{t('cards.totalValue')}</div>
            <div className="cd-stat-value cd-stat-green">${collectionStats.totalValue.toFixed(2)}</div>
          </div>
          <div className="cd-stat-card">
            <div className="cd-stat-label">{t('cards.totalCards')}</div>
            <div className="cd-stat-value">{collectionStats.totalCards.toLocaleString()}</div>
            <div className="cd-stat-sub">{t('cards.acrossDecks', { count: filterOptions.decks.length })}</div>
          </div>
          <div className="cd-stat-card">
            <div className="cd-stat-label">{t('cards.uniquePrints')}</div>
            <div className="cd-stat-value">{cards.length.toLocaleString()}</div>
            <div className="cd-stat-sub">{t('cards.varietyPct', { pct: varietyPct })}</div>
          </div>
        </div>

        {error && (
          <div className="cd-error">
            {error}
            <button onClick={loadCollectionData} className="cd-retry-btn">
              {t('common.retry')}
            </button>
          </div>
        )}

        {cards.length === 0 ? (
          <div className="cd-empty-state">
            <div className="cd-empty-illustration">
              <div className="cd-empty-float cd-empty-float--top-left">
                <IconStar />
              </div>
              <div className="cd-empty-dropzone">
                <IconFolderPlus />
              </div>
              <div className="cd-empty-float cd-empty-float--bottom-right">
                <IconShield />
              </div>
            </div>
            <h3>{t('cards.noCards')}</h3>
            <p>{t('cards.noCardsDescription')}</p>
            <div className="cd-empty-actions">
              <button onClick={() => setIsImportModalOpen(true)} className="cd-btn-import">
                {t('cards.importDeck')}
              </button>
              <button onClick={() => setIsSearchModalOpen(true)} className="cd-btn-add">
                {t('cards.addCard')}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Filter bar */}
            <div className="cd-filter-bar">
              <div className="cd-search-box">
                <span className="cd-search-icon"><IconSearch /></span>
                <input
                  type="text"
                  placeholder={t('cards.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="cd-search-input"
                />
              </div>

              <select
                value={setFilter}
                onChange={(e) => setSetFilter(e.target.value)}
                className="cd-select"
              >
                <option value="">{t('cards.allSets')}</option>
                {filterOptions.sets.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="cd-select"
              >
                <option value="">{t('cards.allOwners')}</option>
                {filterOptions.owners.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'owned' | 'borrowed')}
                className="cd-select"
              >
                <option value="all">{t('cards.allStatus')}</option>
                <option value="owned">{t('cards.owned')}</option>
                <option value="borrowed">{t('cards.borrowed')}</option>
              </select>

              <button onClick={() => setIsImportModalOpen(true)} className="cd-btn-import">
                {t('cards.importDeck')}
              </button>
              <button onClick={() => setIsSearchModalOpen(true)} className="cd-btn-add">
                {t('cards.addCard')}
              </button>
            </div>

            {/* Results info */}
            <p className="cd-results-info">
              {t('cards.showingResults', { count: filteredCards.length, total: cards.length })}
            </p>

            <CardsTable
              cards={filteredCards}
              onUpdate={handleUpdateCard}
              onDelete={handleDeleteCard}
            />
          </>
        )}

        {/* Live pricing bar */}
        <div className="cd-live-bar">
          <span className="cd-live-dot" />
          <strong>{t('common.livePricing')}</strong>
          <span className="cd-live-sep">|</span>
          <span>
            {lastSyncedAt
              ? t('common.lastSynced', { time: lastSyncedAt.toLocaleTimeString() })
              : t('common.notSynced')}
          </span>
        </div>
      </div>

      <CardSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onAddCard={handleAddCard}
      />

      {collectionId && (
        <DeckImportModal
          isOpen={isImportModalOpen}
          collectionId={collectionId}
          onClose={() => setIsImportModalOpen(false)}
          onImportComplete={loadCollectionData}
        />
      )}
    </div>
  );
}
