// Capwe Content Script - Core Detection Logic
'use strict';

console.log('Capwe extension content script loaded');

// Configuration
const CONFIG = {
  TOOLTIP_DELAY: 150,
  TOOLTIP_HIDE_DELAY: 100,
  MAX_TOOLTIPS: 3,
  AUTO_HIDE_DELAY: 10000,
  SCAN_THROTTLE: 300,
};

// Theme definitions
const INDICATOR_THEMES = {
  default: {
    name: "Default",
    light: {
      ad: { bg: '#7f1d1d', text: '#ffffff', border: '#ef4444' },
      linkExternal: { bg: '#78350f', text: '#ffffff', border: '#f59e0b' },
      linkInternal: { bg: '#064e3b', text: '#ffffff', border: '#10b981' },
      form: { bg: '#1e3a8a', text: '#ffffff', border: '#3b82f6' },
      hidden: { bg: '#374151', text: '#ffffff', border: '#9ca3af' }
    },
    dark: {
      ad: { bg: '#ef4444', text: '#ffffff', border: '#ffffff' },
      linkExternal: { bg: '#f59e0b', text: '#ffffff', border: '#ffffff' },
      linkInternal: { bg: '#10b981', text: '#ffffff', border: '#ffffff' },
      form: { bg: '#3b82f6', text: '#ffffff', border: '#ffffff' },
      hidden: { bg: '#9ca3af', text: '#ffffff', border: '#ffffff' }
    }
  },
  
  minimal: {
    name: "Minimal",
    light: {
      ad: { bg: '#ffffff', text: '#dc2626', border: '#dc2626' },
      linkExternal: { bg: '#ffffff', text: '#ea580c', border: '#ea580c' },
      linkInternal: { bg: '#ffffff', text: '#059669', border: '#059669' },
      form: { bg: '#ffffff', text: '#2563eb', border: '#2563eb' },
      hidden: { bg: '#ffffff', text: '#6b7280', border: '#6b7280' }
    },
    dark: {
      ad: { bg: '#1f2937', text: '#fca5a5', border: '#ef4444' },
      linkExternal: { bg: '#1f2937', text: '#fdba74', border: '#f59e0b' },
      linkInternal: { bg: '#1f2937', text: '#6ee7b7', border: '#10b981' },
      form: { bg: '#1f2937', text: '#93c5fd', border: '#3b82f6' },
      hidden: { bg: '#1f2937', text: '#d1d5db', border: '#9ca3af' }
    }
  },
  
  pastel: {
    name: "Pastel",
    light: {
      ad: { bg: '#fecaca', text: '#991b1b', border: '#f87171' },
      linkExternal: { bg: '#fed7aa', text: '#92400e', border: '#fb923c' },
      linkInternal: { bg: '#d1fae5', text: '#065f46', border: '#34d399' },
      form: { bg: '#bfdbfe', text: '#1e3a8a', border: '#60a5fa' },
      hidden: { bg: '#e5e7eb', text: '#374151', border: '#9ca3af' }
    },
    dark: {
      ad: { bg: '#7f1d1d', text: '#fecaca', border: '#f87171' },
      linkExternal: { bg: '#78350f', text: '#fed7aa', border: '#fb923c' },
      linkInternal: { bg: '#064e3b', text: '#d1fae5', border: '#34d399' },
      form: { bg: '#1e3a8a', text: '#bfdbfe', border: '#60a5fa' },
      hidden: { bg: '#374151', text: '#e5e7eb', border: '#9ca3af' }
    }
  },
  
  dark: {
    name: "Dark",
    light: {
      ad: { bg: '#450a0a', text: '#fecaca', border: '#991b1b' },
      linkExternal: { bg: '#431407', text: '#fed7aa', border: '#9a3412' },
      linkInternal: { bg: '#022c22', text: '#d1fae5', border: '#065f46' },
      form: { bg: '#172554', text: '#bfdbfe', border: '#1e40af' },
      hidden: { bg: '#1f2937', text: '#e5e7eb', border: '#4b5563' }
    },
    dark: {
      ad: { bg: '#fca5a5', text: '#450a0a', border: '#ef4444' },
      linkExternal: { bg: '#fdba74', text: '#431407', border: '#f59e0b' },
      linkInternal: { bg: '#6ee7b7', text: '#022c22', border: '#10b981' },
      form: { bg: '#93c5fd', text: '#172554', border: '#3b82f6' },
      hidden: { bg: '#d1d5db', text: '#1f2937', border: '#9ca3af' }
    }
  },
  
  neon: {
    name: "Neon",
    light: {
      ad: { bg: '#18181b', text: '#ff0066', border: '#ff0066' },
      linkExternal: { bg: '#18181b', text: '#ff9500', border: '#ff9500' },
      linkInternal: { bg: '#18181b', text: '#00ff88', border: '#00ff88' },
      form: { bg: '#18181b', text: '#00ccff', border: '#00ccff' },
      hidden: { bg: '#18181b', text: '#888888', border: '#888888' }
    },
    dark: {
      ad: { bg: '#ff0066', text: '#ffffff', border: '#ffffff' },
      linkExternal: { bg: '#ff9500', text: '#ffffff', border: '#ffffff' },
      linkInternal: { bg: '#00ff88', text: '#000000', border: '#ffffff' },
      form: { bg: '#00ccff', text: '#000000', border: '#ffffff' },
      hidden: { bg: '#888888', text: '#ffffff', border: '#ffffff' }
    }
  }
};

