// Capwe Look Out Feature
// User-defined content monitoring
'use strict';

// Look Out configuration structure
const DEFAULT_LOOK_OUT_CONFIG = {
  enabled: false,
  criteria: [],
};

// Use shared utility for ID generation or fallback
function generateId(prefix = 'id') {
  // Try to use shared utility first
  if (window.CapweUtils?.generateId) {
    return window.CapweUtils.generateId(prefix);
  }
  
  // Fallback implementation
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Current active criteria
let lookOutConfig = DEFAULT_LOOK_OUT_CONFIG;

// Match highlights on current page
let activeMatches = [];

// Get Look Out configuration
async function getLookOutConfig() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.get(['lookOutConfig'], (result) => {
        const config = result.lookOutConfig || DEFAULT_LOOK_OUT_CONFIG;
        lookOutConfig = config;
        resolve(config);
      });
    } else {
      resolve(DEFAULT_LOOK_OUT_CONFIG);
    }
  });
}

// Save Look Out configuration
async function saveLookOutConfig(config) {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ lookOutConfig: config }, () => {
        lookOutConfig = config;
        resolve();
      });
    } else {
      lookOutConfig = config;
      resolve();
    }
  });
}

// Add new criteria
async function addCriteria(criteria) {
  const config = await getLookOutConfig();
  criteria.id = generateId('criteria');
  config.criteria.push(criteria);
  await saveLookOutConfig(config);
  return criteria.id;
}

// Remove criteria
async function removeCriteria(criteriaId) {
  const config = await getLookOutConfig();
  config.criteria = config.criteria.filter(c => c.id !== criteriaId);
  await saveLookOutConfig(config);
}

// Update criteria
async function updateCriteria(criteriaId, updates) {
  const config = await getLookOutConfig();
  const index = config.criteria.findIndex(c => c.id === criteriaId);
  if (index !== -1) {
    config.criteria[index] = { ...config.criteria[index], ...updates };
    await saveLookOutConfig(config);
  }
}

// Find potential matching elements based on type
function findPotentialMatches(type) {
  const selectors = {
    'job': 'article[class*="job" i], .job-listing, [data-job-id], .position, .job-card, .job-result',
    'product': '.product, [class*="product" i], [data-product-id], .item, .listing, .search-result',
    'content': 'article, .post, .content, .article, main, [role="article"]',
  };
  
  const selector = selectors[type] || selectors['content'];
  return Array.from(document.querySelectorAll(selector));
}

// Basic keyword matching (fallback if AI not available)
function basicMatch(element, criteria) {
  const text = element.textContent.toLowerCase();
  
  // Check required keywords
  const hasRequired = criteria.keywords.every(keyword => 
    text.includes(keyword.toLowerCase())
  );
  
  if (!hasRequired) return null;
  
  // Check exclude keywords
  if (criteria.excludeKeywords) {
    const hasExcluded = criteria.excludeKeywords.some(keyword => 
      text.includes(keyword.toLowerCase())
    );
    if (hasExcluded) return null;
  }
  
  // Check price range for products
  if (criteria.type === 'product' && criteria.priceMax) {
    const priceMatch = text.match(/\$[\d,]+(?:\.\d{2})?/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[0].replace(/[$,]/g, ''));
      if (price > criteria.priceMax) return null;
    }
  }
  
  // Check salary range for jobs
  if (criteria.type === 'job' && criteria.salaryMin) {
    const salaryMatch = text.match(/\$[\d,]+[kK]?/);
    if (salaryMatch) {
      let salary = parseFloat(salaryMatch[0].replace(/[$,]/g, ''));
      if (salaryMatch[0].toLowerCase().includes('k')) {
        salary *= 1000;
      }
      if (salary < criteria.salaryMin) return null;
    }
  }
  
  return {
    relevance: 75,
    method: 'basic',
    matched: criteria.keywords,
  };
}

// AI-powered matching
async function aiMatch(element, criteria) {
  if (!window.CapweAI || !window.CapweAI.isAvailable()) {
    return null;
  }
  
  const session = await window.CapweAI.getSession?.();
  if (!session) return null;
  
  try {
    const elementText = element.textContent.substring(0, 500);
    
    // Build context-aware prompt
    const prompt = [
      `Analyze this ${criteria.type} content for relevance:`,
      '',
      'User Criteria:',
      `- Required keywords: ${criteria.keywords.join(', ')}`,
      criteria.excludeKeywords?.length > 0 ? `- Exclude keywords: ${criteria.excludeKeywords.join(', ')}` : '',
      criteria.location ? `- Location: ${criteria.location}` : '',
      criteria.salaryMin ? `- Minimum salary: $${criteria.salaryMin}` : '',
      criteria.priceMax ? `- Maximum price: $${criteria.priceMax}` : '',
      '',
      'Content:',
      elementText,
      '',
      'Provide a relevance score (0-100) and brief explanation (1-2 sentences).',
      'Format: "Score: X/100. Explanation."',
    ].filter(Boolean).join('\n');
    
    const result = await session.prompt(prompt);
    
    // Parse relevance score
    const scoreMatch = result.match(/(?:score|relevance)[:\s]*(\d+)\s*(?:\/100|%)/i);
    const relevance = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    
    return {
      relevance,
      method: 'ai',
      explanation: result,
    };
  } catch (error) {
    console.error('AI matching failed:', error);
    return null;
  }
}

