import { useTranslation } from 'react-i18next';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import './ConnectionBanner.css';

export default function ConnectionBanner() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isConnected, isRetrying, retryConnection, bannerDismissed, dismissBanner } =
    useNotification();

  // Only show on authenticated pages and when disconnected
  if (isConnected || bannerDismissed || !user) return null;

  return (
    <div className="connection-banner" role="alert" aria-live="assertive">
      <div className="connection-banner-icon">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      <div className="connection-banner-text">
        <div className="connection-banner-title">
          {t('notifications.connectionLost')}
        </div>
        <div className="connection-banner-message">
          {t('notifications.connectionLostMessage')}
        </div>
      </div>

      <button
        className="connection-banner-retry"
        onClick={retryConnection}
        disabled={isRetrying}
        type="button"
        aria-busy={isRetrying}
      >
        {isRetrying && <span className="connection-banner-spinner" />}
        {isRetrying
          ? t('notifications.retrying')
          : t('notifications.retryConnection')}
      </button>

      <button
        className="connection-banner-close"
        onClick={dismissBanner}
        type="button"
        aria-label={t('common.close')}
      >
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}
