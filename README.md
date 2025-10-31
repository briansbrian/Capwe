# Capwe
An accessibility tool for transparent browsing

## Overview

Capwe is a Chrome extension that enhances web browsing transparency by detecting and highlighting various page elements that affect user experience. It provides real-time, contextual information through non-intrusive floating tooltips, helping users make informed decisions while browsing.

## Features

### Core Detection
- **Advertisement Detection**: Identifies ads through class names, IDs, and known ad networks
- **Link Analysis**: Shows information about link destinations, security status, and type
- **Form Analysis**: Provides security information and analyzes form fields
- **Hidden Element Detection**: Finds hidden tracking pixels and concealed elements

### AI-Enhanced Analysis (Chrome 128+)
- **Form Security**: AI-powered analysis of form security risks
- **Link Context**: Intelligent detection of misleading or deceptive links
- **Ad Classification**: Contextual understanding of advertising content

### Look Out Feature
- **Custom Monitoring**: Define criteria for content you want to find
- **Job Search**: Monitor for jobs matching salary, location, and keyword requirements
- **Product Tracking**: Track products within your price range
- **Smart Matching**: AI-powered relevance scoring for better results

## Installation

### From Source (Development)

1. Clone this repository:
   ```bash
   git clone https://github.com/briansbrian/Capwe.git
   cd Capwe
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top right

4. Click "Load unpacked" and select the `extension` folder

### Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store.

## Usage

### Basic Usage

1. Install the extension
2. The extension works automatically on all websites
3. Hover over elements to see informative tooltips
4. Click the extension icon to access settings

### Configuring Settings

1. Click the Capwe icon in the Chrome toolbar
2. Toggle features on/off:
   - Advertisement Detection
   - Link Analysis
   - Form Analysis
   - Hidden Element Detection
   - AI-Enhanced Analysis
   - Look Out Feature

### Using Look Out

1. Click "Configure Look Out Criteria" in the settings
2. Add criteria for content you want to monitor:
   - **Job Postings**: Keywords, location, minimum salary
   - **Products**: Keywords, maximum price
   - **General Content**: Keywords to match
3. Browse normally - matching content will be highlighted
4. Ctrl+Click highlighted elements for details

### AI Features

**Requirements**: Chrome 128+

**Enabling AI**:
1. Open `chrome://flags/#optimization-guide-on-device-model`
2. Set to "Enabled"
3. Restart Chrome
4. Enable "AI-Enhanced Analysis" in Capwe settings

**What AI Does**:
- Provides intelligent security warnings for forms
- Detects contextually mismatched links
- Explains advertising tactics
- Improves Look Out matching accuracy

## Privacy

- **100% Local Processing**: All analysis happens in your browser
- **No External Servers**: No data is sent anywhere
- **No Tracking**: We don't track your browsing
- **Minimal Permissions**: Only activeTab and storage
- **Open Source**: Audit the code yourself

## Performance

- **Lightweight**: <50KB total size
- **Fast**: <100ms load time impact
- **Efficient**: <15MB memory usage
- **Battery Friendly**: Minimal CPU usage

## Browser Compatibility

- Chrome 88+ (for basic features)
- Chrome 128+ (for AI features)
- Manifest V3 compatible

## Documentation

- [Development Guide](DEVELOPMENT.md) - For developers
- [AI Features](extension/AI_FEATURES.md) - AI integration details
- [Extension Concept](lib/EXTENSION_CONCEPT.md) - Original design document

## Project Status

✅ **Phase 1**: Project Setup - Complete  
✅ **Phase 2**: Core Detection - Complete  
✅ **Phase 3**: AI Integration - Complete  
✅ **Phase 4**: Look Out Feature - Complete  
🔄 **Phase 5**: Optimization & Polish - In Progress

## Testing

Use the included test page:
1. Load the extension
2. Open `extension/test.html`
3. Test all features with the examples provided

## Contributing

Contributions are welcome! Please see [DEVELOPMENT.md](DEVELOPMENT.md) for guidelines.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

See [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/briansbrian/Capwe/issues)
- **Documentation**: See docs in this repository

## Acknowledgments

Built with Chrome's Built-in AI APIs and modern web standards.

## Version

Current version: 1.0.0

## Changelog

### 1.0.0 (Initial Release)
- Core detection features
- AI integration
- Look Out feature
- Comprehensive settings UI

