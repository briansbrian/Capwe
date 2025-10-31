# Capwe Chrome Extension

An accessibility tool for transparent browsing that helps users understand web page elements through intelligent detection and contextual tooltips.

## Features

### Core Detection (Currently Implemented)
- **Advertisement Detection**: Identifies ads through class names, IDs, and known ad networks
- **Link Analysis**: Shows information about link destinations (external/internal, security status)
- **Form Analysis**: Provides security information and field analysis for forms
- **Hidden Element Detection**: Finds hidden tracking pixels and concealed elements

### Coming Soon
- **AI-Enhanced Analysis**: Using Chrome's built-in AI for advanced security analysis
- **Look Out Feature**: User-defined monitoring for jobs, products, and content

## Installation

### For Development
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `extension` folder from this repository

### For Users
The extension will be available on the Chrome Web Store soon.

## Usage

1. Click the Capwe icon in your browser toolbar to open settings
2. Enable/disable specific detection features
3. Hover over elements on any webpage to see tooltips
4. Tooltips appear automatically for:
   - Advertisements (red border)
   - External links (yellow border)
   - Forms (blue border)
   - Hidden elements (gray border)

## Privacy

- **100% Local Processing**: All detection happens in your browser
- **No External Servers**: No data is sent anywhere
- **No Tracking**: We don't track your browsing activity
- **Minimal Permissions**: Only requires activeTab and storage

## Technical Details

- **Manifest Version**: 3 (Latest Chrome Extension standard)
- **Size**: ~50KB total
- **Memory**: <15MB typical usage
- **Performance**: <100ms load time impact

## Architecture

```
extension/
├── manifest.json          # Extension configuration
├── content.js            # Main detection logic
├── background.js         # Service worker
├── popup/
│   ├── popup.html       # Settings UI
│   ├── popup.js         # Settings logic
│   └── popup.css        # Popup styling
├── styles/
│   └── tooltip.css      # Tooltip styles
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Development

### Building
No build step required - this is a pure JavaScript extension.

### Testing
1. Load the extension in Chrome as described above
2. Visit various websites to test detection
3. Open browser console to see any errors

### Debugging
- Right-click the extension icon → "Inspect popup" for popup debugging
- Use browser DevTools on any page to debug content script
- Check `chrome://extensions/` for service worker logs

## Roadmap

### Phase 1: Core Detection ✅
- Basic ad detection
- Link analysis
- Form analysis
- Tooltip system

### Phase 2: Enhanced Detection (Next)
- Improved heuristics
- Better hidden element detection
- Link deception detection

### Phase 3: AI Integration
- Chrome Built-in AI support
- Security risk assessment
- Contextual analysis

### Phase 4: Advanced Features
- Look Out feature
- Custom user rules
- Export/import settings

## Contributing

Contributions are welcome! Please follow these guidelines:
1. Follow the existing code style
2. Test thoroughly before submitting
3. Keep changes focused and minimal
4. Update documentation as needed

## License

See LICENSE file in the root directory.

## Support

For issues, feature requests, or questions, please open an issue on GitHub.
