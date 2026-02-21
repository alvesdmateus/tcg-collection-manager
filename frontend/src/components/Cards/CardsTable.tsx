import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CardWithDetails, UpdateCardRequest } from '../../types/card';
import CardEditModal from './CardEditModal';
import './CardsTable.css';

interface CardsTableProps {
  cards: CardWithDetails[];
  onUpdate: (cardId: string, updates: UpdateCardRequest) => Promise<void>;
  onDelete: (cardId: string) => Promise<void>;
}

type SortField = 'name' | 'set' | 'quantity' | 'owner' | 'price';
type SortDirection = 'asc' | 'desc';

const PAGE_SIZE = 25;

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

function getPrinting(card: CardWithDetails): 'foil' | 'normal' {
  return card.is_foil ? 'foil' : 'normal';
}

const MANA_COLOR_MAP: Record<string, string> = {
  W: '/images/mana/white_symbol.png',
  U: '/images/mana/blue_symbol.png',
  B: '/images/mana/black_symbol.png',
  R: '/images/mana/red_symbol.png',
  G: '/images/mana/green_symbol.png',
};

function renderManaCost(manaCost: string) {
  const symbols = manaCost.match(/\{[^}]+\}/g);
  if (!symbols) return null;

  return (
    <div className="ct-mana-row">
      {symbols.map((sym, i) => {
        const value = sym.slice(1, -1);

        // Single color: W, U, B, R, G
        const img = MANA_COLOR_MAP[value];
        if (img) {
          return <img key={i} src={img} alt={value} className="ct-mana-pip" />;
        }

        // Hybrid mana: W/U, B/R, etc.
        if (value.includes('/')) {
          const parts = value.split('/');
          const leftImg = MANA_COLOR_MAP[parts[0]];
          const rightImg = MANA_COLOR_MAP[parts[1]];

          // Both halves are colors — render split circle
          if (leftImg && rightImg) {
            return (
              <span key={i} className="ct-mana-hybrid" title={value}>
                <img src={leftImg} alt={parts[0]} className="ct-mana-hybrid-left" />
                <img src={rightImg} alt={parts[1]} className="ct-mana-hybrid-right" />
              </span>
            );
          }

          // Phyrexian mana (e.g. W/P) — color pip with Phyrexian overlay
          if (leftImg) {
            return (
              <span key={i} className="ct-mana-phyrexian" title={value}>
                <img src={leftImg} alt={value} className="ct-mana-pip" />
              </span>
            );
          }
        }

        // Generic / numeric / X
        return <span key={i} className="ct-mana-generic">{value}</span>;
      })}
    </div>
  );
}

function getStatus(card: CardWithDetails): 'inDeck' | 'borrowed' | 'storage' {
  if (card.is_borrowed) return 'borrowed';
  if (card.current_deck) return 'inDeck';
  return 'storage';
}

