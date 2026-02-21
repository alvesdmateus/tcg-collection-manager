import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CardWithDetails, UpdateCardRequest } from '../../types/card';
import './CardEditModal.css';

interface CardEditModalProps {
  card: CardWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: UpdateCardRequest) => Promise<void>;
}

// ─── Inline SVG Icons ────────────────────────────────────────────────

function IconEdit() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────

export default function CardEditModal({
  card,
  isOpen,
  onClose,
  onUpdate,
}: CardEditModalProps) {
  const { t } = useTranslation();
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

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

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
    } catch (err: any) {
      setError(err.message || t('cards.failedToUpdate'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cem-overlay" onClick={onClose}>
      <div className="cem-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cem-header">
          <div className="cem-header-icon">
            <IconEdit />
          </div>
          <h2 className="cem-header-title">{t('cards.editCard')}</h2>
          <button className="cem-close-btn" onClick={onClose} type="button">
            <IconClose />
          </button>
        </div>

        {/* Body */}
        <div className="cem-body">
          {/* Card preview */}
          <div className="cem-card-preview">
            {card.scryfall_data?.image_uris?.normal && (
              <img
                src={card.scryfall_data.image_uris.normal}
                alt={card.scryfall_data.name}
                className="cem-preview-img"
              />
            )}
            <div className="cem-preview-info">
              <h3 className="cem-preview-name">
                {card.scryfall_data?.name || 'Unknown Card'}
              </h3>
              <p className="cem-preview-set">{card.scryfall_data?.set_name}</p>
            </div>
          </div>

          {error && <div className="cem-error">{error}</div>}

          {/* Form */}
          <form id="cem-form" onSubmit={handleSubmit} className="cem-form">
            <div className="cem-form-group">
              <label className="cem-form-label" htmlFor="cem-owner">
                {t('cards.ownerNameLabel')} *
              </label>
              <input
                id="cem-owner"
                className="cem-form-input"
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
                placeholder={t('cards.ownerNamePlaceholder')}
                disabled={isSubmitting}
                maxLength={255}
              />
            </div>

            <div className="cem-form-group">
              <label className="cem-form-label" htmlFor="cem-quantity">
                {t('cards.quantityLabel')} *
              </label>
              <input
                id="cem-quantity"
                className="cem-form-input"
                type="number"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                required
                min="1"
                disabled={isSubmitting}
              />
            </div>

            <div className="cem-form-group">
              <label className="cem-form-label" htmlFor="cem-deck">
                {t('cards.currentDeckLabel')}
              </label>
              <input
                id="cem-deck"
                className="cem-form-input"
                type="text"
                value={currentDeck}
                onChange={(e) => setCurrentDeck(e.target.value)}
                placeholder={t('cards.currentDeckPlaceholder')}
                disabled={isSubmitting}
                maxLength={255}
              />
              <span className="cem-form-hint">
                {t('cards.deckHint')}
              </span>
            </div>

            <label className="cem-checkbox-group">
              <input
                type="checkbox"
                checked={isBorrowed}
                onChange={(e) => setIsBorrowed(e.target.checked)}
                disabled={isSubmitting}
              />
              {t('cards.isBorrowedLabel')}
            </label>
          </form>
        </div>

        {/* Footer */}
        <div className="cem-footer">
          <button
            type="button"
            className="cem-btn-cancel"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            form="cem-form"
            className="cem-btn-save"
            disabled={isSubmitting || !ownerName.trim()}
          >
            {isSubmitting ? (
              <>
                <span className="cem-spinner" />
                {t('cards.saving')}
              </>
            ) : (
              t('cards.saveChanges')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
