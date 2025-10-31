// Capwe AI Integration Module
// Uses Chrome's built-in AI APIs (Chrome 128+)
'use strict';

// Configuration
const AI_CONFIG = {
  CACHE_MAX_SIZE: 100,
  CACHE_TTL_MS: 3600000, // 1 hour
  BATCH_SIZE: 5,
  BATCH_DELAY_MS: 100,
  MAX_CALLS_PER_MINUTE: 60,
  MAX_TEXT_LENGTH: 500,
  MAX_URL_LENGTH: 200,
  MAX_LABEL_LENGTH: 50,
  ALLOWED_CHARS: /[^\w\s\-.,!?@/:]/g,
};

// AI Session management
let aiSession = null;
let aiAvailable = false;

// Cache for AI responses
class AICache {
  constructor(maxSize = AI_CONFIG.CACHE_MAX_SIZE, ttl = AI_CONFIG.CACHE_TTL_MS) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }
  
  getCacheKey(element, analysisType) {
    const text = element.textContent?.substring(0, 50) || '';
    return `${analysisType}:${element.tagName}:${text}`;
  }
  
  get(key) {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < this.ttl) {
      return entry.value;
    }
    this.cache.delete(key);
    return null;
  }
  
  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, { value, timestamp: Date.now() });
  }
  
  clear() {
    this.cache.clear();
  }
}

const aiCache = new AICache();

// Resource monitoring
class AIResourceMonitor {
  constructor() {
    this.callCount = 0;
    this.totalTime = 0;
    this.startTime = Date.now();
  }
  
  async measureCall(fn) {
    const start = performance.now();
    this.callCount++;
    
    try {
      const result = await fn();
      this.totalTime += performance.now() - start;
      return result;
    } catch (error) {
      console.error('AI call failed:', error);
      return null;
    }
  }
  
  getMetrics() {
    const elapsed = Date.now() - this.startTime;
    return {
      totalCalls: this.callCount,
      averageTime: this.callCount > 0 ? this.totalTime / this.callCount : 0,
      callsPerMinute: elapsed > 0 ? (this.callCount / elapsed) * 60000 : 0,
    };
  }
  
  shouldThrottle() {
    const metrics = this.getMetrics();
    return metrics.callsPerMinute > AI_CONFIG.MAX_CALLS_PER_MINUTE;
  }
  
  reset() {
    this.callCount = 0;
    this.totalTime = 0;
    this.startTime = Date.now();
  }
}

const aiMonitor = new AIResourceMonitor();

// Input sanitization
function sanitizeForPrompt(text, maxLength = AI_CONFIG.MAX_TEXT_LENGTH) {
  if (!text) return '';
  
  return text
    .substring(0, maxLength)
    .replace(AI_CONFIG.ALLOWED_CHARS, '')
    .trim();
}

function sanitizeURL(url, maxLength = AI_CONFIG.MAX_URL_LENGTH) {
  try {
    const parsed = new URL(url);
    const result = `${parsed.origin}${parsed.pathname}`;
    return result.substring(0, maxLength);
  } catch {
    return '[Invalid URL]';
  }
}

// AI Availability check
async function checkAIAvailability() {
  try {
    if (!('ai' in window)) {
      console.log('Chrome AI not available: window.ai not found');
      return false;
    }
    
    if (!window.ai.languageModel) {
      console.log('Chrome AI not available: languageModel API not found');
      return false;
    }
    
    const canPrompt = await window.ai.languageModel.capabilities();
    
    if (!canPrompt || canPrompt.available === 'no') {
      console.log('Chrome AI not available: capabilities check failed');
      return false;
    }
    
    console.log('Chrome AI is available:', canPrompt);
    return canPrompt.available === 'readily' || canPrompt.available === 'after-download';
  } catch (error) {
    console.error('Error checking AI availability:', error);
    return false;
  }
}

// Initialize AI session
async function initializeAI() {
  if (aiSession) return aiSession;
  
  aiAvailable = await checkAIAvailability();
  
  if (!aiAvailable) {
    console.log('AI features disabled: Chrome Built-in AI not available');
    return null;
  }
  
  try {
    aiSession = await window.ai.languageModel.create({
      temperature: 0.3, // Lower for more consistent security analysis
      topK: 3,
    });
    console.log('AI session initialized successfully');
    return aiSession;
  } catch (error) {
    console.error('Failed to initialize AI session:', error);
    aiAvailable = false;
    return null;
  }
}

// Get or create AI session
async function getAISession() {
  if (!aiSession && aiAvailable) {
    return await initializeAI();
  }
  return aiSession;
}

