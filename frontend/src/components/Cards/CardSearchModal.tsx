import { useState, useEffect, useCallback, FormEvent, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { cardsApi } from '../../services/cardsApi';
import { ScryfallCard, AddCardRequest } from '../../types/card';
import './CardSearchModal.css';

interface CardSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCard: (card: AddCardRequest) => Promise<void>;
}

// ─── Inline SVG Icons ────────────────────────────────────────────────

function IconCard() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 4.75A2.75 2.75 0 014.75 2h10.5A2.75 2.75 0 0118 4.75v10.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25V4.75zm2.75-1.25c-.69 0-1.25.56-1.25 1.25v10.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25V4.75c0-.69-.56-1.25-1.25-1.25H4.75z" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
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

function IconArrowRight() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638l-3.96-4.158a.75.75 0 011.08-1.04l5.25 5.5a.75.75 0 010 1.04l-5.25 5.5a.75.75 0 11-1.08-1.04l3.96-4.158H3.75A.75.75 0 013 10z" clipRule="evenodd" />
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────

export default function CardSearchModal({
  isOpen,
  onClose,
  onAddCard,
}: CardSearchModalProps) {
  const { t } = useTranslation();

  // Step management
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ScryfallCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);

  // Printing state
  const [printings, setPrintings] = useState<ScryfallCard[]>([]);
  const [selectedPrinting, setSelectedPrinting] = useState<ScryfallCard | null>(null);

  // Form state
  const [ownerName, setOwnerName] = useState('');
  const [currentDeck, setCurrentDeck] = useState('');
  const [isBorrowed, setIsBorrowed] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Loading & error state
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPrintings, setIsLoadingPrintings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchError, setSearchError] = useState('');

  // Reset everything when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedCard(null);
      setPrintings([]);
      setSelectedPrinting(null);
      setOwnerName('');
      setCurrentDeck('');
      setIsBorrowed(false);
      setQuantity(1);
      setError('');
      setSearchError('');
      setIsSearching(false);
      setIsLoadingPrintings(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // ─── Handlers ────────────────────────────────────────────────────

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      setSearchError('');
      const results = await cardsApi.searchCards(searchQuery);
      setSearchResults(results.data);
      setSelectedCard(null);

      if (results.data.length === 0) {
        setSearchError(t('cards.noResults'));
      }
    } catch (err: any) {
      setSearchError(err.message || 'Failed to search cards');
    } finally {
      setIsSearching(false);
    }
  };

  const handleNext = useCallback(async () => {
    if (currentStep === 1 && selectedCard) {
      try {
        setIsLoadingPrintings(true);
        setSearchError('');
        const results = await cardsApi.searchCards(`!"${selectedCard.name}" unique:prints`);
        setPrintings(results.data);

        if (results.data.length === 1) {
          setSelectedPrinting(results.data[0]);
        } else {
          const match = results.data.find((p) => p.id === selectedCard.id);
          setSelectedPrinting(match || null);
        }

        setCurrentStep(2);
      } catch (err: any) {
        setSearchError(err.message || 'Failed to load printings');
      } finally {
        setIsLoadingPrintings(false);
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  }, [currentStep, selectedCard]);

  const handleBack = useCallback(() => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
  }, [currentStep]);

  const handleSubmit = async () => {
    const card = selectedPrinting ?? selectedCard;
    if (!card || !ownerName.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      await onAddCard({
        scryfall_id: card.id,
        owner_name: ownerName.trim(),
        current_deck: currentDeck.trim() || undefined,
        is_borrowed: isBorrowed,
        quantity: Number(quantity),
        set_code: card.set,
        set_name: card.set_name,
      });
    } catch (err: any) {
      setError(err.message || t('cards.failedToAdd'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResultKeyDown = (e: KeyboardEvent, card: ScryfallCard) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedCard(card);
    }
  };

  // ─── Derived state ───────────────────────────────────────────────

  const finalCard = selectedPrinting ?? selectedCard;

  const canGoNext =
    currentStep === 1
      ? !!selectedCard && !isLoadingPrintings
      : currentStep === 2
        ? !!ownerName.trim()
        : false;

  const capitalizeFirst = (s: string) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  // ─── Render helpers ──────────────────────────────────────────────

  function renderStepper() {
    const steps = [
      { num: 1, label: t('cards.stepSelectCard') },
      { num: 2, label: t('cards.stepDetails') },
      { num: 3, label: t('cards.stepConfirm') },
    ];

    return (
      <div className="csm-stepper">
        {steps.map((step, i) => {
          const isCompleted = step.num < currentStep;
          const isActive = step.num === currentStep;
          const circleClass = isCompleted
            ? 'csm-step-circle csm-step-circle--completed'
            : isActive
              ? 'csm-step-circle csm-step-circle--active'
              : 'csm-step-circle csm-step-circle--inactive';
          const labelClass = isCompleted
            ? 'csm-step-label csm-step-label--completed'
            : isActive
              ? 'csm-step-label csm-step-label--active'
              : 'csm-step-label csm-step-label--inactive';

          return (
            <div key={step.num} style={{ display: 'contents' }}>
              <div className="csm-step">
                <div className={circleClass}>
                  {isCompleted ? <IconCheck /> : step.num}
                </div>
                <span className={labelClass}>{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`csm-step-line${
                    step.num < currentStep ? ' csm-step-line--completed' : ''
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function renderStep1() {
    return (
      <div>
        <form onSubmit={handleSearch}>
          <div className="csm-search-wrap">
            <span className="csm-search-icon">
              <IconSearch />
            </span>
            <input
              type="text"
              className="csm-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('cards.searchPlaceholderModal')}
              disabled={isSearching}
              autoFocus
            />
          </div>
        </form>

        {searchError && <div className="csm-error">{searchError}</div>}

        {(searchResults.length > 0 || isSearching) && (
          <>
            <div className="csm-results-label">
              {t('cards.searchResultsLabel')}
            </div>
            <div className="csm-results-list" role="listbox">
              {searchResults.map((card) => {
                const isSelected = selectedCard?.id === card.id;
                return (
                  <div
                    key={card.id}
                    className={`csm-result-item${isSelected ? ' csm-result-item--selected' : ''}`}
                    onClick={() => setSelectedCard(card)}
                    onKeyDown={(e) => handleResultKeyDown(e, card)}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                  >
                    {card.image_uris?.small ? (
                      <img
                        src={card.image_uris.small}
                        alt=""
                        className="csm-result-thumb"
                      />
                    ) : (
                      <div className="csm-result-thumb-placeholder">
                        <IconCard />
                      </div>
                    )}
                    <div className="csm-result-info">
                      <div className="csm-result-name">{card.name}</div>
                      <div className="csm-result-meta">
                        {card.set_name} &middot; {capitalizeFirst(card.rarity)}
                      </div>
                    </div>
                    <div className="csm-result-check">
                      <IconCheck />
                    </div>
                  </div>
                );
              })}

              {isSearching && (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={`skel-${i}`} className="csm-skeleton-item">
                      <div className="csm-skeleton-thumb" />
                      <div className="csm-skeleton-lines">
                        <div className="csm-skeleton-line csm-skeleton-line--long" />
                        <div className="csm-skeleton-line csm-skeleton-line--short" />
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  function renderStep2() {
    const card = selectedPrinting ?? selectedCard;
    if (!card) return null;

    return (
      <div>
        <div className="csm-card-preview">
          {card.image_uris?.normal && (
            <img
              src={card.image_uris.small || card.image_uris.normal}
              alt={card.name}
              className="csm-preview-img"
            />
          )}
          <div className="csm-preview-info">
            <div className="csm-preview-name">{card.name}</div>
            <div className="csm-preview-set">
              {card.set_name} ({card.set.toUpperCase()})
            </div>
            {card.type_line && (
              <div className="csm-preview-type">{card.type_line}</div>
            )}
            {card.prices?.usd && (
              <div className="csm-preview-price">${card.prices.usd}</div>
            )}
          </div>
        </div>

        {printings.length > 1 && (
          <div className="csm-printing-section">
            <div className="csm-form-group">
              <label className="csm-form-label">
                {t('cards.selectPrinting')}
              </label>
              <select
                className="csm-form-select"
                value={selectedPrinting?.id || ''}
                onChange={(e) => {
                  const p = printings.find((pr) => pr.id === e.target.value);
                  if (p) setSelectedPrinting(p);
                }}
              >
                {printings.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.set_name} ({p.set.toUpperCase()})
                    {p.prices?.usd ? ` — $${p.prices.usd}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="csm-form">
          <div className="csm-form-group">
            <label className="csm-form-label" htmlFor="csm-owner">
              {t('cards.ownerNameLabel')} *
            </label>
            <input
              id="csm-owner"
              type="text"
              className="csm-form-input"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder={t('cards.ownerNamePlaceholder')}
              required
              maxLength={255}
              disabled={isSubmitting}
            />
          </div>

          <div className="csm-form-group">
            <label className="csm-form-label" htmlFor="csm-qty">
              {t('cards.quantityLabel')} *
            </label>
            <input
              id="csm-qty"
              type="number"
              className="csm-form-input"
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value) || 1))
              }
              required
              min="1"
              disabled={isSubmitting}
            />
          </div>

          <div className="csm-form-group">
            <label className="csm-form-label" htmlFor="csm-deck">
              {t('cards.currentDeckLabel')}
            </label>
            <input
              id="csm-deck"
              type="text"
              className="csm-form-input"
              value={currentDeck}
              onChange={(e) => setCurrentDeck(e.target.value)}
              placeholder={t('cards.currentDeckPlaceholder')}
              maxLength={255}
              disabled={isSubmitting}
            />
          </div>

          <label className="csm-checkbox-group">
            <input
              type="checkbox"
              checked={isBorrowed}
              onChange={(e) => setIsBorrowed(e.target.checked)}
              disabled={isSubmitting}
            />
            {t('cards.isBorrowedLabel')}
          </label>
        </div>
      </div>
    );
  }

  function renderStep3() {
    if (!finalCard) return null;

    return (
      <div>
        <div className="csm-summary">
          <div className="csm-summary-header">
            {finalCard.image_uris?.small && (
              <img
                src={finalCard.image_uris.small}
                alt={finalCard.name}
                className="csm-summary-img"
              />
            )}
            <div className="csm-summary-card-info">
              <div className="csm-summary-card-name">{finalCard.name}</div>
              <div className="csm-summary-card-set">
                {finalCard.set_name} ({finalCard.set.toUpperCase()})
              </div>
              {finalCard.prices?.usd && (
                <div className="csm-summary-card-price">
                  ${finalCard.prices.usd}
                </div>
              )}
            </div>
          </div>

          <div className="csm-summary-rows">
            <div className="csm-summary-row">
              <span className="csm-summary-row-label">
                {t('cards.confirmOwner')}
              </span>
              <span className="csm-summary-row-value">{ownerName}</span>
            </div>
            <div className="csm-summary-row">
              <span className="csm-summary-row-label">
                {t('cards.confirmQuantity')}
              </span>
              <span className="csm-summary-row-value">{quantity}</span>
            </div>
            <div className="csm-summary-row">
              <span className="csm-summary-row-label">
                {t('cards.confirmDeck')}
              </span>
              <span className="csm-summary-row-value">
                {currentDeck || t('cards.none')}
              </span>
            </div>
            <div className="csm-summary-row">
              <span className="csm-summary-row-label">
                {t('cards.confirmBorrowed')}
              </span>
              <span className="csm-summary-row-value">
                {isBorrowed ? t('cards.yes') : t('cards.no')}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderFooter() {
    const statusText =
      currentStep === 1
        ? selectedCard
          ? t('cards.cardSelected')
          : t('cards.noCardSelected')
        : currentStep === 2
          ? t('cards.stepDetails')
          : t('cards.reviewConfirm');

    return (
      <div className="csm-footer">
        <button
          type="button"
          className="csm-btn-cancel"
          onClick={onClose}
          disabled={isSubmitting}
        >
          {t('common.cancel')}
        </button>

        <span className="csm-footer-status">{statusText}</span>

        <div className="csm-footer-actions">
          {currentStep > 1 && (
            <button
              type="button"
              className="csm-btn-back"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              {t('cards.back')}
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              className="csm-btn-next"
              onClick={handleNext}
              disabled={!canGoNext}
            >
              {isLoadingPrintings ? (
                <>
                  <span className="csm-spinner" />
                  {t('cards.loadingPrintings')}
                </>
              ) : (
                <>
                  {t('cards.next')}
                  <IconArrowRight />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="csm-btn-next"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="csm-spinner" />
                  {t('cards.adding')}
                </>
              ) : (
                t('cards.addCardBtn')
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── Main render ─────────────────────────────────────────────────

  if (!isOpen) return null;

  return (
    <div className="csm-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="csm-modal">
        {/* Header */}
        <div className="csm-header">
          <div className="csm-header-icon">
            <IconCard />
          </div>
          <h2 className="csm-header-title">{t('cards.addNewCard')}</h2>
          <button
            type="button"
            className="csm-close-btn"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <IconClose />
          </button>
        </div>

        {/* Stepper */}
        {renderStepper()}

        {/* Error */}
        {error && (
          <div style={{ padding: '0 1.5rem' }}>
            <div className="csm-error">{error}</div>
          </div>
        )}

        {/* Body */}
        <div className="csm-body">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        {/* Footer */}
        {renderFooter()}
      </div>
    </div>
  );
}
