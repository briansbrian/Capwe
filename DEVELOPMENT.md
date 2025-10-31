# Capwe Development Guide

## Project Overview

Capwe is a Chrome extension that enhances web browsing transparency by detecting and highlighting various page elements. It provides real-time, contextual information through non-intrusive tooltips.

## Architecture

### Component Overview

```
extension/
├── manifest.json           # Extension configuration (Manifest V3)
├── content.js             # Main content script coordinator
├── ai.js                  # AI integration module
├── lookout.js             # Look Out feature module
├── background.js          # Service worker
├── styles/
│   └── tooltip.css        # Tooltip and highlight styles
├── popup/
│   ├── popup.html         # Main settings UI
│   ├── popup.js           # Settings logic
│   ├── popup.css          # Popup styles
│   ├── lookout.html       # Look Out configuration UI
│   └── lookout-settings.js # Look Out settings logic
└── icons/                 # Extension icons
```

### Data Flow

1. **Page Load**
   - content.js loads and initializes
   - Loads settings from Chrome storage
   - Initializes AI module (if enabled)
   - Initializes Look Out module (if enabled)

2. **Element Detection**
   - Mouse hover triggers handleMouseOver
   - Element is checked against detection patterns
   - Tooltip is generated and displayed
   - AI analysis is requested (if enabled)

3. **Look Out Monitoring**
   - Scans page for potential matches
   - Compares against user-defined criteria
   - Highlights matching elements
   - Updates badge with match count

4. **Settings Management**
   - Popup UI modifies settings
   - Settings saved to Chrome storage
   - Background script broadcasts to all tabs
   - Content scripts update their state

## Development Setup

### Prerequisites

