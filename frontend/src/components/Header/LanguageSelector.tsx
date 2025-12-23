import { useTranslation } from 'react-i18next';
import './LanguageSelector.css';

export default function LanguageSelector() {
  const { i18n, t } = useTranslation();

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
  };

  return (
    <div className="language-selector">
      <label htmlFor="language-select" className="language-label">
        {t('language.select')}:
      </label>
      <select
        id="language-select"
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="language-select"
      >
        <option value="en">{t('language.english')}</option>
        <option value="pt-BR">{t('language.portuguese')}</option>
      </select>
    </div>
  );
}
