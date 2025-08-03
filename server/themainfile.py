import cv2
import numpy as np
import mediapipe as mp
import math
import io
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ------------------ FastAPI App Setup ------------------

app = FastAPI()

# Add CORS middleware to allow requests from your frontend
# This is crucial for frontend-backend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins, you can restrict this to your frontend's URL in production
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# ------------------ MediaPipe and Constants Setup ------------------

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=True,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5
)

# Landmark indices for facial features
left_eye_outer = 33
left_eye_inner = 133
right_eye_outer = 362
right_eye_inner = 263
nose_left = 129
nose_right = 358
mouth_left = 61
mouth_right = 291

# Golden ratio constant
golden_ratio = 1.618

# ------------------ Pydantic Models for Response ------------------

# Define the structure of the JSON response for type safety and documentation
class FaceMetrics(BaseModel):
    dist_left_eye: float
    dist_right_eye: float
    dist_nose: float
    dist_lips: float
    avg_eye_distance: float
    ratio_eye_nose: float
    ratio_lip_nose: float
    golden_ratio_eye_nose_comparison: float
    golden_ratio_lip_nose_comparison: float

# ------------------ Core Processing Functions ------------------

def calculate_distance(lm1, lm2, width, height):
    """Calculates the euclidean distance between two landmarks."""
    x1, y1 = lm1.x * width, lm1.y * height
    x2, y2 = lm2.x * width, lm2.y * height
    return math.hypot(x2 - x1, y2 - y1)

def analyze_face_from_image_bytes(image_bytes: bytes):
    """
    Takes image bytes, processes them with MediaPipe, and returns calculated metrics.
    """
    # Convert image bytes to a numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    # Decode the image array into an OpenCV image
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        return None

    height, width, _ = image.shape
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_image)

    if not results.multi_face_landmarks:
        return None  # No face detected

    landmarks = results.multi_face_landmarks[0].landmark

    # Distance calculations
    dist_left_eye = calculate_distance(landmarks[left_eye_outer], landmarks[left_eye_inner], width, height)
    dist_right_eye = calculate_distance(landmarks[right_eye_outer], landmarks[right_eye_inner], width, height)
    dist_nose = calculate_distance(landmarks[nose_left], landmarks[nose_right], width, height)
    dist_lips = calculate_distance(landmarks[mouth_left], landmarks[mouth_right], width, height)

    # Ratio calculations
    avg_eye_distance = (dist_left_eye + dist_right_eye) / 2
    ratio_eye_nose = avg_eye_distance / dist_nose if dist_nose != 0 else 0
    ratio_lip_nose = dist_lips / dist_nose if dist_nose != 0 else 0
    
    # Comparison with golden ratio
    golden_ratio_eye_nose_comparison = ratio_eye_nose / golden_ratio if golden_ratio != 0 else 0
    golden_ratio_lip_nose_comparison = ratio_lip_nose / golden_ratio if golden_ratio != 0 else 0

    # Return a dictionary with all the calculated values
    return {
        "dist_left_eye": dist_left_eye,
        "dist_right_eye": dist_right_eye,
        "dist_nose": dist_nose,
        "dist_lips": dist_lips,
        "avg_eye_distance": avg_eye_distance,
        "ratio_eye_nose": ratio_eye_nose,
        "ratio_lip_nose": ratio_lip_nose,
        "golden_ratio_eye_nose_comparison": golden_ratio_eye_nose_comparison,
        "golden_ratio_lip_nose_comparison": golden_ratio_lip_nose_comparison,
    }

# ------------------ API Endpoint ------------------

@app.post("/api/analyze", response_model=FaceMetrics)
async def analyze_image(file: UploadFile = File(...)):
    """
    This endpoint receives an image file, analyzes the facial features,
    and returns the calculated metrics as a JSON response.
    """
    # Read the contents of the uploaded file
    image_bytes = await file.read()
    
    # Process the image using the core logic
    metrics = analyze_face_from_image_bytes(image_bytes)
    
    if metrics is None:
        # Raise an HTTP exception if no face is detected or the image is invalid
        raise HTTPException(status_code=400, detail="Could not process image or no face detected.")
        
    return metrics
