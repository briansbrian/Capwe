// Capwe Popup Script
'use strict';

// Load settings and update UI
function loadSettings() {
  chrome.storage.sync.get(['settings'], (result) => {
    const settings = result.settings || {
      enabled: true,
      showIndicators: true,
      detectAds: true,
      detectLinks: true,
      detectForms: true,
      detectHidden: true,
      aiEnabled: false,
      lookOutEnabled: false,
    };
    
    // Update checkboxes
    document.getElementById('enabled').checked = settings.enabled;
    document.getElementById('showIndicators').checked = settings.showIndicators;
    document.getElementById('detectAds').checked = settings.detectAds;
    document.getElementById('detectLinks').checked = settings.detectLinks;
    document.getElementById('detectForms').checked = settings.detectForms;
    document.getElementById('detectHidden').checked = settings.detectHidden;
    document.getElementById('aiEnabled').checked = settings.aiEnabled;
    document.getElementById('lookOutEnabled').checked = settings.lookOutEnabled;
  });
}

// Save settings
function saveSettings() {
  const settings = {
    enabled: document.getElementById('enabled').checked,
    showIndicators: document.getElementById('showIndicators').checked,
    detectAds: document.getElementById('detectAds').checked,
    detectLinks: document.getElementById('detectLinks').checked,
    detectForms: document.getElementById('detectForms').checked,
    detectHidden: document.getElementById('detectHidden').checked,
    aiEnabled: document.getElementById('aiEnabled').checked,
    lookOutEnabled: document.getElementById('lookOutEnabled').checked,
  };
  
  chrome.storage.sync.set({ settings }, () => {
    // Notify background script to update all tabs
    chrome.runtime.sendMessage({
      type: 'saveSettings',
      settings: settings,
    });
    
    // Visual feedback
    showSavedIndicator();
  });
}

// Show saved indicator
function showSavedIndicator() {
  const footer = document.querySelector('.popup-footer');
  const indicator = document.createElement('div');
  indicator.className = 'saved-indicator';
  indicator.textContent = '✓ Saved';
  footer.appendChild(indicator);
  
  setTimeout(() => {
    indicator.classList.add('fade-out');
    setTimeout(() => indicator.remove(), 300);
  }, 1500);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  
  // Add change listeners to all checkboxes
  const checkboxes = document.querySelectorAll('input[type="checkbox"]:not([disabled])');
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', saveSettings);
  });
});
