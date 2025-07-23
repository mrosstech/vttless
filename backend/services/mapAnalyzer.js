const { spawn } = require('child_process');
const path = require('path');

/**
 * Analyzes a map image to detect grid properties
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<Object>} Analysis results with grid properties
 */
function analyzeMapImage(imagePath) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, 'analysis.py');
        const pythonProcess = spawn('python3', [scriptPath, imagePath]);
        
        let outputData = '';
        let errorData = '';
        
        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error('Python script error:', errorData);
                // Return default fallback values instead of rejecting
                resolve({
                    success: false,
                    error: 'Analysis failed',
                    gridHeight: 10,
                    gridWidth: 10,
                    gridSize: 40,
                    confidence: 0.0
                });
                return;
            }
            
            try {
                const result = JSON.parse(outputData.trim());
                resolve(result);
            } catch (parseError) {
                console.error('Failed to parse analysis result:', parseError);
                console.error('Raw output:', outputData);
                resolve({
                    success: false,
                    error: 'Failed to parse analysis result',
                    gridHeight: 10,
                    gridWidth: 10,
                    gridSize: 40,
                    confidence: 0.0
                });
            }
        });
        
        pythonProcess.on('error', (error) => {
            console.error('Failed to start python process:', error);
            resolve({
                success: false,
                error: 'Failed to start analysis process',
                gridHeight: 10,
                gridWidth: 10,
                gridSize: 40,
                confidence: 0.0
            });
        });
    });
}

module.exports = {
    analyzeMapImage
};