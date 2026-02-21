import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import LanguageSelector from '../Header/LanguageSelector';
import './Sidebar.css';

interface SidebarProps {
  onLogout: () => void;
}

const IconCollections = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);


export default function Sidebar({ onLogout }: SidebarProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const avatarLetter = user?.email ? user.email[0].toUpperCase() : '?';
  const userName = user?.email?.split('@')[0] || 'User';

  const navItems = [
    { key: 'collections', icon: IconCollections, label: t('sidebar.collections'), path: '/collections' },
  ];

  const isActive = (path: string | null) => {
    if (!path) return false;
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">&#10022;</div>
          <div className="sidebar-logo-text">
            <span className="sidebar-brand">{t('sidebar.brand')}</span>
            <span className="sidebar-subtitle">{t('sidebar.portfolioTracker')}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`sidebar-nav-item${isActive(item.path) ? ' sidebar-nav-item--active' : ''}${!item.path ? ' sidebar-nav-item--disabled' : ''}`}
              onClick={() => item.path && navigate(item.path)}
              type="button"
            >
              <item.icon />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <div className="sidebar-lang">
          <LanguageSelector />
        </div>

        <div className="sidebar-user" onClick={onLogout} title={t('common.logout')}>
          <div className="sidebar-avatar">{avatarLetter}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{userName}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
