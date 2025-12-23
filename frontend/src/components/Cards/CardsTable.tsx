import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CardWithDetails, UpdateCardRequest } from '../../types/card';
import CardEditModal from './CardEditModal';
import './CardsTable.css';

interface CardsTableProps {
  cards: CardWithDetails[];
  onUpdate: (cardId: string, updates: UpdateCardRequest) => Promise<void>;
  onDelete: (cardId: string) => Promise<void>;
}

type SortField = 'name' | 'set' | 'quantity' | 'owner' | 'deck' | 'price' | 'total';
type SortDirection = 'asc' | 'desc';

export default function CardsTable({ cards, onUpdate, onDelete }: CardsTableProps) {
  const { t } = useTranslation();
  const [editingCard, setEditingCard] = useState<CardWithDetails | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort cards
  const sortedCards = useMemo(() => {
    const sorted = [...cards].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.scryfall_data?.name || '';
          bValue = b.scryfall_data?.name || '';
          break;
        case 'set':
          aValue = a.set_name || a.scryfall_data?.set_name || '';
          bValue = b.set_name || b.scryfall_data?.set_name || '';
          break;
        case 'quantity':
          aValue = a.quantity || 0;
          bValue = b.quantity || 0;
          break;
        case 'owner':
          aValue = a.owner_name || '';
          bValue = b.owner_name || '';
          break;
        case 'deck':
          aValue = a.current_deck || '';
          bValue = b.current_deck || '';
          break;
        case 'price':
          aValue = parseFloat(a.scryfall_data?.prices?.usd || a.scryfall_data?.prices?.usd_foil || '0');
          bValue = parseFloat(b.scryfall_data?.prices?.usd || b.scryfall_data?.prices?.usd_foil || '0');
          break;
        case 'total':
          aValue = parseFloat(a.scryfall_data?.prices?.usd || a.scryfall_data?.prices?.usd_foil || '0') * (a.quantity || 1);
          bValue = parseFloat(b.scryfall_data?.prices?.usd || b.scryfall_data?.prices?.usd_foil || '0') * (b.quantity || 1);
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    return sorted;
  }, [cards, sortField, sortDirection]);

  const hoveredCard = sortedCards.find(c => c.id === hoveredCardId);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="sort-icon">↕</span>;
    return <span className="sort-icon active">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <>
      <div className="cards-table-container">
        <table className="cards-table">
          <thead>
            <tr>
              <th className="col-image">{t('cards.cardImage') || 'Card'}</th>
              <th className="col-name sortable" onClick={() => handleSort('name')}>
                {t('cards.cardName') || 'Name'} <SortIcon field="name" />
              </th>
              <th className="col-set sortable" onClick={() => handleSort('set')}>
                {t('cards.set') || 'Set'} <SortIcon field="set" />
              </th>
              <th className="col-quantity sortable" onClick={() => handleSort('quantity')}>
                {t('cards.quantity') || 'Qty'} <SortIcon field="quantity" />
              </th>
              <th className="col-owner sortable" onClick={() => handleSort('owner')}>
                {t('cards.ownerName') || 'Owner'} <SortIcon field="owner" />
              </th>
              <th className="col-deck sortable" onClick={() => handleSort('deck')}>
                {t('cards.currentDeck') || 'Deck'} <SortIcon field="deck" />
              </th>
              <th className="col-price sortable" onClick={() => handleSort('price')}>
                {t('cards.unitPrice') || 'Unit Price'} <SortIcon field="price" />
              </th>
              <th className="col-total sortable" onClick={() => handleSort('total')}>
                {t('cards.totalValue') || 'Total Value'} <SortIcon field="total" />
              </th>
              <th className="col-status">{t('cards.status') || 'Status'}</th>
              <th className="col-actions">{t('cards.actions') || 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {sortedCards.map((card) => (
              <tr
                key={card.id}
                onMouseEnter={() => setHoveredCardId(card.id)}
                onMouseLeave={() => setHoveredCardId(null)}
                className={hoveredCardId === card.id ? 'hovered' : ''}
              >
                <td className="col-image">
                  {card.scryfall_data?.image_uris?.small && (
                    <img
                      src={card.scryfall_data.image_uris.small}
                      alt={card.scryfall_data.name}
                      className="card-thumb"
                    />
                  )}
                </td>
                <td className="col-name">
                  <strong>{card.scryfall_data?.name || 'Unknown Card'}</strong>
                  {card.scryfall_data?.mana_cost && (
                    <div className="mana-cost">{card.scryfall_data.mana_cost}</div>
                  )}
                </td>
                <td className="col-set">
                  {card.set_name || card.scryfall_data?.set_name}
                  {(card.set_code || card.scryfall_data?.set) && (
                    <div className="set-code">
                      ({(card.set_code || card.scryfall_data?.set)?.toUpperCase()})
                    </div>
                  )}
                </td>
                <td className="col-quantity">
                  <span className="quantity-badge">{card.quantity}</span>
                </td>
                <td className="col-owner">{card.owner_name || '-'}</td>
                <td className="col-deck">{card.current_deck || '-'}</td>
                <td className="col-price">
                  {(card.scryfall_data?.prices?.usd || card.scryfall_data?.prices?.usd_foil) ? (
                    <span className="price">
                      ${card.scryfall_data.prices.usd || card.scryfall_data.prices.usd_foil}
                      {!card.scryfall_data.prices.usd && card.scryfall_data.prices.usd_foil && ' (F)'}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="col-total">
                  {(card.scryfall_data?.prices?.usd || card.scryfall_data?.prices?.usd_foil) ? (
                    <span className="total-value">
                      ${(parseFloat(card.scryfall_data.prices.usd || card.scryfall_data.prices.usd_foil || '0') * (card.quantity || 1)).toFixed(2)}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="col-status">
                  {card.is_borrowed && (
                    <span className="borrowed-badge">Borrowed</span>
                  )}
                </td>
                <td className="col-actions">
                  <button
                    onClick={() => handleEdit(card)}
                    className="btn-icon btn-edit"
                    title="Edit card"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(card)}
                    className="btn-icon btn-delete"
                    title="Delete card"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {cards.length === 0 && (
          <div className="empty-table">
            <p>No cards in this collection yet.</p>
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
