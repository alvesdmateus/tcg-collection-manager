import { Collection } from '../../types/collection';
import './CollectionCard.css';

interface CollectionCardProps {
  collection: Collection;
  onEdit: (collection: Collection) => void;
  onDelete: (collection: Collection) => void;
}

const getTcgTypeName = (type: string): string => {
  switch (type) {
    case 'magic':
      return 'Magic: The Gathering';
    case 'pokemon':
      return 'Pokémon';
    case 'yugioh':
      return 'Yu-Gi-Oh!';
    default:
      return type;
  }
};

const getTcgTypeEmoji = (type: string): string => {
  switch (type) {
    case 'magic':
      return '🎴';
    case 'pokemon':
      return '⚡';
    case 'yugioh':
      return '🃏';
    default:
      return '📇';
  }
};

export default function CollectionCard({ collection, onEdit, onDelete }: CollectionCardProps) {
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${collection.name}"? This will also delete all cards in this collection.`)) {
      onDelete(collection);
    }
  };

  return (
    <div className="collection-card">
      <div className="collection-header">
        <div className="collection-icon">
          {getTcgTypeEmoji(collection.tcg_type)}
        </div>
        <div className="collection-info">
          <h3>{collection.name}</h3>
          <p className="collection-type">{getTcgTypeName(collection.tcg_type)}</p>
        </div>
      </div>

      <div className="collection-stats">
        <div className="stat">
          <span className="stat-label">Cards</span>
          <span className="stat-value">{collection.card_count || 0}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Created</span>
          <span className="stat-value">
            {new Date(collection.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="collection-actions">
        <button
          className="btn-edit"
          onClick={() => onEdit(collection)}
          title="Edit collection"
        >
          ✏️ Edit
        </button>
        <button
          className="btn-delete"
          onClick={handleDelete}
          title="Delete collection"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}
