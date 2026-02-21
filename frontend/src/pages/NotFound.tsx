import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import './NotFound.css';

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconBell = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconGrid = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const IconStore = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconLayers = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const IconSettings = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

export default function NotFound() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const avatarLetter = user?.email ? user.email[0].toUpperCase() : '?';

  return (
    <div className="nf-page">
      {/* Header */}
      <header className="nf-header">
        <div className="nf-header-brand">
          <div className="nf-header-logo">&#10022;</div>
          <span className="nf-header-title">{t('auth.brandName')}</span>
        </div>

        <div className="nf-header-search">
          <IconSearch />
          <input
            type="text"
            placeholder={t('notFound.searchPlaceholder')}
            readOnly
          />
        </div>

        <div className="nf-header-actions">
          <div className="nf-header-icon">
            <IconBell />
          </div>
          <div className="nf-header-avatar">{avatarLetter}</div>
        </div>
      </header>

      {/* Main content */}
      <main className="nf-content">
        {/* Card illustration */}
        <div className="nf-card-wrapper">
          <div className="nf-card">
            <span className="nf-card-question">?</span>
            <div className="nf-card-lines">
              <div className="nf-card-line nf-card-line--long" />
              <div className="nf-card-line nf-card-line--short" />
            </div>
          </div>
          <span className="nf-badge">{t('notFound.badge')}</span>
        </div>

        <h1 className="nf-title">{t('notFound.title')}</h1>
        <p className="nf-subtitle">{t('notFound.subtitle')}</p>

        {/* Action buttons */}
        <div className="nf-actions">
          <button
            className="nf-btn nf-btn--primary"
            onClick={() => navigate('/collections')}
          >
            <IconDashboard />
            {t('notFound.returnToDashboard')}
          </button>
          <button
            className="nf-btn nf-btn--secondary"
            onClick={() => navigate('/collections')}
          >
            <IconSearch />
            {t('notFound.searchCollection')}
          </button>
        </div>

        {/* Common destinations */}
        <div className="nf-destinations">
          <span className="nf-destinations-label">
            {t('notFound.commonDestinations')}
          </span>
          <div className="nf-destinations-list">
            <button className="nf-dest-link" onClick={() => navigate('/collections')}>
              <IconGrid />
              {t('notFound.inventory')}
            </button>
            <button className="nf-dest-link" disabled>
              <IconStore />
              {t('notFound.marketplace')}
            </button>
            <button className="nf-dest-link" disabled>
              <IconLayers />
              {t('notFound.decks')}
            </button>
            <button className="nf-dest-link" disabled>
              <IconSettings />
              {t('notFound.settings')}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="nf-footer">
        {t('notFound.copyright')}
      </footer>
    </div>
  );
}
