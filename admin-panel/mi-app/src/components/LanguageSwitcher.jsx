import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="btn-group btn-group-sm">
      <button className="btn btn-outline-light" onClick={() => changeLanguage('en')} disabled={i18n.language === 'en'}>EN</button>
      <button className="btn btn-outline-light" onClick={() => changeLanguage('es')} disabled={i18n.language === 'es'}>ES</button>
    </div>
  );
};

export default LanguageSwitcher;