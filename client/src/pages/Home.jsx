import React, { useState, useRef, useEffect } from 'react'
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

  useEffect(() => {
    if (image && canvasRef.current) {
      drawImageOnCanvas(image);
    }
  }, [image]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          stopCamera();
          setImage(img);
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
  
  async function getCameras() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    
    cameraSelect.innerHTML = '';
    videoDevices.forEach((device, index) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.label || `Camera ${index + 1}`;
    });
  }
  
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
    setIsCameraEnabled(false);
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
      canvas.width = 0;
      canvas.height = 0;
    }
  };

  async function sendToBackend() {
    const name = document.getElementById('nameInput').value;

    const res = await fetch('http://127.0.0.1:8000/api/greet',{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    document.getElementById('response').textContent = data.message;
  }

  async function analyseImage() {
    if (!image) {
      setErrorMessage('Please upload an image or capture from camera first.');
      return;
    }
    
  }





  return (
    <div className='homepage'>
      <header>
        <h1>Welcome to the Facial Measurement Tool</h1>
        <p>This tool helps you measure facial features</p>
      </header>
      
      <div className='greeting-section'>
        <input type="text" id="nameInput" placeholder="Enter your name" />
        <button onClick={sendToBackend}>Greet Me</button>
        <p id="response"></p>
      </div>

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
              {/* <select id="cameraSelect"></select> */}
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
                <button onClick={analyseImage}>Analyse</button>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}

export default Home;