// AI-powered form security analysis
async function analyzeFormSecurity(formElement) {
  const session = await getAISession();
  if (!session) return null;
  
  // Check cache
  const cacheKey = aiCache.getCacheKey(formElement, 'formSecurity');
  const cached = aiCache.get(cacheKey);
  if (cached) return cached;
  
  // Check throttling
  if (aiMonitor.shouldThrottle()) {
    console.log('AI throttled: too many requests');
    return null;
  }
  
  try {
    const action = sanitizeURL(formElement.action || window.location.href);
    const isHTTPS = action.startsWith('https://');
    
    // Extract sensitive inputs
    const inputs = Array.from(formElement.querySelectorAll('input, textarea'));
    const sensitiveInputs = inputs
      .map(input => {
        const label = getInputLabel(input);
        const type = input.type?.toLowerCase() || '';
        return { label, type };
      })
      .filter(({ label, type }) => {
        return type === 'password' ||
               /credit card|password|ssn|social security|cvv/i.test(label);
      })
      .map(({ label }) => sanitizeForPrompt(label, AI_CONFIG.MAX_LABEL_LENGTH));
    
    if (sensitiveInputs.length === 0) return null;
    
    // Build prompt
    const prompt = [
      'Analyze the security risk of this form:',
      'Fields:',
      ...sensitiveInputs.map(field => `- ${field}`),
      'Submission URL:',
      action,
      'Protocol:',
      isHTTPS ? 'HTTPS (secure)' : 'HTTP (insecure)',
      '',
      'Provide a concise security warning in 2-3 sentences if sensitive data will be transmitted insecurely.',
    ].join('\n');
    
    const result = await aiMonitor.measureCall(async () => {
      return await session.prompt(prompt);
    });
    
    if (!result) return null;
    
    const analysis = {
      severity: !isHTTPS ? 'high' : 'info',
      icon: !isHTTPS ? '🚨' : '🔒',
      message: sanitizeForPrompt(result, 300),
    };
    
    aiCache.set(cacheKey, analysis);
    return analysis;
  } catch (error) {
    console.error('AI form analysis failed:', error);
    return null;
  }
}

// AI-powered link context analysis
async function analyzeLinkContext(linkElement) {
  const session = await getAISession();
  if (!session) return null;
  
  // Check cache
  const cacheKey = aiCache.getCacheKey(linkElement, 'linkContext');
  const cached = aiCache.get(cacheKey);
  if (cached) return cached;
  
  // Check throttling
  if (aiMonitor.shouldThrottle()) {
    console.log('AI throttled: too many requests');
    return null;
  }
  
  try {
    const linkText = sanitizeForPrompt(linkElement.textContent.trim(), 100);
    const linkURL = sanitizeURL(linkElement.href);
    const pageTitle = sanitizeForPrompt(document.title, 100);
    
    // Extract main content context
    const mainContent = extractMainContent();
    const pageContext = sanitizeForPrompt(mainContent, 300);
    
    // Build prompt
    const prompt = [
      `The page is about "${pageTitle}".`,
      `Main content context: ${pageContext}`,
      `A link displays as "${linkText}" and points to "${linkURL}".`,
      '',
      'Analyze if this link\'s destination is contextually relevant to the page content.',
      'Respond in 2-3 sentences. Indicate if there is a context mismatch or if it seems like advertising.',
    ].join('\n');
    
    const result = await aiMonitor.measureCall(async () => {
      return await session.prompt(prompt);
    });
    
    if (!result) return null;
    
    // Check if AI detected mismatch
    const isMismatch = /mismatch|unrelated|not related|different topic|advertising|ad\b/i.test(result);
    
    const analysis = {
      icon: isMismatch ? '🛑' : '🔗',
      message: sanitizeForPrompt(result, 300),
      severity: isMismatch ? 'warning' : 'info',
    };
    
    aiCache.set(cacheKey, analysis);
    return analysis;
  } catch (error) {
    console.error('AI link analysis failed:', error);
    return null;
  }
}

// Extract main content for context
function extractMainContent() {
  // Try to find main content area
  const mainSelectors = [
    'main',
    'article',
    '[role="main"]',
    '.content',
    '.main-content',
    '#content',
    '#main',
  ];
  
  for (const selector of mainSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.textContent.substring(0, 500);
    }
  }
  
  // Fallback to body
  return document.body.textContent.substring(0, 500);
}

// Helper to get input label
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

// AI-powered ad classification
async function classifyAd(adElement) {
  const session = await getAISession();
  if (!session) return null;
  
  // Check cache
  const cacheKey = aiCache.getCacheKey(adElement, 'adClassification');
  const cached = aiCache.get(cacheKey);
  if (cached) return cached;
  
  // Check throttling
  if (aiMonitor.shouldThrottle()) {
    console.log('AI throttled: too many requests');
    return null;
  }
  
  try {
    const adSource = sanitizeURL(
      adElement.src || 
      adElement.getAttribute('data-src') || 
      'unknown'
    );
    
    const position = getElementPosition(adElement);
    const pageTitle = sanitizeForPrompt(document.title, 100);
    
    // Build prompt
    const prompt = [
      `An embedded element from "${adSource}" appears in position "${position}" within the page "${pageTitle}".`,
      '',
      'Classify its purpose and relationship to the primary content in 1-2 sentences.',
      'Is it a display ad, sponsored content, or integrated content?',
    ].join('\n');
    
    const result = await aiMonitor.measureCall(async () => {
      return await session.prompt(prompt);
    });
    
    if (!result) return null;
    
    const analysis = {
      icon: '🖼️',
      message: sanitizeForPrompt(result, 300),
      type: 'advertisement',
    };
    
    aiCache.set(cacheKey, analysis);
    return analysis;
  } catch (error) {
    console.error('AI ad classification failed:', error);
    return null;
  }
}

// Get element position description
function getElementPosition(element) {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  
  if (rect.top < viewportHeight * 0.33) {
    return 'top';
  } else if (rect.top < viewportHeight * 0.66) {
    return 'middle';
  } else {
    return 'bottom';
  }
}

// Cleanup function
function cleanupAI() {
  if (aiSession) {
    try {
      aiSession.destroy();
    } catch (error) {
      console.error('Error destroying AI session:', error);
    }
    aiSession = null;
  }
  aiCache.clear();
  aiMonitor.reset();
}

// Export functions
window.CapweAI = {
  initialize: initializeAI,
  isAvailable: () => aiAvailable,
  analyzeFormSecurity,
  analyzeLinkContext,
  classifyAd,
  cleanup: cleanupAI,
  getMetrics: () => aiMonitor.getMetrics(),
};
