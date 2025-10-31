// Look Out Settings UI Script
'use strict';

const typeSelect = document.getElementById('type');
const keywordsInput = document.getElementById('keywords');
const excludeKeywordsInput = document.getElementById('excludeKeywords');
const addButton = document.getElementById('addCriteria');
const criteriaList = document.getElementById('criteriaList');
const emptyState = document.getElementById('emptyState');
const additionalFields = document.getElementById('additionalFields');

// Additional field templates
const FIELD_TEMPLATES = {
  job: `
    <div class="form-group">
      <label for="location">Location (optional)</label>
      <input type="text" id="location" placeholder="e.g., United States, Remote">
    </div>
    <div class="form-group">
      <label for="salaryMin">Minimum Salary (optional)</label>
      <input type="number" id="salaryMin" placeholder="e.g., 100000">
    </div>
  `,
  product: `
    <div class="form-group">
      <label for="priceMax">Maximum Price (optional)</label>
      <input type="number" id="priceMax" placeholder="e.g., 1000">
    </div>
  `,
  content: '',
};

// Update additional fields based on type
function updateAdditionalFields() {
  const type = typeSelect.value;
  additionalFields.innerHTML = FIELD_TEMPLATES[type] || '';
}

// Load and display criteria
async function loadCriteria() {
  const result = await chrome.storage.sync.get(['lookOutConfig']);
  const config = result.lookOutConfig || { enabled: false, criteria: [] };
  
  if (config.criteria.length === 0) {
    criteriaList.style.display = 'none';
    emptyState.style.display = 'block';
  } else {
    criteriaList.style.display = 'block';
    emptyState.style.display = 'none';
    
    criteriaList.innerHTML = '';
    config.criteria.forEach((criteria) => {
      const item = createCriteriaItem(criteria);
      criteriaList.appendChild(item);
    });
  }
}

// Create criteria list item
function createCriteriaItem(criteria) {
  const li = document.createElement('li');
  li.className = 'criteria-item';
  
  const typeLabel = {
    'job': '💼 Job',
    'product': '🛍️ Product',
    'content': '📄 Content',
  }[criteria.type] || criteria.type;
  
  let details = [];
  if (criteria.location) details.push(`Location: ${criteria.location}`);
  if (criteria.salaryMin) details.push(`Min Salary: $${criteria.salaryMin.toLocaleString()}`);
  if (criteria.priceMax) details.push(`Max Price: $${criteria.priceMax}`);
  
  li.innerHTML = `
    <div class="criteria-header">
      <div class="criteria-type">${typeLabel}</div>
      <button class="btn-remove" data-id="${criteria.id}">Remove</button>
    </div>
    <div class="criteria-keywords">
      <strong>Keywords:</strong> ${criteria.keywords.join(', ')}
    </div>
    ${criteria.excludeKeywords && criteria.excludeKeywords.length > 0 ? `
      <div class="criteria-keywords">
        <strong>Exclude:</strong> ${criteria.excludeKeywords.join(', ')}
      </div>
    ` : ''}
    ${details.length > 0 ? `
      <div class="criteria-keywords">${details.join(' • ')}</div>
    ` : ''}
  `;
  
  // Add remove handler
  const removeBtn = li.querySelector('.btn-remove');
  removeBtn.addEventListener('click', () => removeCriteria(criteria.id));
  
  return li;
}

// Add new criteria
async function addNewCriteria() {
  const keywords = keywordsInput.value.trim().split(',').map(k => k.trim()).filter(k => k);
  
  if (keywords.length === 0) {
    alert('Please enter at least one keyword');
    return;
  }
  
  const excludeKeywords = excludeKeywordsInput.value.trim()
    .split(',')
    .map(k => k.trim())
    .filter(k => k);
  
  const criteria = {
    type: typeSelect.value,
    keywords,
    excludeKeywords: excludeKeywords.length > 0 ? excludeKeywords : undefined,
  };
  
  // Add type-specific fields
  if (criteria.type === 'job') {
    const location = document.getElementById('location')?.value.trim();
    const salaryMin = document.getElementById('salaryMin')?.value;
    
    if (location) criteria.location = location;
    if (salaryMin) criteria.salaryMin = parseInt(salaryMin);
  } else if (criteria.type === 'product') {
    const priceMax = document.getElementById('priceMax')?.value;
    if (priceMax) criteria.priceMax = parseInt(priceMax);
  }
  
  // Save to storage
  const result = await chrome.storage.sync.get(['lookOutConfig']);
  const config = result.lookOutConfig || { enabled: true, criteria: [] };
  
  criteria.id = `criteria-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  config.criteria.push(criteria);
  config.enabled = true; // Enable Look Out when first criteria is added
  
  await chrome.storage.sync.set({ lookOutConfig: config });
  
  // Clear form
  keywordsInput.value = '';
  excludeKeywordsInput.value = '';
  if (document.getElementById('location')) document.getElementById('location').value = '';
  if (document.getElementById('salaryMin')) document.getElementById('salaryMin').value = '';
  if (document.getElementById('priceMax')) document.getElementById('priceMax').value = '';
  
  // Reload criteria list
  await loadCriteria();
  
  // Notify content script to rescan
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'rescanLookOut' }).catch(() => {
        // Ignore if content script not ready
      });
    }
  });
}

// Remove criteria
async function removeCriteria(criteriaId) {
  const result = await chrome.storage.sync.get(['lookOutConfig']);
  const config = result.lookOutConfig || { enabled: false, criteria: [] };
  
  config.criteria = config.criteria.filter(c => c.id !== criteriaId);
  
  // Disable Look Out if no criteria left
  if (config.criteria.length === 0) {
    config.enabled = false;
  }
  
  await chrome.storage.sync.set({ lookOutConfig: config });
  
  await loadCriteria();
  
  // Notify content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'rescanLookOut' }).catch(() => {});
    }
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateAdditionalFields();
  loadCriteria();
  
  typeSelect.addEventListener('change', updateAdditionalFields);
  addButton.addEventListener('click', addNewCriteria);
});
