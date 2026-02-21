import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { cardsApi } from '../../services/cardsApi';
import { CardWithDetails } from '../../types/card';
import './DeckImportModal.css';

interface DeckImportModalProps {
  isOpen: boolean;
  collectionId: string;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ParsedEntry {
  name: string;
  quantity: number;
}

interface ImportResult {
  imported: CardWithDetails[];
  failed: { name: string; reason: string }[];
}

function IconImport() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
      <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function parseDeckList(text: string): ParsedEntry[] {
  const entries: ParsedEntry[] = [];
  const lines = text.split('\n');

  for (const raw of lines) {
    const line = raw.trim();

    // Skip blank lines and comments
    if (!line || line.startsWith('//') || line.startsWith('#')) continue;

    // Match patterns: "4 Card Name", "4x Card Name", "4X Card Name"
    const match = line.match(/^(\d+)\s*[xX]?\s+(.+)$/);
    if (match) {
      const quantity = parseInt(match[1], 10);
      const name = match[2].trim();
      if (name && quantity > 0) {
        entries.push({ name, quantity });
      }
    } else {
      // No quantity prefix — default to 1
      entries.push({ name: line, quantity: 1 });
    }
  }

  return entries;
}

export default function DeckImportModal({
  isOpen,
  collectionId,
  onClose,
  onImportComplete,
}: DeckImportModalProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deckText, setDeckText] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const parsedEntries = parseDeckList(deckText);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setDeckText(text);
    };
    reader.readAsText(file);

    // Reset so the same file can be re-uploaded
    e.target.value = '';
  }, []);

  const handleImport = async () => {
    if (parsedEntries.length === 0 || !ownerName.trim()) return;

    try {
      setIsImporting(true);
      const importResult = await cardsApi.importDeckList(
        collectionId,
        parsedEntries,
        ownerName.trim()
      );
      setResult(importResult);
    } catch (err: any) {
      setResult({
        imported: [],
        failed: parsedEntries.map((e) => ({ name: e.name, reason: err.message || 'Import failed' })),
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (result && result.imported.length > 0) {
      onImportComplete();
    }
    setDeckText('');
    setOwnerName('');
    setResult(null);
    setIsImporting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="dim-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="dim-modal">
        {/* Header */}
        <div className="dim-header">
          <div className="dim-header-icon">
            <IconImport />
          </div>
          <h2 className="dim-header-title">{t('cards.importDeck')}</h2>
          <button className="dim-close-btn" onClick={handleClose}>
            <IconClose />
          </button>
        </div>

        {/* Body */}
        <div className="dim-body">
          {isImporting ? (
            <div className="dim-progress">
              <div className="dim-spinner" />
              <p className="dim-progress-text">{t('cards.importing')}</p>
            </div>
          ) : result ? (
            /* Results view */
            <div className="dim-results">
              <div className="dim-results-summary">
                <span className="dim-results-badge dim-results-badge--success">
                  {t('cards.importedCount', { count: result.imported.length })}
                </span>
                {result.failed.length > 0 && (
                  <span className="dim-results-badge dim-results-badge--error">
                    {t('cards.failedCount', { count: result.failed.length })}
                  </span>
                )}
              </div>

              {result.failed.length > 0 && (
                <>
                  <p className="dim-label">{t('cards.failedCards')}</p>
                  <div className="dim-failed-list">
                    {result.failed.map((f, i) => (
                      <div key={i} className="dim-failed-item">
                        <span className="dim-failed-name">{f.name}</span>
                        <span className="dim-failed-reason">{f.reason}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Input view */
            <>
              <p className="dim-description">{t('cards.importDeckDescription')}</p>

              <textarea
                className="dim-textarea"
                value={deckText}
                onChange={(e) => setDeckText(e.target.value)}
                placeholder={`4 Lightning Bolt\n2 Counterspell\n1 Island\n\n2 Abrade\n1 Pyroclasm`}
              />

              <div className="dim-file-row">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.dec,.dek"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <button
                  className="dim-file-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t('cards.uploadFile')}
                </button>
              </div>

              <div className="dim-field">
                <label className="dim-label">{t('cards.ownerForImport')}</label>
                <input
                  className="dim-input"
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder={t('cards.ownerNamePlaceholder')}
                />
              </div>

              {/* Parsed preview */}
              <div className="dim-preview">
                <div className="dim-preview-header">
                  <span className="dim-preview-label">{t('cards.parsedEntries')}</span>
                  <span className="dim-preview-count">
                    {parsedEntries.length} {parsedEntries.length === 1 ? 'card' : 'cards'}
                  </span>
                </div>
                {parsedEntries.length > 0 ? (
                  <ul className="dim-preview-list">
                    {parsedEntries.map((entry, i) => (
                      <li key={i} className="dim-preview-item">
                        <span className="dim-preview-qty">{entry.quantity}x</span>
                        <span>{entry.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="dim-preview-empty">
                    {t('cards.noEntriesParsed')}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="dim-footer">
          {result ? (
            <button className="dim-btn-import" onClick={handleClose}>
              {t('common.close')}
            </button>
          ) : (
            <>
              <button className="dim-btn-cancel" onClick={handleClose}>
                {t('common.cancel')}
              </button>
              <button
                className="dim-btn-import"
                onClick={handleImport}
                disabled={parsedEntries.length === 0 || !ownerName.trim() || isImporting}
              >
                {t('cards.importBtn')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
