import { useState, FormEvent, useEffect } from 'react';
import { Collection, CreateCollectionRequest, TcgType } from '../../types/collection';
import './CollectionModal.css';

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCollectionRequest) => Promise<void>;
  collection?: Collection | null;
  title: string;
}

export default function CollectionModal({
  isOpen,
  onClose,
  onSubmit,
  collection,
  title
}: CollectionModalProps) {
  const [name, setName] = useState('');
  const [tcgType, setTcgType] = useState<TcgType>(TcgType.MAGIC);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setTcgType(collection.tcg_type);
    } else {
      setName('');
      setTcgType(TcgType.MAGIC);
    }
    setError('');
  }, [collection, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onSubmit({ name, tcg_type: tcgType });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save collection');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="collection-form">
          <div className="form-group">
            <label htmlFor="name">Collection Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="My MTG Collection"
              disabled={isLoading}
              maxLength={255}
            />
          </div>

          <div className="form-group">
            <label htmlFor="tcgType">TCG Type</label>
            <select
              id="tcgType"
              value={tcgType}
              onChange={(e) => setTcgType(e.target.value as TcgType)}
              disabled={isLoading}
            >
              <option value={TcgType.MAGIC}>Magic: The Gathering</option>
              <option value={TcgType.POKEMON}>Pokémon</option>
              <option value={TcgType.YUGIOH}>Yu-Gi-Oh!</option>
            </select>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
