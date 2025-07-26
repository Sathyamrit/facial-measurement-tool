import React, { useState, useRef } from 'react'
import './Home.css'; 

const Home = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [image, setImage] = useState(null);
  const [points, setPoints] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          stopCamera();
          setImage(img);
          drawImageOnCanvas(img);
          runDetection(img);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const drawImageOnCanvas = (img) => {
  const canvas = canvasRef.current;
  if (canvas) {
    const ctx = canvas.getContext('2d');
    // Resize canvas to match image size
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  }
  };

  const startCamera = () => {
    setIsCameraEnabled(true);
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error("Error accessing camera: ", err);
        setIsCameraEnabled(false);
        setErrorMessage("Could not access camera. Please check permissions.");
      });
  };

  const stopCamera = () => {
    setIsCameraEnabled(false);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const captureFromCamera = () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        
        //click to capture the current frame from the video
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        // Create a new image from the captured frame
        const img = new Image();
        img.onload = () => {
            stopCamera();
            setImage(img);
            drawImageOnCanvas(img);
            runDetection(img);
        };
        img.src = tempCanvas.toDataURL('image/png');
  };

  const resetApp = () => {
    setImage(null);
    setPoints([]);
    setErrorMessage('');
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className='homepage'>
      <header>
        <h1>Welcome to the Facial Measurement Tool</h1>
        <p>This tool helps you measure facial features</p>
      </header>

      <div className='home-actions'>
        <input type="file" accept="image/*" className='hidden-input' ref ={fileInputRef} onChange={handleImageUpload}/>
        <button onClick={() => fileInputRef.current.click()}>
          Upload Image
        </button>
        
        {isCameraEnabled ? (
          <button onClick={stopCamera}>Turn Off Camera</button>
        ) : (
          <button onClick={startCamera}>Turn On Camera</button>
        )}

        <button onClick={resetApp}>Clear Image</button>
      </div>

      <div className='home-content'>
        <div className='camera-section'>
          {!image && !isCameraEnabled && (
            <p>Upload an image or turn on the camera to start.</p>
          )}
          {isCameraEnabled && (
            <div className='camera-container'>
              <div className='video-wrapper'>
                <video ref={videoRef} autoPlay playsInline />
              </div>
              <button
                onClick={captureFromCamera}
                disabled={isLoading}>
                  Capture
              </button>
            </div>
            )}
            
            {image && (
              <div className='canvas-wrapper'>
                <canvas ref={canvasRef} className='camera-canvas' />
              </div>
            )}
        </div>
      </div>
    </div>
  )
}

export default Home