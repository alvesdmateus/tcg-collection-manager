import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Collections.css';

export default function Collections() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="collections-container">
      <header className="collections-header">
        <h1>TCG Collection Manager</h1>
        <div className="user-info">
          <span>Welcome, {user?.email}</span>
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <main className="collections-main">
        <div className="empty-state">
          <h2>Your Collections</h2>
          <p>Collections feature coming soon!</p>
          <p className="success-message">
            ✅ You are successfully logged in
          </p>
        </div>
      </main>
    </div>
  );
}
