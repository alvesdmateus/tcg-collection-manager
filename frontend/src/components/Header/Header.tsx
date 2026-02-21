import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSelector from './LanguageSelector';
import './Header.css';

interface HeaderProps {
  onLogout?: () => void;
  showUserInfo?: boolean;
  breadcrumb?: string;
}

const IconBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export default function Header({ onLogout, showUserInfo = true, breadcrumb }: HeaderProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const avatarLetter = user?.email ? user.email[0].toUpperCase() : '?';

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-logo">
          <div className="header-logo-icon">✦</div>
          <span className="header-logo-name">{t('auth.brandName')}</span>
        </div>

        <div className="header-right">
          {breadcrumb && (
            <span className="header-breadcrumb">{breadcrumb}</span>
          )}

          <LanguageSelector />

          <button className="header-bell" title="Notifications" type="button">
            <IconBell />
          </button>

          {showUserInfo && user && (
            <div
              className="header-avatar"
              title={`${user.email} — ${t('common.logout')}`}
              onClick={onLogout}
            >
              {avatarLetter}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
