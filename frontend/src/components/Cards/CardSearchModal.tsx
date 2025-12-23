import { useState, useEffect, FormEvent } from 'react';
import { cardsApi } from '../../services/cardsApi';
import { ScryfallCard, AddCardRequest } from '../../types/card';
import './CardSearchModal.css';

interface CardSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCard: (card: AddCardRequest) => Promise<void>;
}

export default function CardSearchModal({
  isOpen,
  onClose,
  onAddCard,
}: CardSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ScryfallCard[]>([]);
  const [printings, setPrintings] = useState<ScryfallCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);
  const [ownerName, setOwnerName] = useState('');
  const [currentDeck, setCurrentDeck] = useState('');
  const [isBorrowed, setIsBorrowed] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPrintings, setIsLoadingPrintings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setSearchQuery('');
      setSearchResults([]);
      setPrintings([]);
      setSelectedCard(null);
      setOwnerName('');
      setCurrentDeck('');
      setIsBorrowed(false);
      setQuantity(1);
      setError('');
      setSearchError('');
    }
  }, [isOpen]);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      setSearchError('');
      const results = await cardsApi.searchCards(searchQuery);
      setSearchResults(results.data);

      if (results.data.length === 0) {
        setSearchError('No cards found. Try a different search term.');
      }
    } catch (err: any) {
      setSearchError(err.message || 'Failed to search cards');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCard = async (card: ScryfallCard) => {
    try {
      setIsLoadingPrintings(true);
      setSearchError('');

      // Search for all printings of this card
      // unique:prints ensures we get all different printings/sets
      const results = await cardsApi.searchCards(`!"${card.name}" unique:prints`);
      setPrintings(results.data);
      setSearchResults([]);
      setSearchQuery('');
    } catch (err: any) {
      setSearchError(err.message || 'Failed to load card printings');
    } finally {
      setIsLoadingPrintings(false);
    }
  };

  const handleSelectPrinting = (card: ScryfallCard) => {
    setSelectedCard(card);
    setPrintings([]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCard || !ownerName.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      await onAddCard({
        scryfall_id: selectedCard.id,
        owner_name: ownerName.trim(),
        current_deck: currentDeck.trim() || undefined,
        is_borrowed: isBorrowed,
        quantity: Number(quantity),
        set_code: selectedCard.set,
        set_name: selectedCard.set_name,
      });
      // Modal will be closed by parent component
    } catch (err: any) {
      setError(err.message || 'Failed to add card');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {selectedCard
              ? 'Add Card Details'
              : printings.length > 0
                ? 'Select Printing'
                : 'Search for a Card'}
          </h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {!selectedCard && printings.length === 0 ? (
          <div className="search-section">
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a card (e.g., Lightning Bolt)"
                className="search-input"
                disabled={isSearching}
                autoFocus
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </form>

            {searchError && <div className="error-message">{searchError}</div>}

            {searchResults.length > 0 && (
              <div className="search-results">
                <h3>Search Results ({searchResults.length})</h3>
                <div className="results-grid">
                  {searchResults.map((card) => (
                    <div
                      key={card.id}
                      className="result-card"
                      onClick={() => handleSelectCard(card)}
                    >
                      {card.image_uris?.normal && (
                        <img
                          src={card.image_uris.small || card.image_uris.normal}
                          alt={card.name}
                          className="card-image"
                        />
                      )}
                      <div className="card-info">
                        <h4>{card.name}</h4>
                        <p className="card-set">{card.set_name}</p>
                        <p className="card-type">{card.type_line}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : printings.length > 0 ? (
          <div className="printings-section">
            {isLoadingPrintings ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading printings...</p>
              </div>
            ) : (
              <>
                <p className="printings-info">
                  Found {printings.length} printing{printings.length !== 1 ? 's' : ''} of this card. Select the one you want to add:
                </p>
                <div className="printings-grid">
                  {printings.map((printing) => (
                    <div
                      key={printing.id}
                      className="printing-card"
                      onClick={() => handleSelectPrinting(printing)}
                    >
                      {printing.image_uris?.normal && (
                        <img
                          src={printing.image_uris.small || printing.image_uris.normal}
                          alt={`${printing.name} - ${printing.set_name}`}
                          className="printing-image"
                        />
                      )}
                      <div className="printing-info">
                        <h4>{printing.set_name}</h4>
                        <p className="printing-set">({printing.set.toUpperCase()})</p>
                        {printing.prices?.usd && (
                          <p className="printing-price">${printing.prices.usd}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setPrintings([]);
                    setSearchResults([]);
                  }}
                  className="btn-secondary back-to-search-btn"
                >
                  ← Back to Search
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="card-details-section">
            <div className="selected-card-preview">
              {selectedCard.image_uris?.normal && (
                <img
                  src={selectedCard.image_uris.normal}
                  alt={selectedCard.name}
                  className="selected-card-image"
                />
              )}
              <div className="selected-card-info">
                <h3>{selectedCard.name}</h3>
                <p>{selectedCard.set_name} ({selectedCard.set.toUpperCase()})</p>
                <p className="card-type">{selectedCard.type_line}</p>
                {selectedCard.prices?.usd && (
                  <p className="card-price">Price: ${selectedCard.prices.usd}</p>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedCard(null)}
              className="btn-secondary change-card-btn"
            >
              Choose Different Card
            </button>

            <form onSubmit={handleSubmit} className="card-form">
              <div className="form-group">
                <label htmlFor="owner_name">Owner Name *</label>
                <input
                  id="owner_name"
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  required
                  placeholder="Who owns this card?"
                  disabled={isSubmitting}
                  maxLength={255}
                />
              </div>

              <div className="form-group">
                <label htmlFor="quantity">Quantity *</label>
                <input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  required
                  min="1"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="current_deck">Current Deck (optional)</label>
                <input
                  id="current_deck"
                  type="text"
                  value={currentDeck}
                  onChange={(e) => setCurrentDeck(e.target.value)}
                  placeholder="Which deck is this in?"
                  disabled={isSubmitting}
                  maxLength={255}
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={isBorrowed}
                    onChange={(e) => setIsBorrowed(e.target.checked)}
                    disabled={isSubmitting}
                  />
                  This card is borrowed
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting || !ownerName.trim()}
                >
                  {isSubmitting ? 'Adding...' : 'Add to Collection'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
