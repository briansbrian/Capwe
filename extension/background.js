// Capwe Background Service Worker
'use strict';

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  showIndicators: true,
  detectAds: true,
  detectLinks: true,
  detectForms: true,
  detectHidden: true,
  aiEnabled: false,
  lookOutEnabled: false,
};

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Capwe extension installed:', details.reason);
  
  // Set default settings
  chrome.storage.sync.get(['settings'], (result) => {
    if (!result.settings) {
      chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
    }
  });
  
  // Show welcome notification
  if (details.reason === 'install') {
    console.log('Welcome to Capwe - Transparent Browsing Guide!');
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getSettings') {
    chrome.storage.sync.get(['settings'], (result) => {
      sendResponse({ settings: result.settings || DEFAULT_SETTINGS });
    });
    return true; // Will respond asynchronously
  }
  
  if (message.type === 'saveSettings') {
    chrome.storage.sync.set({ settings: message.settings }, () => {
      // Notify all tabs about settings update
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, {
            type: 'updateSettings',
            settings: message.settings,
          }).catch(() => {
            // Ignore errors for tabs that don't have content script
          });
        });
      });
      sendResponse({ success: true });
    });
    return true; // Will respond asynchronously
  }
});

// Monitor tab updates (optional)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Tab finished loading, content script should be active
    console.log('Tab loaded:', tab.url);
  }
});

// Keep service worker alive (if needed for long-running tasks)
let keepAliveInterval;

function keepAlive() {
  keepAliveInterval = setInterval(() => {
    chrome.runtime.getPlatformInfo(() => {
      // Just checking platform keeps the service worker alive
    });
  }, 20000); // Every 20 seconds
}

// Clean up on suspend
chrome.runtime.onSuspend.addListener(() => {
  console.log('Capwe service worker suspending');
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
});

console.log('Capwe background service worker started');
