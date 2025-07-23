# Map Analysis Feature

This feature automatically analyzes uploaded map images to detect grid properties like dimensions and square size.

## Setup

### Python Dependencies
Install the required Python packages:

```bash
cd backend
pip3 install -r requirements.txt
```

Required packages:
- opencv-python==4.8.1.78
- Pillow==10.0.1
- numpy==1.24.3
- matplotlib==3.7.2

### Directory Structure
```
backend/
├── services/
│   ├── analysis.py          # Main analysis script
│   └── mapAnalyzer.js       # Node.js wrapper service
├── uploads/
│   └── temp/                # Temporary file storage
└── requirements.txt         # Python dependencies
```

## Usage

### API Endpoint
- **POST** `/maps/analyze`
- **Content-Type**: `multipart/form-data`
- **Body**: `image` file field

### Response Format
```json
{
  "success": true,
  "gridHeight": 15,
  "gridWidth": 20,
  "gridSize": 40,
  "rowSpacing": 39.5,
  "colSpacing": 40.2,
  "confidence": 0.85,
  "suggestions": {
    "gridWidth": 20,
    "gridHeight": 15,
    "gridSize": 40
  }
}
```

### Frontend Integration
The feature is integrated into the map creation modal in `MapSidebar.jsx`:

1. User uploads an image
2. Image is analyzed for grid properties
3. Form fields are auto-populated with detected values
4. User can adjust values if needed
5. Map is created with the background image

## Technical Details

### Analysis Process
1. **Preprocessing**: Image enhancement, noise reduction, contrast adjustment
2. **Edge Detection**: Gradient calculation to find grid lines
3. **Peak Detection**: Auto-tuned threshold to find consistent line spacing
4. **Grid Calculation**: Determine grid dimensions and square size
5. **Confidence Score**: Based on consistency of detected lines

### Error Handling
- Falls back to default values if analysis fails
- Provides user feedback through toast notifications
- Continues with map creation even if analysis fails

### Supported Image Formats
- PNG, JPG, JPEG, GIF
- Max file size: 10MB
- Recommended: High contrast grid lines for best detection