// Ad detection patterns
const AD_PATTERNS = {
  classes: /\b(ad|ads|advertisement|sponsored|promo|banner|advert|adspace|google_ad|adsense)\b/i,
  ids: /\b(ad|ads|advertisement|sponsored|promo|banner)\b/i,
  adNetworks: [
    'doubleclick.net',
    'googlesyndication.com',
    'googleadservices.com',
    'adnxs.com',
    'amazon-adsystem.com',
    'media.net',
    'pubmatic.com',
  ],
};

// State
let tooltip = null;
let tooltipTimeout = null;
let autoHideTimeout = null;
let activeIndicators = new Set();
let currentTheme = 'default';
let currentVariant = 'light';
let pageBackgroundCache = null;
let settings = {
  enabled: true,
  detectAds: true,
  detectLinks: true,
  detectForms: true,
  detectHidden: true,
  aiEnabled: false,
  lookOutEnabled: false,
  showIndicators: true,
  themeMode: 'auto', // 'auto', 'light', 'dark', or specific theme name
  themeName: 'default', // Current theme
  customThemes: {}, // User-created themes
  siteThemes: {}, // Per-site theme overrides
};

// Use shared utilities with fallbacks
function sanitizeText(text, maxLength = 500) {
  if (window.CapweUtils?.sanitizeText) {
    return window.CapweUtils.sanitizeText(text, maxLength);
  }
  return text?.substring(0, maxLength).replace(/[^\w\s\-.,!?@/:]/g, '').trim() || '';
}

function sanitizeForHtml(text, maxLength = 500) {
  if (window.CapweUtils?.sanitizeForHtml) {
    return window.CapweUtils.sanitizeForHtml(text, maxLength);
  }
  const sanitized = text?.substring(0, maxLength).replace(/[^\w\s\-.,!?@/:]/g, '').trim() || '';
  const div = document.createElement('div');
  div.textContent = sanitized;
  return div.innerHTML;
}

function sanitizeURL(url) {
  if (window.CapweUtils?.sanitizeURL) {
    return window.CapweUtils.sanitizeURL(url);
  }
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return '[Invalid URL]';
  }
}

