import numpy as np
import sys
import cv2
from PIL import Image
import matplotlib.pyplot as plt

def preprocess_image(image_array, preprocessing_options=None):
    """
    Apply various preprocessing steps to improve grid detection.
    
    Args:
        image_array: Input image as numpy array
        preprocessing_options: Dict of preprocessing options to enable/disable steps
    """
    if preprocessing_options is None:
        preprocessing_options = {
            'contrast_enhancement': True,
            'noise_reduction': True,
            'adaptive_threshold': True,
            'edge_enhancement': True,
            'perspective_correction': False,  # More complex, enable if needed
            'histogram_equalization': True
        }
    
    processed = image_array.copy()
    
    # Convert to float for processing
    processed = processed.astype(float)
    
    if preprocessing_options['noise_reduction']:
        # Gaussian blur for noise reduction
        processed = cv2.GaussianBlur(processed, (3, 3), 0)
        
        # Median blur for salt-and-pepper noise
        processed = cv2.medianBlur(processed.astype(np.uint8), 3)
    
    if preprocessing_options['contrast_enhancement']:
        # CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        processed = clahe.apply(processed.astype(np.uint8))
    
    if preprocessing_options['histogram_equalization']:
        # Global histogram equalization
        processed = cv2.equalizeHist(processed.astype(np.uint8))
    
    if preprocessing_options['adaptive_threshold']:
        # Adaptive thresholding
        processed = cv2.adaptiveThreshold(
            processed.astype(np.uint8),
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11,
            2
        )
    
    if preprocessing_options['edge_enhancement']:
        # Enhance edges using unsharp masking
        blurred = cv2.GaussianBlur(processed, (3, 3), 0)
        processed = cv2.addWeighted(processed, 1.5, blurred, -0.5, 0)
        
        # Sobel edge detection
        sobel_x = cv2.Sobel(processed, cv2.CV_64F, 1, 0, ksize=3)
        sobel_y = cv2.Sobel(processed, cv2.CV_64F, 0, 1, ksize=3)
        processed = np.sqrt(sobel_x**2 + sobel_y**2)
    
    if preprocessing_options['perspective_correction']:
        # Detect corners for perspective correction
        corners = cv2.goodFeaturesToTrack(
            processed.astype(np.uint8),
            25,
            0.01,
            10
        )
        
        if corners is not None and len(corners) >= 4:
            # Find the extreme corners
            corners = np.int0(corners)
            corners = corners.reshape(-1, 2)
            
            # Get bounding rectangle
            rect = np.zeros((4, 2), dtype=np.float32)
            rect[0] = corners[np.argmin(corners.sum(axis=1))]  # Top-left
            rect[2] = corners[np.argmax(corners.sum(axis=1))]  # Bottom-right
            rect[1] = corners[np.argmin(np.diff(corners, axis=1))]  # Top-right
            rect[3] = corners[np.argmax(np.diff(corners, axis=1))]  # Bottom-left
            
            # Get width and height for the new image
            width = max(
                np.linalg.norm(rect[0] - rect[1]),
                np.linalg.norm(rect[2] - rect[3])
            )
            height = max(
                np.linalg.norm(rect[0] - rect[3]),
                np.linalg.norm(rect[1] - rect[2])
            )
            
            # Define destination points
            dst = np.float32([[0, 0], [width-1, 0], 
                            [width-1, height-1], [0, height-1]])
            
            # Get perspective transform matrix
            matrix = cv2.getPerspectiveTransform(rect, dst)
            
            # Apply perspective transformation
            processed = cv2.warpPerspective(processed, matrix, (int(width), int(height)))
    
    # Normalize to 0-255 range
    processed = ((processed - np.min(processed)) * 255 / 
                (np.max(processed) - np.min(processed))).astype(np.uint8)
    
    return processed

def visualize_preprocessing_steps(original, processed):
    """
    Visualize the effects of preprocessing steps
    """
    plt.figure(figsize=(15, 10))
    
    # Original image
    plt.subplot(2, 3, 1)
    plt.imshow(original, cmap='gray')
    plt.title('Original Image')
    
    # Processed image
    plt.subplot(2, 3, 2)
    plt.imshow(processed, cmap='gray')
    plt.title('Processed Image')
    
    # Histogram of original image
    plt.subplot(2, 3, 3)
    plt.hist(original.ravel(), 256, [0, 256])
    plt.title('Original Histogram')
    
    # Histogram of processed image
    plt.subplot(2, 3, 4)
    plt.hist(processed.ravel(), 256, [0, 256])
    plt.title('Processed Histogram')
    
    # Edge detection on original
    edges_original = cv2.Canny(original.astype(np.uint8), 100, 200)
    plt.subplot(2, 3, 5)
    plt.imshow(edges_original, cmap='gray')
    plt.title('Original Edges')
    
    # Edge detection on processed
    edges_processed = cv2.Canny(processed, 100, 200)
    plt.subplot(2, 3, 6)
    plt.imshow(edges_processed, cmap='gray')
    plt.title('Processed Edges')
    
    plt.tight_layout()
    plt.show()


