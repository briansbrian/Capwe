// Capwe Shared Utilities
'use strict';

// Configuration constants
const UTILS_CONFIG = {
  MAX_TEXT_LENGTH: 500,
  MAX_URL_LENGTH: 200,
  MAX_LABEL_LENGTH: 50,
  ALLOWED_CHARS: /[^\w\s\-.,!?@/:]/g,
};

// Sanitize text for safe display or AI prompts
function sanitizeText(text, maxLength = UTILS_CONFIG.MAX_TEXT_LENGTH) {
  if (!text) return '';
  return text
    .substring(0, maxLength)
    .replace(UTILS_CONFIG.ALLOWED_CHARS, '')
    .trim();
}

// Sanitize URL for safe display
function sanitizeURL(url, maxLength = UTILS_CONFIG.MAX_URL_LENGTH) {
  try {
    const parsed = new URL(url);
    const result = `${parsed.origin}${parsed.pathname}`;
    return result.substring(0, maxLength);
  } catch {
    return '[Invalid URL]';
  }
}

// Generate unique IDs
function generateId(prefix = 'id') {
  // Try crypto.randomUUID first (more secure)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  // Fallback to timestamp + random
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export utilities
window.CapweUtils = {
  sanitizeText,
  sanitizeURL,
  generateId,
  debounce,
  UTILS_CONFIG,
};
