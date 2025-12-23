import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../Header/Header';
import './Auth.css';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password);
      navigate('/collections');
    } catch (err: any) {
      setError(err.message || t('auth.registrationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header showUserInfo={false} />
      <div className="auth-container">
        <div className="auth-card">
          <h1>{t('auth.registerTitle')}</h1>
          <p className="auth-subtitle">{t('auth.registerSubtitle')}</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">{t('auth.email')}</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t('auth.emailPlaceholder')}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('auth.password')}</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={t('auth.passwordPlaceholder')}
                minLength={6}
                disabled={isLoading}
              />
              <small>{t('auth.passwordMinLength')}</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder={t('auth.passwordPlaceholder')}
                minLength={6}
                disabled={isLoading}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? t('auth.creatingAccount') : t('auth.register')}
            </button>
          </form>

          <p className="auth-footer">
            {t('auth.hasAccount')} <Link to="/login">{t('auth.loginHere')}</Link>
          </p>
        </div>
      </div>
    </>
  );
}