def auto_tune_threshold(edge_magnitude, min_grid_size=20, threshold_range=np.arange(0.45, 0.95, 0.05)):
    """
    Automatically find the best threshold value by analyzing the consistency of detected grid lines.
    """
    best_score = -1
    best_threshold = 0.7  # default fallback
    best_row_lines = []
    best_col_lines = []

    row_sums = np.sum(edge_magnitude, axis=1)
    col_sums = np.sum(edge_magnitude, axis=0)
    
    # Normalize sums
    row_sums = (row_sums - np.min(row_sums)) / (np.max(row_sums) - np.min(row_sums))
    col_sums = (col_sums - np.min(col_sums)) / (np.max(col_sums) - np.min(col_sums))
    
    window = min_grid_size // 2

    for threshold in threshold_range:
        row_peaks = []
        col_peaks = []
        
        # Find row peaks
        for i in range(window, len(row_sums) - window):
            if row_sums[i] > threshold:
                if row_sums[i] == max(row_sums[i-window:i+window]):
                    row_peaks.append(i)
        
        # Find column peaks
        for i in range(window, len(col_sums) - window):
            if col_sums[i] > threshold:
                if col_sums[i] == max(col_sums[i-window:i+window]):
                    col_peaks.append(i)

        if len(row_peaks) < 2 or len(col_peaks) < 2:
            continue

        # Calculate spacings
        row_spacings = np.diff(row_peaks)
        col_spacings = np.diff(col_peaks)
        
        # Score based on spacing consistency and number of detected lines
        if len(row_spacings) > 0 and len(col_spacings) > 0:
            row_consistency = 1 / (np.std(row_spacings) + 1)
            col_consistency = 1 / (np.std(col_spacings) + 1)
            
            # Calculate average spacing
            avg_row_spacing = np.mean(row_spacings)
            avg_col_spacing = np.mean(col_spacings)
            
            # Penalize if spacing is too small
            if avg_row_spacing < min_grid_size or avg_col_spacing < min_grid_size:
                continue
                
            # Score based on consistency and number of lines detected
            score = (row_consistency + col_consistency) * (len(row_peaks) + len(col_peaks))
            
            if score > best_score:
                best_score = score
                best_threshold = threshold
                best_row_lines = row_peaks
                best_col_lines = col_peaks

    return best_threshold, best_row_lines, best_col_lines

def find_grid_spacing(image_array, min_grid_size=20):
    """
    Detects grid spacing with preprocessing steps
    """
    # Apply preprocessing
    preprocessing_options = {
        'contrast_enhancement': True,
        'noise_reduction': True,
        'adaptive_threshold': True,
        'edge_enhancement': True,
        'perspective_correction': False,  # Enable if maps are photographed at an angle
        'histogram_equalization': True
    }
    
    processed_image = preprocess_image(image_array, preprocessing_options)

    # Normalize the image array
    normalized = (processed_image - np.min(processed_image)) / (np.max(processed_image) - np.min(processed_image))
    
    # Calculate gradients to detect edges
    gradient_y = np.gradient(normalized, axis=0)
    gradient_x = np.gradient(normalized, axis=1)
    
    # Calculate magnitude of gradients
    edge_magnitude = np.sqrt(gradient_x**2 + gradient_y**2)
    
    # Auto-tune threshold
    threshold_ratio, row_lines, col_lines = auto_tune_threshold(edge_magnitude, min_grid_size)
    
    # Convert to numpy arrays
    row_lines = np.array(row_lines)
    col_lines = np.array(col_lines)
    
    # Calculate spacings
    row_spacings = np.diff(row_lines)
    col_spacings = np.diff(col_lines)
    
    # Filter out outliers
    if len(row_spacings) > 0:
        row_spacing = np.median(row_spacings[row_spacings > min_grid_size])
    else:
        row_spacing = processed_image.shape[0]
        
    if len(col_spacings) > 0:
        col_spacing = np.median(col_spacings[col_spacings > min_grid_size])
    else:
        col_spacing = processed_image.shape[1]
    
    # Calculate number of squares
    num_rows = max(1, int(processed_image.shape[0] / row_spacing)) if row_spacing > 0 else 1
    num_cols = max(1, int(processed_image.shape[1] / col_spacing)) if col_spacing > 0 else 1
    
    # Only plot if specified on the command line
    if len(sys.argv) > 2 and sys.argv[2] == '--plot':
        visualize_preprocessing_steps(image_array, processed_image)
    
    
    return row_spacing, col_spacing, row_lines, col_lines, num_rows, num_cols


# Load and process the image
image_path = sys.argv[1]  # Replace with your image path
image = Image.open(image_path).convert("L")
image_data = np.array(image)

# Find grid spacing with auto-tuned threshold
row_spacing, col_spacing, row_lines, col_lines, num_rows, num_cols = find_grid_spacing(
    image_data,
    min_grid_size=20     # Minimum expected grid size in pixels
)


# Output results
print(f"Grid square size (height): {row_spacing:.2f} pixels")
print(f"Grid square size (width): {col_spacing:.2f} pixels")
print(f"Number of grid squares high: {num_rows}")
print(f"Number of grid squares wide: {num_cols}")
