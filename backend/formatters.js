// This utility centralizes number and currency formatting to ensure consistency.

/**
 * Formats a numeric value as currency (COP), respecting the current language for locale formatting.
 * @param {number} value - The numeric value to format.
 * @param {object} i18n - The i18next instance, used to detect the current language.
 * @returns {string} The formatted currency string.
 */
export const formatCurrency = (value, i18n) => {
  // Use 'es-CO' for Spanish to get the correct COP formatting, 'en-US' for English.
  const lang = i18n.language.startsWith('es') ? 'es-CO' : 'en-US';
  return new Intl.NumberFormat(lang, {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0, // No decimals for COP
  }).format(value || 0);
};