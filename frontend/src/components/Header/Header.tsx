import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSelector from './LanguageSelector';
import './Header.css';

interface HeaderProps {
  onLogout?: () => void;
  showUserInfo?: boolean;
}

export default function Header({ onLogout, showUserInfo = true }: HeaderProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <header className="app-header">
      <div className="header-content">
        <h1 className="app-title">{t('common.appName')}</h1>

        <div className="header-actions">
          <LanguageSelector />

          {showUserInfo && user && (
            <>
              <span className="user-email">{t('common.welcome', { email: user.email })}</span>
              {onLogout && (
                <button onClick={onLogout} className="btn-secondary">
                  {t('common.logout')}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