function debounce(func, wait) {
  if (window.CapweUtils?.debounce) {
    return window.CapweUtils.debounce(func, wait);
  }
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

// Theme system functions
function analyzePageBackground() {
  // Check cache first (valid for 1 second)
  if (pageBackgroundCache && Date.now() - pageBackgroundCache.timestamp < 1000) {
    return pageBackgroundCache.variant;
  }

  try {
    // Sample 5 points: center, top-left, top-right, bottom-left, bottom-right
    const width = window.innerWidth;
    const height = window.innerHeight;
    const samplePoints = [
      { x: width / 2, y: height / 2 },
      { x: width * 0.1, y: height * 0.1 },
      { x: width * 0.9, y: height * 0.1 },
      { x: width * 0.1, y: height * 0.9 },
      { x: width * 0.9, y: height * 0.9 }
    ];

    let totalLuminance = 0;
    let validSamples = 0;

    samplePoints.forEach(point => {
      const element = document.elementFromPoint(point.x, point.y);
      if (element) {
        const bgColor = window.getComputedStyle(element).backgroundColor;
        const luminance = calculateLuminance(bgColor);
        if (luminance !== null) {
          totalLuminance += luminance;
          validSamples++;
        }
      }
    });

    // Default to light if we couldn't sample
    if (validSamples === 0) {
      const variant = 'light';
      pageBackgroundCache = { variant, timestamp: Date.now() };
      return variant;
    }

    const avgLuminance = totalLuminance / validSamples;
    // Threshold at 0.5: > 0.5 is light background (use light variant), < 0.5 is dark background (use dark variant)
    const variant = avgLuminance > 0.5 ? 'light' : 'dark';
    
    pageBackgroundCache = { variant, timestamp: Date.now() };
    return variant;
  } catch (error) {
    console.error('Capwe: Error analyzing page background:', error);
    return 'light';
  }
}

function calculateLuminance(color) {
  try {
    // Parse rgb/rgba color string
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (!match) return null;

    const [, r, g, b] = match.map(Number);
    
    // Convert to relative luminance (0-1)
    const normalize = (val) => {
      const channel = val / 255;
      return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    };

    return 0.2126 * normalize(r) + 0.7152 * normalize(g) + 0.0722 * normalize(b);
  } catch {
    return null;
  }
}

function getCurrentThemeVariant() {
  if (settings.themeMode === 'auto') {
    return analyzePageBackground();
  } else if (settings.themeMode === 'light' || settings.themeMode === 'dark') {
    return settings.themeMode;
  }
  // Default to auto behavior
  return analyzePageBackground();
}

function getThemeColors(type) {
  const themeName = settings.themeName || 'default';
  let theme = INDICATOR_THEMES[themeName];
  
  // Check custom themes
  if (!theme && settings.customThemes[themeName]) {
    theme = settings.customThemes[themeName];
  }
  
  // Fallback to default
  if (!theme) {
    theme = INDICATOR_THEMES.default;
  }

  const variant = getCurrentThemeVariant();
  const colors = theme[variant]?.[type];
  
  // Fallback to default theme if colors not found
  if (!colors) {
    return INDICATOR_THEMES.default[variant][type];
  }
  
  return colors;
}

// Tooltip management
function createTooltip() {
  if (tooltip) return tooltip;
  
  tooltip = document.createElement('div');
  tooltip.className = 'capwe-tooltip';
  document.body.appendChild(tooltip);
  return tooltip;
}

function showTooltip(element, content, type) {
  if (!element || !content) return;
  
  clearTimeout(tooltipTimeout);
  clearTimeout(autoHideTimeout);
  
  tooltipTimeout = setTimeout(() => {
    try {
      if (!tooltip) {
        tooltip = createTooltip();
      }
      
      tooltip.innerHTML = content;
      tooltip.className = `capwe-tooltip ${type}`;
      
      // Position tooltip
      const rect = element.getBoundingClientRect();
      
      // Check if element is still visible
      if (rect.width === 0 && rect.height === 0) {
        return;
      }
      
      const tooltipRect = tooltip.getBoundingClientRect();
      
      let top = rect.top + window.scrollY - tooltipRect.height - 10;
      let left = rect.left + window.scrollX;
      
      // Adjust if tooltip goes off screen
      if (top < window.scrollY) {
        top = rect.bottom + window.scrollY + 10;
      }
      
      if (left + tooltipRect.width > window.innerWidth + window.scrollX) {
        left = window.innerWidth + window.scrollX - tooltipRect.width - 10;
      }
      
      // Ensure tooltip stays within viewport
      if (left < 10) left = 10;
      if (top < 10) top = 10;
      
      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
      
      // Make visible
      setTimeout(() => {
        if (tooltip) {
          tooltip.classList.add('visible');
        }
      }, 10);
      
      // Auto-hide after delay
      autoHideTimeout = setTimeout(() => {
        hideTooltip();
      }, CONFIG.AUTO_HIDE_DELAY);
    } catch (error) {
      console.error('Error showing tooltip:', error);
    }
  }, CONFIG.TOOLTIP_DELAY);
}

function hideTooltip() {
  clearTimeout(tooltipTimeout);
  clearTimeout(autoHideTimeout);
  
  if (tooltip) {
    tooltip.classList.remove('visible');
  }
}

// Persistent indicator management
function createIndicator(element, type, icon) {
  if (!element || activeIndicators.has(element)) return;
  
  const indicator = document.createElement('div');
  indicator.className = `capwe-indicator capwe-indicator-${type}`;
  indicator.innerHTML = icon;
  indicator.title = getIndicatorTitle(type);
  
  // Apply theme colors dynamically
  applyThemeToIndicator(indicator, type);
  
  // Position indicator relative to element
  positionIndicator(indicator, element);
  
  document.body.appendChild(indicator);
  activeIndicators.add(element);
  
  // Store reference for cleanup
  element._capweIndicator = indicator;
  
  // Add hover handlers to show detailed tooltip
  indicator.addEventListener('mouseenter', (e) => {
    e.stopPropagation();
    showDetailedTooltip(element, type);
  });
  
  indicator.addEventListener('mouseleave', (e) => {
    e.stopPropagation();
    hideTooltip();
  });
  
  // Add click handler as backup
  indicator.addEventListener('click', (e) => {
    e.stopPropagation();
    showDetailedTooltip(element, type);
  });
}

function applyThemeToIndicator(indicator, type) {
  // Map type to theme key
  const themeTypeMap = {
    'ad': 'ad',
    'link-external': 'linkExternal',
    'link-internal': 'linkInternal',
    'form': 'form',
    'hidden-element': 'hidden'
  };
  
  const themeType = themeTypeMap[type] || 'hidden';
  const colors = getThemeColors(themeType);
  
  if (colors) {
    indicator.style.backgroundColor = colors.bg;
    indicator.style.color = colors.text;
    indicator.style.borderColor = colors.border;
  }
}

function positionIndicator(indicator, element) {
  const rect = element.getBoundingClientRect();
  
  // For absolute positioning, use document coordinates
  let top = rect.top + window.scrollY - 8;
  let left = rect.right + window.scrollX - 8;
  
  // Adjust if it goes off screen (right edge)
  if (left + 40 > document.documentElement.scrollWidth) { // Approximate indicator width
    left = rect.left + window.scrollX - 40 + 8;
  }
  
  // Adjust if too close to top
  if (top < window.scrollY) {
    top = rect.bottom + window.scrollY - 8;
  }
  
  indicator.style.top = `${top}px`;
  indicator.style.left = `${left}px`;
}

function getIndicatorTitle(type) {
  switch (type) {
    case 'ad': return 'Advertisement - Hover or click for details';
    case 'link-external': return 'External Link - Hover or click for details';
    case 'link-internal': return 'Internal Link - Hover or click for details';
    case 'form': return 'Form - Hover or click for details';
    case 'hidden-element': return 'Hidden Element - Hover or click for details';
    default: return 'Detected element - Hover or click for details';
  }
}

async function showDetailedTooltip(element, type) {
  let content = '';
  
  try {
    if (type === 'ad') {
      content = getAdInfo(element);
    } else if (type.startsWith('link')) {
      content = analyzeLink(element);
    } else if (type === 'form') {
      content = await analyzeForm(element);
    } else if (type === 'hidden-element') {
      content = analyzeHiddenElement(element);
    }
    
    if (content) {
      showTooltip(element, content, type);
    }
  } catch (error) {
    console.error('Error showing detailed tooltip:', error);
  }
}

function removeIndicator(element) {
  if (element._capweIndicator) {
    element._capweIndicator.remove();
    delete element._capweIndicator;
    activeIndicators.delete(element);
  }
}

function clearAllIndicators() {
  activeIndicators.forEach(element => {
    if (element._capweIndicator) {
      element._capweIndicator.remove();
      delete element._capweIndicator;
    }
  });
  activeIndicators.clear();
}

// Page scanning for persistent indicators
function scanPageForIndicators() {
  if (!settings.enabled || !settings.showIndicators) return;
  
  clearAllIndicators();
  
  // Scan for ads
  if (settings.detectAds) {
    document.querySelectorAll('*').forEach(element => {
      if (isAd(element) && !element._capweIndicator && shouldShowIndicator(element)) {
        createIndicator(element, 'ad', 'AD');
      }
    });
  }
  
  // Scan for links
  if (settings.detectLinks) {
    document.querySelectorAll('a[href]').forEach(link => {
      if (!link._capweIndicator && shouldShowIndicator(link)) {
        const type = link.href.startsWith(window.location.origin) ? 'link-internal' : 'link-external';
        const label = link.href.startsWith(window.location.origin) ? 'LINK' : 'EXT';
        createIndicator(link, type, label);
      }
    });
  }
  
  // Scan for forms
  if (settings.detectForms) {
    document.querySelectorAll('form').forEach(form => {
      if (!form._capweIndicator && shouldShowIndicator(form)) {
        createIndicator(form, 'form', 'FORM');
      }
    });
  }
  
  // Scan for hidden elements
  if (settings.detectHidden) {
    document.querySelectorAll('*').forEach(element => {
      if (!element._capweIndicator) {
        const tagName = element.tagName.toLowerCase();
        const isTrackingPixel = tagName === 'img' && element.width === 1 && element.height === 1;
        const isActuallyHidden = isHidden(element);
        
        if (isTrackingPixel || (isActuallyHidden && (tagName === 'iframe' || tagName === 'form'))) {
          createIndicator(element, 'hidden-element', 'HIDDEN');
        }
      }
    });
  }
}

// Ad detection
function isAd(element) {
  // Check class names
  if (element.className && AD_PATTERNS.classes.test(element.className)) {
    return true;
  }
  
  // Check id
  if (element.id && AD_PATTERNS.ids.test(element.id)) {
    return true;
  }
  
  // Check data attributes
  for (const attr of element.attributes) {
    if (attr.name.startsWith('data-') && /ad|advertisement|sponsored/i.test(attr.value)) {
      return true;
    }
  }
  
  // Check iframes
  if (element.tagName === 'IFRAME') {
    const src = element.src || element.getAttribute('data-src') || '';
    return AD_PATTERNS.adNetworks.some(network => src.includes(network));
  }
  
  return false;
}

function getAdInfo(element) {
  let network = 'Unknown';
  
  if (element.tagName === 'IFRAME') {
    const src = element.src || element.getAttribute('data-src') || '';
    const matchedNetwork = AD_PATTERNS.adNetworks.find(net => src.includes(net));
    if (matchedNetwork) {
      network = matchedNetwork;
    }
  }
  
  return `
    <div class="capwe-tooltip-header">
      <span class="capwe-tooltip-icon">🛑</span>
      <span>Advertisement</span>
    </div>
    <div class="capwe-tooltip-content">
      <div class="capwe-tooltip-label">Ad Network:</div>
      <div>${sanitizeForHtml(network, 50)}</div>
      <div class="capwe-tooltip-label" style="margin-top: 8px;">Privacy Notice:</div>
      <div>This content may track your browsing activity</div>
    </div>
  `;
}

// Link analysis
function analyzeLink(anchor) {
  const href = anchor.href || '';
  const text = sanitizeText(anchor.textContent, 100);
  
  if (!href) return null;
  
  try {
    const url = new URL(href);
    const isExternal = url.origin !== window.location.origin;
    const isDownload = anchor.hasAttribute('download');
    const isSecure = url.protocol === 'https:';
    
    const icon = isDownload ? '⬇️' : (isExternal ? '🔗' : '🏠');
    const type = isDownload ? 'Download' : (isExternal ? 'External Link' : 'Internal Link');
    
    return `
      <div class="capwe-tooltip-header">
        <span class="capwe-tooltip-icon">${icon}</span>
        <span>${type}</span>
      </div>
      <div class="capwe-tooltip-content">
        <div class="capwe-tooltip-label">Destination:</div>
        <div style="word-break: break-all;">${sanitizeForHtml(url.hostname + url.pathname, 100)}</div>
        ${!isSecure ? '<div style="margin-top: 8px; color: #fbbf24;">⚠️ Not HTTPS</div>' : ''}
        ${isExternal ? '<div style="margin-top: 4px;">Leaving current site</div>' : ''}
      </div>
    `;
  } catch {
    return null;
  }
}

// Form analysis
async function analyzeForm(form) {
  const action = form.action || window.location.href;
  const method = form.method || 'GET';
  const isSecure = action.startsWith('https://');
  
  const inputs = form.querySelectorAll('input, textarea, select');
  const requiredFields = form.querySelectorAll('[required]').length;
  const totalFields = inputs.length;
  
  // Detect form purpose
  let purpose = 'General Form';
  const formText = form.textContent.toLowerCase();
  
  if (formText.includes('login') || formText.includes('sign in')) {
    purpose = 'Login Form';
  } else if (formText.includes('register') || formText.includes('sign up')) {
    purpose = 'Registration Form';
  } else if (formText.includes('payment') || formText.includes('credit card')) {
    purpose = 'Payment Form';
  } else if (formText.includes('search')) {
    purpose = 'Search Form';
  } else if (formText.includes('contact') || formText.includes('message')) {
    purpose = 'Contact Form';
  }
  
  // Check for sensitive fields
  const hasSensitiveFields = Array.from(inputs).some(input => {
    const type = input.type?.toLowerCase() || '';
    const name = input.name?.toLowerCase() || '';
    const label = getInputLabel(input)?.toLowerCase() || '';
    
    return type === 'password' ||
           /password|credit|card|cvv|ssn|social/i.test(name) ||
           /password|credit|card|cvv|ssn|social/i.test(label);
  });
  
  const securityWarning = hasSensitiveFields && !isSecure;
  
  // Try AI-enhanced analysis if enabled
  let aiInsight = '';
  if (settings.aiEnabled && window.CapweAI && hasSensitiveFields) {
    try {
      const aiAnalysis = await window.CapweAI.analyzeFormSecurity(form);
      if (aiAnalysis && aiAnalysis.message) {
        aiInsight = `<div style="margin-top: 8px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 4px;">
          <div style="font-weight: 600; margin-bottom: 4px;">${sanitizeForHtml(aiAnalysis.icon, 10)} AI Analysis:</div>
          <div>${sanitizeForHtml(aiAnalysis.message, 500)}</div>
        </div>`;
      }
    } catch (error) {
      console.error('AI form analysis error:', error);
    }
  }
  
  return `
    <div class="capwe-tooltip-header">
      <span class="capwe-tooltip-icon">📝</span>
      <span>${purpose}</span>
    </div>
    <div class="capwe-tooltip-content">
      <div class="capwe-tooltip-label">Fields:</div>
      <div>${totalFields} total, ${requiredFields} required</div>
      <div class="capwe-tooltip-label" style="margin-top: 8px;">Destination:</div>
      <div style="word-break: break-all;">${sanitizeForHtml(action, 100)}</div>
      ${securityWarning ? '<div style="margin-top: 8px; color: #ef4444;">🚨 SECURITY RISK: Sensitive data over HTTP</div>' : ''}
      ${isSecure ? '<div style="margin-top: 4px; color: #10b981;">✓ Secure (HTTPS)</div>' : ''}
      ${aiInsight}
    </div>
  `;
}

function getInputLabel(input) {
  // Try to find label element
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return label.textContent.trim();
  }
  
  // Check parent label
  const parentLabel = input.closest('label');
  if (parentLabel) {
    return parentLabel.textContent.trim();
  }
  
  // Check placeholder or name
  return input.placeholder || input.name || input.type || 'Input field';
}

