import { useState, useEffect, FormEvent } from 'react';
import { CardWithDetails, UpdateCardRequest } from '../../types/card';
import './CardEditModal.css';

interface CardEditModalProps {
  card: CardWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: UpdateCardRequest) => Promise<void>;
}

export default function CardEditModal({
  card,
  isOpen,
  onClose,
  onUpdate,
}: CardEditModalProps) {
  const [ownerName, setOwnerName] = useState(card.owner_name);
  const [currentDeck, setCurrentDeck] = useState(card.current_deck || '');
  const [isBorrowed, setIsBorrowed] = useState(card.is_borrowed);
  const [quantity, setQuantity] = useState(card.quantity);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setOwnerName(card.owner_name);
      setCurrentDeck(card.current_deck || '');
      setIsBorrowed(card.is_borrowed);
      setQuantity(card.quantity);
      setError('');
    }
  }, [isOpen, card]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      await onUpdate({
        owner_name: ownerName.trim(),
        current_deck: currentDeck.trim() || undefined,
        is_borrowed: isBorrowed,
        quantity: Number(quantity),
      });
      // Modal will be closed by parent component
    } catch (err: any) {
      setError(err.message || 'Failed to update card');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Card Details</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="card-preview">
          {card.scryfall_data?.image_uris?.normal && (
            <img
              src={card.scryfall_data.image_uris.normal}
              alt={card.scryfall_data.name}
              className="preview-image"
            />
          )}
          <div className="preview-info">
            <h3>{card.scryfall_data?.name || 'Unknown Card'}</h3>
            <p>{card.scryfall_data?.set_name}</p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="card-edit-form">
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
            <label htmlFor="current_deck">Current Deck</label>
            <input
              id="current_deck"
              type="text"
              value={currentDeck}
              onChange={(e) => setCurrentDeck(e.target.value)}
              placeholder="Which deck is this in?"
              disabled={isSubmitting}
              maxLength={255}
            />
            <small>Leave empty to remove from deck</small>
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
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