// Analyze element against criteria
async function analyzeMatch(element, criteria) {
  // Try AI matching first if available
  if (window.CapweAI && window.CapweAI.isAvailable()) {
    const aiResult = await aiMatch(element, criteria);
    if (aiResult && aiResult.relevance >= 70) {
      return aiResult;
    }
  }
  
  // Fallback to basic matching
  return basicMatch(element, criteria);
}

// Highlight matched element
function highlightMatch(element, match, criteria) {
  element.classList.add('capwe-highlighted', 'ai-match');
  element.setAttribute('data-capwe-match-id', match.id);
  
  // Add click handler to show details
  element.addEventListener('click', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      showMatchDetails(element, match, criteria);
    }
  }, { once: true });
}

// Remove highlight from element
function removeHighlight(element) {
  element.classList.remove('capwe-highlighted', 'ai-match');
  element.removeAttribute('data-capwe-match-id');
}

// Show match details in tooltip
function showMatchDetails(element, match, criteria) {
  // Use shared utility for HTML escaping
  const escapeHtml = window.CapweUtils?.escapeHtml || ((text) => {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  });
  
  const content = `
    <div class="capwe-tooltip-header">
      <span class="capwe-tooltip-icon">🎯</span>
      <span>Look Out Match</span>
    </div>
    <div class="capwe-tooltip-content">
      <div class="capwe-tooltip-label">Criteria:</div>
      <div>${escapeHtml(criteria.type.charAt(0).toUpperCase() + criteria.type.slice(1))}</div>
      <div class="capwe-tooltip-label" style="margin-top: 8px;">Keywords:</div>
      <div>${escapeHtml(criteria.keywords.join(', '))}</div>
      <div class="capwe-tooltip-label" style="margin-top: 8px;">Relevance:</div>
      <div>${escapeHtml(match.relevance.toString())}% match</div>
      ${match.explanation ? `
        <div class="capwe-tooltip-label" style="margin-top: 8px;">Analysis:</div>
        <div style="font-size: 11px;">${escapeHtml(match.explanation)}</div>
      ` : ''}
      <div style="margin-top: 12px; font-size: 11px; color: #10b981;">
        ✓ This content matches your Look Out criteria
      </div>
    </div>
  `;
  
  // Use existing tooltip system
  if (window.showTooltip) {
    window.showTooltip(element, content, 'ai-match');
  }
}

// Scan page for Look Out matches
async function scanForMatches() {
  const config = await getLookOutConfig();
  
  if (!config.enabled || config.criteria.length === 0) {
    return [];
  }
  
  // Clear existing matches
  activeMatches.forEach(match => {
    const element = document.querySelector(`[data-capwe-match-id="${match.id}"]`);
    if (element) {
      removeHighlight(element);
    }
  });
  activeMatches = [];
  
  // Scan for new matches
  for (const criteria of config.criteria) {
    const candidates = findPotentialMatches(criteria.type);
    
    for (const candidate of candidates) {
      // Skip if already highlighted
      if (candidate.hasAttribute('data-capwe-match-id')) continue;
      
      const matchResult = await analyzeMatch(candidate, criteria);
      
      if (matchResult && matchResult.relevance >= 70) {
        const match = {
          id: generateId('match'),
          element: candidate,
          criteria: criteria,
          ...matchResult,
        };
        
        activeMatches.push(match);
        highlightMatch(candidate, match, criteria);
      }
    }
  }
  
  // Notify user of matches
  if (activeMatches.length > 0) {
    console.log(`Capwe: Found ${activeMatches.length} Look Out matches`);
    
    // Could show a notification badge
    if (typeof chrome !== 'undefined' && chrome.action) {
      chrome.action.setBadgeText({ text: activeMatches.length.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    }
  }
  
  return activeMatches;
}

// Initialize Look Out feature
async function initLookOut() {
  const config = await getLookOutConfig();
  
  if (!config.enabled) {
    console.log('Look Out feature disabled');
    return;
  }
  
  console.log('Look Out feature initialized');
  
  // Initial scan
  setTimeout(() => scanForMatches(), 2000);
  
  // Rescan on navigation or DOM changes
  let scanTimeout;
  const observer = new MutationObserver(() => {
    clearTimeout(scanTimeout);
    scanTimeout = setTimeout(() => scanForMatches(), 1000);
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Export functions
window.CapweLookOut = {
  getLookOutConfig,
  saveLookOutConfig,
  addCriteria,
  removeCriteria,
  updateCriteria,
  scanForMatches,
  initLookOut,
  getActiveMatches: () => activeMatches,
};
