# Capwe AI Integration

## Overview

Capwe uses Chrome's Built-in AI APIs (available in Chrome 128+) to provide intelligent analysis of web page elements. This enhancement elevates the extension from simple pattern matching to context-aware security analysis.

## Features

### 1. AI-Powered Form Security Analysis

When enabled, the extension analyzes forms that contain sensitive fields (passwords, credit cards, SSN, etc.) and provides intelligent security assessments.

**What it does:**
- Detects when sensitive data will be transmitted over insecure HTTP
- Provides contextual warnings about security risks
- Explains the implications in plain language

**Example:**
```
Basic Detection: "SECURITY RISK: Sensitive data over HTTP"
AI-Enhanced: "This form will transmit your credit card information over an 
insecure HTTP connection, making it vulnerable to interception. Always look 
for HTTPS when submitting payment information."
```

### 2. AI-Powered Link Context Analysis

Analyzes links to determine if they are contextually relevant to the page content.

**What it does:**
- Compares link destination with page topic
- Identifies deceptive links (e.g., "budget travel" linking to luxury watches)
- Detects disguised advertisements

**Example:**
```
Page Topic: "Budget Travel Tips"
Link: "Click here for travel tips" → luxury-watches.com
AI Analysis: "Context mismatch detected. This link advertises luxury watches, 
which is unrelated to budget travel content."
```

### 3. AI-Powered Ad Classification

Provides intelligent classification of advertising content.

**What it does:**
- Identifies the type of advertisement (display ad, sponsored content, etc.)
- Explains how the ad relates to the main content
- Helps users understand advertising tactics

## Technical Implementation

### Chrome Built-in AI APIs

The extension uses the following Chrome APIs:

```javascript
// Check AI availability
const capabilities = await window.ai.languageModel.capabilities();

// Create AI session
const session = await window.ai.languageModel.create({
  temperature: 0.3,  // Lower for consistent analysis
  topK: 3
});

// Prompt the AI
const result = await session.prompt(promptText);
```

### Security Considerations

1. **Input Sanitization**: All user content is sanitized before being sent to the AI to prevent prompt injection attacks
2. **Local Processing**: All AI processing happens locally in your browser - no data is sent to external servers
3. **Privacy**: The AI model runs entirely on your device
4. **Rate Limiting**: Requests are throttled to prevent excessive resource usage

### Performance Optimizations

1. **Caching**: AI responses are cached for 1 hour to avoid redundant analysis
2. **Throttling**: Maximum 60 AI calls per minute
3. **Batch Processing**: Multiple elements can be processed in batches
4. **Lazy Evaluation**: AI analysis only runs on demand (when you hover)

## Browser Compatibility

**Minimum Requirements:**
- Chrome 128 or later
- Chrome Built-in AI APIs enabled

**Checking Availability:**
The extension automatically detects if AI is available. If not, it falls back to basic detection without AI enhancements.

**Enabling AI in Chrome:**
1. Open `chrome://flags/#optimization-guide-on-device-model`
2. Set to "Enabled"
3. Restart Chrome
4. Download the AI model when prompted (one-time process)

## Usage

1. Open Capwe extension popup
2. Enable "AI-Enhanced Analysis"
3. Browse normally - AI insights appear automatically in tooltips
4. Look for the "🤖 AI Analysis" section in tooltips

## Privacy & Data

- **100% Local**: All AI processing happens on your device
- **No Cloud Calls**: No data is sent to Google or any external servers
- **No Tracking**: We don't track what you browse or analyze
- **No Storage**: AI analyses are cached temporarily but not permanently stored

## Future Enhancements

### Look Out Feature (Coming Soon)

User-defined monitoring for specific content:
- Job postings matching your criteria
- Products within your price range
- Content matching your interests

The AI will analyze page content in real-time and highlight matches with detailed relevance scores.

## Troubleshooting

### "AI features not available"

**Solution:**
1. Check Chrome version (must be 128+)
2. Enable Chrome AI flags (see above)
3. Ensure AI model is downloaded
4. Restart browser

### "AI analysis taking too long"

**Solution:**
- The first analysis may take 1-2 seconds while the model loads
- Subsequent analyses are cached and instant
- Check AI metrics in browser console: `CapweAI.getMetrics()`

### "Getting throttled" message

**Solution:**
- You've exceeded 60 AI calls per minute
- Wait a moment for the rate limit to reset
- Consider using AI only for critical elements

## Development

### Testing AI Features

```javascript
// Check if AI is available
console.log('AI Available:', window.CapweAI.isAvailable());

// Get performance metrics
console.log('Metrics:', window.CapweAI.getMetrics());

// Manually trigger analysis
const form = document.querySelector('form');
const analysis = await window.CapweAI.analyzeFormSecurity(form);
console.log('Analysis:', analysis);
```

### API Reference

```javascript
window.CapweAI = {
  // Initialize AI session
  initialize: async () => Promise<AISession|null>,
  
  // Check if AI is available
  isAvailable: () => boolean,
  
  // Analyze form security
  analyzeFormSecurity: async (formElement) => Promise<Analysis|null>,
  
  // Analyze link context
  analyzeLinkContext: async (linkElement) => Promise<Analysis|null>,
  
  // Classify advertisement
  classifyAd: async (adElement) => Promise<Analysis|null>,
  
  // Get performance metrics
  getMetrics: () => Metrics,
  
  // Cleanup resources
  cleanup: () => void
};
```

## Credits

Built using Chrome's Built-in AI APIs. Learn more:
- [Chrome AI Documentation](https://developer.chrome.com/docs/ai/built-in)
- [Prompt API Guide](https://github.com/explainers-by-googlers/prompt-api)
