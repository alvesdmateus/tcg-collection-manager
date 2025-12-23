import { useState } from 'react';
import { CardWithDetails, UpdateCardRequest } from '../../types/card';
import CardEditModal from './CardEditModal';
import './CardsTable.css';

interface CardsTableProps {
  cards: CardWithDetails[];
  onUpdate: (cardId: string, updates: UpdateCardRequest) => Promise<void>;
  onDelete: (cardId: string) => Promise<void>;
}

export default function CardsTable({ cards, onUpdate, onDelete }: CardsTableProps) {
  const [editingCard, setEditingCard] = useState<CardWithDetails | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  const handleEdit = (card: CardWithDetails) => {
    setEditingCard(card);
  };

  const handleDelete = (card: CardWithDetails) => {
    if (confirm(`Are you sure you want to delete "${card.scryfall_data?.name || 'this card'}"?`)) {
      onDelete(card.id);
    }
  };

  const hoveredCard = cards.find(c => c.id === hoveredCardId);

  return (
    <>
      <div className="cards-table-container">
        <table className="cards-table">
          <thead>
            <tr>
              <th className="col-image">Card</th>
              <th className="col-name">Name</th>
              <th className="col-set">Set</th>
              <th className="col-quantity">Qty</th>
              <th className="col-owner">Owner</th>
              <th className="col-deck">Deck</th>
              <th className="col-price">Price</th>
              <th className="col-status">Status</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => (
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
                <td className="col-owner">{card.owner_name}</td>
                <td className="col-deck">{card.current_deck || '-'}</td>
                <td className="col-price">
                  {card.scryfall_data?.prices?.usd ? (
                    <span className="price">${card.scryfall_data.prices.usd}</span>
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
