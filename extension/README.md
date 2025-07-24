# VTTless D&D Beyond Integration Extension

This Chrome extension enables seamless integration between D&D Beyond character sheets and the VTTless virtual tabletop platform.

## Features

- **Character Parsing**: Automatically extracts character data from D&D Beyond character sheets
- **Real-time Sync**: Syncs character stats, abilities, and equipment with VTTless
- **Auto-sync**: Optional automatic synchronization when character data changes
- **Visual Integration**: Adds integration UI directly to D&D Beyond character pages
- **Connection Management**: Configurable VTTless connection settings

## How It Works

1. **D&D Beyond Integration**: Content script parses character sheet data from D&D Beyond pages
2. **Data Processing**: Character data is converted to VTTless-compatible format
3. **VTTless Communication**: Extension communicates with VTTless to create/update characters
4. **Real-time Updates**: Changes sync automatically between platforms

## Installation

### Development Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `extension` folder
4. The extension icon should appear in your browser toolbar

### Production Installation

(To be added when published to Chrome Web Store)

## Usage

### Initial Setup

1. Click the VTTless extension icon in your browser toolbar
2. Configure your VTTless URL (default: `http://localhost:3000`)
3. Open a D&D Beyond character sheet in a new tab
4. Navigate to a VTTless campaign

### Syncing Characters

**Method 1: From D&D Beyond Page**
- Visit any D&D Beyond character sheet
- Look for the VTTless integration panel at the top of the page
- Click "Sync Character" to import into VTTless

**Method 2: From Extension Popup**
- Open a D&D Beyond character sheet
- Click the extension icon
- Click "Parse Character" to extract data
- Click "Sync Character" to import into VTTless

### Auto-sync

Enable auto-sync in the extension popup to automatically sync character changes every 30 seconds.

## Configuration

### Settings

- **VTTless URL**: The URL where your VTTless instance is running
- **Auto-sync**: Enable automatic character synchronization
- **Debug Mode**: Enable detailed logging for troubleshooting

### Storage

The extension stores:
- User settings (VTTless URL, auto-sync preference)
- Last parsed character data
- Sync timestamps

## Architecture

### File Structure

```
extension/
├── manifest.json              # Extension configuration
├── background/
│   └── service-worker.js      # Background service worker
├── content/
│   ├── dndbeyond-content.js   # D&D Beyond page integration
│   ├── dndbeyond-styles.css   # D&D Beyond UI styles
│   └── vttless-content.js     # VTTless page integration
├── popup/
│   ├── popup.html             # Extension popup interface
│   ├── popup.css              # Popup styles
│   └── popup.js               # Popup functionality
├── shared/
│   └── character-parser.js    # Character data parsing logic
└── icons/
    └── [extension icons]
```

### Components

1. **Character Parser** (`shared/character-parser.js`)
   - Extracts character data from D&D Beyond DOM
   - Handles various character sheet layouts
   - Converts to standardized format

2. **D&D Beyond Content Script** (`content/dndbeyond-content.js`)
   - Injects integration UI into character pages
   - Handles user interactions
   - Manages auto-sync functionality

3. **VTTless Content Script** (`content/vttless-content.js`)
   - Receives character data from extension
   - Creates/updates characters via VTTless API
   - Shows import notifications

4. **Background Service Worker** (`background/service-worker.js`)
   - Manages communication between components
   - Handles VTTless connection testing
   - Stores extension settings

5. **Popup Interface** (`popup/`)
   - Provides user control panel
   - Shows connection status
   - Manages settings and manual sync

## Development

### Prerequisites

- Chrome browser with Developer mode enabled
- VTTless running locally or accessible via URL
- D&D Beyond account with character sheets

### Local Development

1. Make changes to extension files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the VTTless extension
4. Test changes on D&D Beyond character sheets

### Debugging

- **Background Script**: `chrome://extensions/` → Click "Service Worker" link
- **Content Scripts**: Open Developer Tools on D&D Beyond/VTTless pages
- **Popup**: Right-click extension icon → "Inspect popup"

## API Integration

### VTTless API Endpoints Used

- `GET /campaigns/:campaignId/characters/user` - List user's characters
- `POST /campaigns/:campaignId/characters` - Create new character
- `PATCH /characters/:characterId` - Update existing character

### Character Data Format

The extension converts D&D Beyond character data to VTTless format:

```javascript
{
  name: "Character Name",
  level: 5,
  hitPoints: 45,
  maxHitPoints: 45,
  armorClass: 16,
  properties: {
    dndBeyondId: "12345",
    class: "Fighter",
    race: "Human",
    abilities: { strength: { score: 16, modifier: 3 }, ... },
    skills: { athletics: 5, ... },
    // ... full D&D Beyond data
  }
}
```

## Troubleshooting

### Common Issues

1. **Extension not working on D&D Beyond**
   - Refresh the D&D Beyond page
   - Check that you're on a character sheet page
   - Reload the extension

2. **Connection to VTTless failed**
   - Verify VTTless is running
   - Check the VTTless URL in settings
   - Test connection in popup

3. **Character data not parsing**
   - Try refreshing the D&D Beyond page
   - Enable debug mode for detailed logs
   - Check browser console for errors

### Debug Mode

Enable debug mode in the extension popup to see detailed logs:
- Background script logs: `chrome://extensions/` → Service Worker
- Content script logs: Browser Developer Tools → Console

## Security & Privacy

- Extension only accesses D&D Beyond character data you explicitly sync
- No data is stored externally - all communication is between your browser and your VTTless instance
- Character data is only sent to the VTTless URL you configure
- No analytics or tracking

## Contributing

This extension is part of the VTTless mono-repo. To contribute:

1. Fork the repository
2. Make changes in the `extension/` directory
3. Test thoroughly with both D&D Beyond and VTTless
4. Submit a pull request

## License

Same as VTTless main project.

## Changelog

### v1.0.0 (Initial Release)
- Character parsing from D&D Beyond
- Basic sync with VTTless
- Extension popup interface
- Auto-sync functionality
- Connection management