- Chrome 128+ (for AI features)
- Git
- Text editor (VS Code recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/briansbrian/Capwe.git
   cd Capwe
   ```

2. Load extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension` folder

3. Test the extension:
   - Open `extension/test.html` in a new tab
   - Try hovering over different elements
   - Test settings in the popup

### Development Workflow

1. Make changes to source files
2. Reload extension in `chrome://extensions/`
3. Test changes in browser
4. Check console for errors
5. Commit changes with descriptive messages

## Key Modules

### 1. Content Script (content.js)

**Purpose**: Main coordinator for detection and tooltip display

**Key Functions**:
- `handleMouseOver()` - Detects and analyzes elements on hover
- `showTooltip()` - Displays tooltip with positioning
- `hideTooltip()` - Hides tooltip after delay
- `init()` - Initializes the extension
- `startObserving()` - Sets up event listeners and observers

**Detection Functions**:
- `isAd()` - Detects advertisements
- `analyzeLink()` - Analyzes link destinations
- `analyzeForm()` - Analyzes form security
- `isHidden()` - Detects hidden elements

### 2. AI Module (ai.js)

**Purpose**: Chrome Built-in AI integration

**Key Functions**:
- `checkAIAvailability()` - Checks if AI is available
- `initializeAI()` - Creates AI session
- `analyzeFormSecurity()` - AI-powered form analysis
- `analyzeLinkContext()` - AI-powered link analysis
- `classifyAd()` - AI-powered ad classification

**Features**:
- Response caching (1-hour TTL)
- Rate limiting (60 calls/minute)
- Input sanitization
- Resource monitoring

### 3. Look Out Module (lookout.js)

**Purpose**: User-defined content monitoring

**Key Functions**:
- `getLookOutConfig()` - Retrieves user criteria
- `scanForMatches()` - Scans page for matches
- `analyzeMatch()` - Matches element against criteria
- `highlightMatch()` - Highlights matching elements
- `aiMatch()` - AI-powered matching (when available)
- `basicMatch()` - Pattern-based matching (fallback)

**Supported Types**:
- Job postings (with salary/location filters)
- Product listings (with price filters)
- General content (with keyword matching)

### 4. Background Service Worker (background.js)

**Purpose**: Manages extension lifecycle and settings

**Key Functions**:
- Settings synchronization across tabs
- Extension installation/update handling
- Message passing between components

## Performance Considerations

### Memory Usage

- **Target**: <15MB active, <5MB idle
- **Strategies**:
  - Cache AI responses (max 100 entries)
  - Lazy load modules
  - Clean up observers when not needed
  - Use event delegation

### CPU Usage

- **Target**: <5% CPU average
- **Strategies**:
  - Debounce mutation observers (300ms)
  - Throttle AI calls (60/minute)
  - Use requestIdleCallback for non-critical tasks
  - Batch process multiple elements

### Network Impact

- **Zero network requests** - All processing is local
- AI runs on-device (Chrome Built-in AI)
- No external API calls
- No tracking or analytics

## Security Best Practices

### Input Sanitization

Always sanitize user content before processing:

```javascript
function sanitizeForPrompt(text, maxLength = 500) {
  if (!text) return '';
  return text
    .substring(0, maxLength)
    .replace(/[^\w\s\-.,!?@/:]/g, '')
    .trim();
}
```

### Prompt Injection Prevention

Use structured prompts with clear boundaries:

```javascript
const prompt = [
  'System instruction:',
  'Analyze the security risk of this form.',
  '',
  'User data:',
  sanitizedInput,
  '',
  'Task: Provide security assessment.'
].join('\n');
```

### Permissions

Minimal permissions are used:
- `activeTab` - Only access to active tab
- `storage` - Local settings storage only
- No host permissions except `<all_urls>` for content scripts

## Testing

### Manual Testing

1. **Basic Detection**:
   - Open test.html
   - Hover over ads, links, forms
   - Verify tooltips appear correctly

2. **AI Features**:
   - Enable AI in settings
   - Test form security warnings
   - Test link context analysis

3. **Look Out**:
   - Add job criteria
   - Open job listing site
   - Verify matching posts are highlighted

### Browser Console Testing

```javascript
// Check AI availability
console.log('AI Available:', window.CapweAI.isAvailable());

// Get AI metrics
console.log('Metrics:', window.CapweAI.getMetrics());

// Get Look Out matches
console.log('Matches:', window.CapweLookOut.getActiveMatches());

// Test form analysis
const form = document.querySelector('form');
window.CapweAI.analyzeFormSecurity(form).then(console.log);
```

### Performance Testing

Monitor performance in Chrome DevTools:
1. Open Performance tab
2. Start recording
3. Hover over elements
4. Stop recording
5. Check CPU and memory usage

## Debugging

### Common Issues

**1. Tooltips not appearing**
- Check if extension is enabled
- Verify content script loaded (check Sources tab)
- Check console for errors

**2. AI not working**
- Verify Chrome version (128+)
- Check AI flags enabled
- Look for "AI not available" in console

**3. Look Out not matching**
- Verify criteria is saved correctly
- Check Look Out is enabled
- Test with simpler criteria first

### Debug Logging

Enable verbose logging:

```javascript
// In content.js, add at top:
const DEBUG = true;

// Add debug function:
function debug(...args) {
  if (DEBUG) console.log('[Capwe]', ...args);
}
```

## Extension APIs Used

### Chrome Storage API
```javascript
chrome.storage.sync.get(['settings'], callback);
chrome.storage.sync.set({ settings: newSettings });
```

### Chrome Runtime API
```javascript
chrome.runtime.onMessage.addListener(callback);
chrome.runtime.sendMessage({ type: 'updateSettings' });
```

### Chrome Action API
```javascript
chrome.action.setBadgeText({ text: '3' });
chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
```

### Chrome AI API (Built-in)
```javascript
const capabilities = await window.ai.languageModel.capabilities();
const session = await window.ai.languageModel.create({ temperature: 0.3 });
const result = await session.prompt(promptText);
```

## Code Style Guidelines

### JavaScript

- Use `'use strict';` in all files
- Use `const` and `let`, never `var`
- Use async/await instead of promises when possible
- Add comments for complex logic
- Keep functions small and focused

### Naming Conventions

- Functions: camelCase (`analyzeForm`)
- Classes: PascalCase (`AICache`)
- Constants: UPPER_SNAKE_CASE (`MAX_TOOLTIPS`)
- Private functions: prefix with underscore (`_helperFunction`)

### Error Handling

Always handle errors gracefully:

```javascript
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  return null; // Provide fallback
}
```

## Release Checklist

Before releasing a new version:

- [ ] Test all features manually
- [ ] Check console for errors
- [ ] Test on multiple websites
- [ ] Verify AI features work
- [ ] Test Look Out criteria
- [ ] Check memory usage (<15MB)
- [ ] Update version in manifest.json
- [ ] Update README.md
- [ ] Create release notes
- [ ] Test installation from scratch

## Roadmap

### Future Enhancements

1. **Performance Improvements**
   - Implement virtual scrolling for long pages
   - Add more aggressive caching
   - Optimize DOM queries

2. **New Features**
   - Custom user rules
   - Export/import settings
   - Site whitelisting
   - More AI analysis types

3. **UI Improvements**
   - Dark mode support
   - Customizable tooltip themes
   - Keyboard shortcuts

4. **Accessibility**
   - ARIA labels for all interactive elements
   - High contrast mode
   - Screen reader optimization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues or questions:
- GitHub Issues: https://github.com/briansbrian/Capwe/issues
- Documentation: See extension/README.md

## License

See LICENSE file in repository root.