// Hidden element detection
function isHidden(element) {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  
  return (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0' ||
    rect.width === 0 ||
    rect.height === 0 ||
    element.offsetParent === null
  );
}

// Check if element should show indicator (filters hidden dropdowns)
function shouldShowIndicator(element) {
  try {
    // Get computed styles and dimensions
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    // Check 1: CSS visibility properties
    if (style.display === 'none') return false;
    if (style.visibility === 'hidden') return false;
    
    // Check 2: Opacity (hidden dropdown menus)
    const opacity = parseFloat(style.opacity);
    if (isNaN(opacity) || opacity < 0.1) return false;
    
    // Check 3: Element dimensions (collapsed menus, zero-height items)
    if (rect.width < 5 || rect.height < 5) return false;
    
    // Check 4: offsetParent (detached or hidden parent containers)
    if (element.offsetParent === null && style.position !== 'fixed' && style.position !== 'absolute') {
      return false;
    }
    
    // Check 5: Check if element or parent has zero dimensions
    if (rect.top === 0 && rect.bottom === 0 && rect.left === 0 && rect.right === 0) {
      // Element might be rendered but has no layout space
      return false;
    }
    
    return true;
  } catch (error) {
    // If any error occurs during checks, default to showing indicator
    console.error('Error checking element visibility:', error);
    return true;
  }
}

