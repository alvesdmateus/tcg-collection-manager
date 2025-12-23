import { useState } from 'react';
import { CardWithDetails, UpdateCardRequest } from '../../types/card';
import CardEditModal from './CardEditModal';
import './CardList.css';

interface CardListProps {
  cards: CardWithDetails[];
  onUpdate: (cardId: string, updates: UpdateCardRequest) => Promise<void>;
  onDelete: (cardId: string) => Promise<void>;
}

export default function CardList({ cards, onUpdate, onDelete }: CardListProps) {
  const [hoveredCard, setHoveredCard] = useState<CardWithDetails | null>(null);
  const [editingCard, setEditingCard] = useState<CardWithDetails | null>(null);

  const handleEdit = (card: CardWithDetails) => {
    setEditingCard(card);
  };

  const handleDelete = (card: CardWithDetails) => {
    if (confirm(`Are you sure you want to delete "${card.scryfall_data?.name || 'this card'}"?`)) {
      onDelete(card.id);
    }
  };

  return (
    <>
      <div className="cards-grid">
        {cards.map((card) => (
          <div
            key={card.id}
            className="card-item"
            onMouseEnter={() => setHoveredCard(card)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {card.scryfall_data?.image_uris?.normal && (
              <div className="card-image-wrapper">
                <img
                  src={card.scryfall_data.image_uris.small || card.scryfall_data.image_uris.normal}
                  alt={card.scryfall_data.name}
                  className="card-thumbnail"
                />
                {card.is_borrowed && (
                  <span className="borrowed-badge">Borrowed</span>
                )}
              </div>
            )}

            <div className="card-details">
              <h3 className="card-name">
                {card.scryfall_data?.name || 'Unknown Card'}
              </h3>

              <div className="card-meta">
                <p className="card-owner">
                  <strong>Owner:</strong> {card.owner_name}
                </p>

                {card.current_deck && (
                  <p className="card-deck">
                    <strong>Deck:</strong> {card.current_deck}
                  </p>
                )}

                {card.scryfall_data && (
                  <>
                    <p className="card-set">
                      {card.scryfall_data.set_name} ({card.scryfall_data.set.toUpperCase()})
                    </p>

                    {card.scryfall_data.prices?.usd && (
                      <p className="card-price">
                        <strong>Price:</strong> ${card.scryfall_data.prices.usd}
                      </p>
                    )}
                  </>
                )}

                <p className="card-added">
                  Added: {new Date(card.added_at).toLocaleDateString()}
                </p>
              </div>

              <div className="card-actions">
                <button
                  onClick={() => handleEdit(card)}
                  className="btn-secondary btn-small"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(card)}
                  className="btn-danger btn-small"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Hover preview - larger image */}
            {hoveredCard?.id === card.id && card.scryfall_data?.image_uris?.normal && (
              <div className="card-hover-preview">
                <img
                  src={card.scryfall_data.image_uris.normal}
                  alt={card.scryfall_data.name}
                />
              </div>
            )}
          </div>
        ))}
      </div>

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
