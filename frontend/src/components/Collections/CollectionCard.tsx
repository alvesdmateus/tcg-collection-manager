import { useTranslation } from 'react-i18next';
import { Collection } from '../../types/collection';
import './CollectionCard.css';

interface CollectionCardProps {
  collection: Collection;
  onEdit: (collection: Collection) => void;
  onDelete: (collection: Collection) => void;
  onView: (collection: Collection) => void;
}

const getTcgBadge = (type: string): string => {
  switch (type) {
    case 'magic': return 'MTG';
    case 'pokemon': return 'PKM';
    case 'yugioh': return 'YGO';
    default: return 'TCG';
  }
};

const getTcgGradient = (type: string): string => {
  switch (type) {
    case 'magic':
      return 'linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #0f3460 100%)';
    case 'pokemon':
      return 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #e2703a 100%)';
    case 'yugioh':
      return 'linear-gradient(135deg, #1a1a2e 0%, #0d1b2a 50%, #1b263b 100%)';
    default:
      return 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
  }
};

const IconView = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconDelete = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export default function CollectionCard({ collection, onEdit, onDelete, onView }: CollectionCardProps) {
  const { t } = useTranslation();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('collections.confirmDelete'))) {
      onDelete(collection);
    }
  };

  return (
    <div className="collection-card" onClick={() => onView(collection)}>
      {/* Cover */}
      <div
        className={`collection-card-cover${collection.cover_card_id ? ' collection-card-cover--has-image' : ''}`}
        style={{ background: getTcgGradient(collection.tcg_type) }}
      >
        {collection.cover_card_id && (
          <img
            src={`https://api.scryfall.com/cards/${collection.cover_card_id}?format=image&version=art_crop`}
            alt=""
            className="collection-card-cover-img"
          />
        )}
        <span className="collection-card-badge">{getTcgBadge(collection.tcg_type)}</span>
      </div>

      {/* Body */}
      <div className="collection-card-body">
        <h3 className="collection-card-name">{collection.name}</h3>
        <div className="collection-card-price-row">
          <span className="collection-card-price">
            ${parseFloat(String(collection.total_value || 0)).toFixed(2)}
          </span>
        </div>
        <span className="collection-card-count">
          {collection.card_count || 0} {t('cards.title')}
        </span>
      </div>

      {/* Actions */}
      <div className="collection-card-actions">
        <button
          className="collection-card-action collection-card-action--view"
          onClick={(e) => { e.stopPropagation(); onView(collection); }}
          title={t('collections.view')}
          type="button"
        >
          <IconView />
          <span>{t('collections.view')}</span>
        </button>
        <button
          className="collection-card-action collection-card-action--edit"
          onClick={(e) => { e.stopPropagation(); onEdit(collection); }}
          title={t('common.edit')}
          type="button"
        >
          <IconEdit />
          <span>{t('common.edit')}</span>
        </button>
        <button
          className="collection-card-action collection-card-action--delete"
          onClick={handleDelete}
          title={t('common.delete')}
          type="button"
        >
          <IconDelete />
          <span>{t('common.delete')}</span>
        </button>
      </div>
    </div>
  );
}