function analyzeHiddenElement(element) {
  const tagName = element.tagName.toLowerCase();
  let purpose = 'Hidden element';
  
  if (tagName === 'img' && element.width === 1 && element.height === 1) {
    purpose = 'Tracking Pixel';
  } else if (tagName === 'iframe') {
    purpose = 'Hidden IFrame';
  } else if (tagName === 'form' || element.querySelector('input')) {
    purpose = 'Hidden Form';
  }
  
  return `
    <div class="capwe-tooltip-header">
      <span class="capwe-tooltip-icon">👁️</span>
      <span>${purpose}</span>
    </div>
    <div class="capwe-tooltip-content">
      <div class="capwe-tooltip-label">Element:</div>
      <div>&lt;${tagName}&gt;</div>
      <div style="margin-top: 8px;">This element is hidden from view but present in the page</div>
      ${purpose === 'Tracking Pixel' ? '<div style="margin-top: 4px; color: #fbbf24;">⚠️ May be tracking your activity</div>' : ''}
    </div>
  `;
}

// Event handlers
async function handleMouseOver(event) {
  if (!settings.enabled) return;
  
  try {
    const target = event.target;
    
    // Skip if tooltip or already processed
    if (!target || target.classList?.contains('capwe-tooltip')) return;
    
    // Check for ads
    if (settings.detectAds && isAd(target)) {
      const content = getAdInfo(target);
      showTooltip(target, content, 'ad');
      return;
    }
    
    // Check for links
    if (settings.detectLinks && target.tagName === 'A' && target.href) {
      const content = analyzeLink(target);
      if (content) {
        const type = target.href.startsWith(window.location.origin) ? 'link-internal' : 'link-external';
        showTooltip(target, content, type);
        return;
      }
    }
    
    // Check for forms
    if (settings.detectForms && target.tagName === 'FORM') {
      const content = await analyzeForm(target);
      showTooltip(target, content, 'form');
      return;
    }
    
    // Check for hidden elements (only for specific cases)
    if (settings.detectHidden) {
      const tagName = target.tagName.toLowerCase();
      const isTrackingPixel = tagName === 'img' && target.width === 1 && target.height === 1;
      const isActuallyHidden = isHidden(target);
      
      if (isTrackingPixel || (isActuallyHidden && (tagName === 'iframe' || tagName === 'form'))) {
        const content = analyzeHiddenElement(target);
        showTooltip(target, content, 'hidden-element');
        return;
      }
    }
  } catch (error) {
    console.error('Error in handleMouseOver:', error);
  }
}