export default function CardsTable({ cards, onUpdate, onDelete }: CardsTableProps) {
  const { t } = useTranslation();
  const [editingCard, setEditingCard] = useState<CardWithDetails | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when cards list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [cards]);

  const handleEdit = (card: CardWithDetails) => {
    setEditingCard(card);
  };

  const handleDelete = (card: CardWithDetails) => {
    if (confirm(`Are you sure you want to delete "${card.scryfall_data?.name || 'this card'}"?`)) {
      onDelete(card.id);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCards = useMemo(() => {
    return [...cards].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = a.scryfall_data?.name ?? '';
          bValue = b.scryfall_data?.name ?? '';
          break;
        case 'set':
          aValue = a.set_name ?? a.scryfall_data?.set_name ?? '';
          bValue = b.set_name ?? b.scryfall_data?.set_name ?? '';
          break;
        case 'quantity':
          aValue = a.quantity ?? 0;
          bValue = b.quantity ?? 0;
          break;
        case 'owner':
          aValue = a.owner_name ?? '';
          bValue = b.owner_name ?? '';
          break;
        case 'price':
          aValue = parseFloat(a.scryfall_data?.prices?.usd ?? a.scryfall_data?.prices?.usd_foil ?? '0');
          bValue = parseFloat(b.scryfall_data?.prices?.usd ?? b.scryfall_data?.prices?.usd_foil ?? '0');
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue as string)
          : (bValue as string).localeCompare(aValue);
      }
      return sortDirection === 'asc' ? aValue - (bValue as number) : (bValue as number) - aValue;
    });
  }, [cards, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedCards.length / PAGE_SIZE);
  const pageFrom = (currentPage - 1) * PAGE_SIZE + 1;
  const pageTo = Math.min(currentPage * PAGE_SIZE, sortedCards.length);
  const pageCards = sortedCards.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hoveredCard = sortedCards.find(c => c.id === hoveredCardId);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="ct-sort-icon">↕</span>;
    return <span className="ct-sort-icon active">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  const pageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <>
      <div className="cards-table-container">
        <table className="cards-table">
          <thead>
            <tr>
              <th className="ct-col-name ct-sortable" onClick={() => handleSort('name')}>
                {t('cards.cardName')} <SortIcon field="name" />
              </th>
              <th className="ct-col-set ct-sortable" onClick={() => handleSort('set')}>
                {t('cards.setEdition')} <SortIcon field="set" />
              </th>
              <th className="ct-col-printing">
                {t('cards.printing')}
              </th>
              <th className="ct-col-qty ct-sortable" onClick={() => handleSort('quantity')}>
                {t('cards.quantity')} <SortIcon field="quantity" />
              </th>
              <th className="ct-col-owner ct-sortable" onClick={() => handleSort('owner')}>
                {t('cards.ownerDeck')} <SortIcon field="owner" />
              </th>
              <th className="ct-col-status">
                {t('cards.status')}
              </th>
              <th className="ct-col-price ct-sortable" onClick={() => handleSort('price')}>
                {t('cards.marketPrice')} <SortIcon field="price" />
              </th>
              <th className="ct-col-actions">
                {t('cards.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {pageCards.map((card) => {
              const printing = getPrinting(card);
              const status = getStatus(card);
              const price = card.scryfall_data?.prices?.usd ?? card.scryfall_data?.prices?.usd_foil;

              return (
                <tr
                  key={card.id}
                  onMouseEnter={() => setHoveredCardId(card.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                >
                  {/* CARD NAME */}
                  <td className="ct-col-name">
                    <div className="ct-name-primary">{card.scryfall_data?.name ?? 'Unknown Card'}</div>
                    {card.scryfall_data?.mana_cost && renderManaCost(card.scryfall_data.mana_cost)}
                  </td>

                  {/* SET / EDITION */}
                  <td className="ct-col-set">
                    <div className="ct-set-name">{card.set_name ?? card.scryfall_data?.set_name ?? '-'}</div>
                    {(card.set_code ?? card.scryfall_data?.set) && (
                      <div className="ct-set-code">
                        {(card.set_code ?? card.scryfall_data?.set)?.toUpperCase()}
                      </div>
                    )}
                  </td>

                  {/* PRINTING */}
                  <td className="ct-col-printing">
                    {printing === 'foil' ? (
                      <button
                        className="ct-badge-foil ct-badge-toggle"
                        onClick={() => onUpdate(card.id, { is_foil: false })}
                        type="button"
                      >
                        {t('cards.foil')}
                      </button>
                    ) : (
                      <button
                        className="ct-badge-normal ct-badge-toggle"
                        onClick={() => onUpdate(card.id, { is_foil: true })}
                        type="button"
                      >
                        {t('cards.nonFoil')}
                      </button>
                    )}
                  </td>

                  {/* QTY */}
                  <td className="ct-col-qty">
                    <span className="ct-qty-badge">{card.quantity}</span>
                  </td>

                  {/* OWNER / DECK */}
                  <td className="ct-col-owner">
                    <div className="ct-owner-primary">{card.owner_name || '-'}</div>
                    {card.current_deck && (
                      <div className="ct-owner-sub">{card.current_deck}</div>
                    )}
                  </td>

                  {/* STATUS */}
                  <td className="ct-col-status">
                    {status === 'inDeck' && (
                      <span className="ct-status-deck">{t('cards.inDeck')}</span>
                    )}
                    {status === 'borrowed' && (
                      <span className="ct-status-borrowed">{t('cards.borrowed')}</span>
                    )}
                    {status === 'storage' && (
                      <span className="ct-status-storage">{t('cards.storage')}</span>
                    )}
                  </td>

                  {/* MARKET PRICE */}
                  <td className="ct-col-price">
                    {price ? (
                      <span className="ct-price">${price}</span>
                    ) : '-'}
                  </td>

                  {/* ACTIONS */}
                  <td className="ct-col-actions">
                    <div className="ct-actions">
                      <button
                        onClick={() => handleEdit(card)}
                        className="ct-btn-edit"
                        title={t('cards.editCard')}
                        type="button"
                      >
                        <IconEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(card)}
                        className="ct-btn-delete"
                        title={t('cards.deleteCard')}
                        type="button"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {cards.length === 0 && (
          <div className="ct-empty">
            <p>{t('cards.noCards')}</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="ct-pagination">
            <span className="ct-pagination-info">
              {t('cards.showingEntries', { from: pageFrom, to: pageTo, total: sortedCards.length })}
            </span>
            <div className="ct-page-controls">
              <button
                className="ct-page-btn"
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={currentPage === 1}
                type="button"
              >
                ‹
              </button>
              {pageNumbers().map(n => (
                <button
                  key={n}
                  className={`ct-page-btn${n === currentPage ? ' active' : ''}`}
                  onClick={() => setCurrentPage(n)}
                  type="button"
                >
                  {n}
                </button>
              ))}
              <button
                className="ct-page-btn"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage === totalPages}
                type="button"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hover Preview */}
      {hoveredCard && hoveredCard.scryfall_data?.image_uris?.normal && (
        <div className="card-hover-preview">
          <img
            src={hoveredCard.scryfall_data.image_uris.normal}
            alt={hoveredCard.scryfall_data.name}
          />
        </div>
      )}

      {editingCard && (
        <CardEditModal
          card={editingCard}
          isOpen={!!editingCard}
          onClose={() => setEditingCard(null)}
          onUpdate={async (updates) => {
            await onUpdate(editingCard.id, updates);
            setEditingCard(null);
          }}
        />
      )}
    </>
  );
}
