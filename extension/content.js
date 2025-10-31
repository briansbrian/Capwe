// Capwe Content Script - Core Detection Logic
'use strict';

// Configuration
const CONFIG = {
  TOOLTIP_DELAY: 150,
  TOOLTIP_HIDE_DELAY: 100,
  MAX_TOOLTIPS: 3,
  AUTO_HIDE_DELAY: 10000,
  SCAN_THROTTLE: 300,
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
let settings = {
  enabled: true,
  detectAds: true,
  detectLinks: true,
  detectForms: true,
  detectHidden: true,
  aiEnabled: false,
  lookOutEnabled: false,
};

// Use shared utilities
const { sanitizeText, sanitizeURL, debounce } = window.CapweUtils || {
  sanitizeText: (text, maxLength = 500) => text?.substring(0, maxLength).replace(/[^\w\s\-.,!?@/:]/g, '').trim() || '',
  sanitizeURL: (url) => {
    try {
      const parsed = new URL(url);
      return `${parsed.origin}${parsed.pathname}`;
    } catch {
      return '[Invalid URL]';
    }
  },
  debounce: (func, wait) => {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },
};

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
      <div>${sanitizeText(network, 50)}</div>
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
        <div style="word-break: break-all;">${sanitizeText(url.hostname + url.pathname, 100)}</div>
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
          <div style="font-weight: 600; margin-bottom: 4px;">${aiAnalysis.icon} AI Analysis:</div>
          <div>${aiAnalysis.message}</div>
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
      <div style="word-break: break-all;">${sanitizeText(action, 100)}</div>
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
    if (settings.detectHidden && isHidden(target)) {
      const tagName = target.tagName.toLowerCase();
      // Only show for tracking pixels, hidden iframes, and hidden forms
      if ((tagName === 'img' && target.width === 1 && target.height === 1) ||
          (tagName === 'iframe') ||
          (tagName === 'form')) {
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
  
  // Add event listeners
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('mouseout', handleMouseOut, true);
  
  // Observe DOM changes
  const observer = new MutationObserver(debounce(() => {
    // Could scan for new elements here if needed
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
      settings = { ...settings, ...message.settings };
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

// Start the extension
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
