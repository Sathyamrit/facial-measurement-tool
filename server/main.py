from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
# Import the core analysis function from your new logic file
from face_measurement import analyze_face_from_image_bytes

app = FastAPI()

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],  # or ["http://localhost:3000"] for stricter control
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

@app.get("/")
async def root():
  return {"message": "Welcome to your Python Backend!"}

# No need for the StaticFiles or the catch-all route here.
# Vercel handles serving the frontend.
class NameRequest(BaseModel):
  name: str

@app.post("/api/greet")
async def greet_user(request: NameRequest):
  return {"message": f"Hello, {request.name}!"}


  
# ------------------ Pydantic Models for API Response ------------------

# Define the structure of the JSON response. This belongs in the web layer.
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

# ------------------ API Endpoint ------------------

@app.post("/api/analyze", response_model=FaceMetrics)
async def analyze_image(file: UploadFile = File(...)):
  """
  This endpoint receives an image file, calls the analysis function,
  and returns the calculated metrics as a JSON response.
  """
  # Read the contents of the uploaded file
  image_bytes = await file.read()
  
  # Call the processing function from the other file
  metrics = analyze_face_from_image_bytes(image_bytes)
  
  if metrics is None:
    # Raise an HTTP exception if no face is detected or the image is invalid
    raise HTTPException(status_code=400, detail="Could not process image or no face detected.")
      
  return metrics