function handleMouseOut(event) {
  clearTimeout(tooltipTimeout);
  setTimeout(hideTooltip, CONFIG.TOOLTIP_HIDE_DELAY);
}

// Initialization
function init() {
  // Load settings from storage
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get(['settings'], (result) => {
      if (result.settings) {
        settings = { ...settings, ...result.settings };
      }
      startObserving();
    });
  } else {
    startObserving();
  }
}

function startObserving() {
  // Initialize AI if enabled
  if (settings.aiEnabled && window.CapweAI) {
    window.CapweAI.initialize().then(() => {
      console.log('Capwe AI initialized');
    }).catch((error) => {
      console.error('Failed to initialize AI:', error);
    });
  }
  
  // Initialize Look Out if enabled
  if (settings.lookOutEnabled && window.CapweLookOut) {
    window.CapweLookOut.initLookOut().then(() => {
      console.log('Capwe Look Out initialized');
    }).catch((error) => {
      console.error('Failed to initialize Look Out:', error);
    });
  }
  
  // Scan page for persistent indicators
  scanPageForIndicators();
  
  // Add event listeners
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('mouseout', handleMouseOut, true);
  
  // Observe DOM changes
  const observer = new MutationObserver(debounce(() => {
    // Rescan for new elements
    scanPageForIndicators();
  }, CONFIG.SCAN_THROTTLE));
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Listen for settings updates
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'updateSettings') {
      const oldShowIndicators = settings.showIndicators;
      const oldTheme = settings.themeName;
      const oldThemeMode = settings.themeMode;
      
      settings = { ...settings, ...message.settings };
      
      // Check if theme changed
      const themeChanged = oldTheme !== settings.themeName || oldThemeMode !== settings.themeMode;
      
      // Update indicators if setting changed
      if (oldShowIndicators !== settings.showIndicators) {
        if (settings.showIndicators) {
          scanPageForIndicators();
        } else {
          clearAllIndicators();
        }
      } else if (settings.showIndicators) {
        if (themeChanged) {
          // Refresh indicators with new theme
          refreshIndicatorThemes();
        } else {
          // Rescan if other settings changed
          scanPageForIndicators();
        }
      }
      
      sendResponse({ success: true });
    }
    
    if (message.type === 'updateTheme') {
      // Handle theme-specific updates
      if (message.themeName) settings.themeName = message.themeName;
      if (message.themeMode) settings.themeMode = message.themeMode;
      if (message.customThemes) settings.customThemes = message.customThemes;
      
      // Clear background cache
      pageBackgroundCache = null;
      
      // Refresh all indicators
      refreshIndicatorThemes();
      
      sendResponse({ success: true });
    }
    
    if (message.type === 'rescanLookOut') {
      if (window.CapweLookOut) {
        window.CapweLookOut.scanForMatches().then(() => {
          sendResponse({ success: true });
        });
      }
    }
  });
}

function refreshIndicatorThemes() {
  // Clear background cache to force re-analysis
  pageBackgroundCache = null;
  
  // Update all existing indicators
  document.querySelectorAll('.capwe-indicator').forEach(indicator => {
    // Find the associated element
    const classes = Array.from(indicator.classList);
    const typeClass = classes.find(c => c.startsWith('capwe-indicator-'));
    
    if (typeClass) {
      const type = typeClass.replace('capwe-indicator-', '');
      applyThemeToIndicator(indicator, type);
    }
  });
}

// Start the extension
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
