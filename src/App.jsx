import { useState, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyAxvALcPFqQW5iaYtM7X5NhzCg6WBRiTZ8"; // Replace 'YOUR_API_KEY' with your actual API key

const GoogleGenerativeComponent = () => {
  const prompt =
    "Give answer in object form  like this {object:  , nature: this contain is the object good , or bad for enviornment , carbonFootprint: ,suggestion: },fist object key is object then second object key is harmfull ,third key is co2 which have anser to carbon footprint per year with proper unit and last key suggestion which have answer to any suggestion(if there is person on image then give human answer only)";

  const [generatedText, setGeneratedText] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const genAI = new GoogleGenerativeAI(API_KEY);

  const fileToGenerativePart = async (file) => {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: {
        data: await base64EncodedDataPromise,
        mimeType: file.type,
      },
    };
  };

  const handleFileInputChange = async (event) => {
    const files = event.target.files;
    setUploadedImages(Array.from(files)); // Store uploaded images for display or further processing
  };

  const handleStartCamera = () => {
    const constraints = {
      video: {
        // facingMode: { exact: "environment" }, // Use the rear camera
        facingMode: "user",
      },
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        videoRef.current.srcObject = stream;
        mediaStreamRef.current = stream;
      })
      .catch((error) => console.error("Error accessing camera:", error));
  };
  const handleCaptureImage = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas
      .getContext("2d")
      .drawImage(
        videoRef.current,
        0,
        0,
        videoRef.current.videoWidth,
        videoRef.current.videoHeight
      );
    canvas.toBlob((blob) => {
      const file = new File([blob], "captured-image.png", {
        type: "image/png",
        lastModified: Date.now(),
      });
      setUploadedImages([file]);
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }, "image/png");
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const imageParts = await Promise.all(
      uploadedImages.map(fileToGenerativePart)
    );
    generateContent(imageParts);
  };

  const generateContent = async (imageParts) => {
    // For text-and-images input (multimodal), use the gemini-pro-vision model
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = await response.text();
    setGeneratedText(text);
    setIsLoading(false);
  };

  return (
    <div>
      <h1>Carbon Footprint Tracker</h1>
      <div className="camera-container">
        <video
          ref={videoRef}
          className="camera-preview"
          autoPlay
          playsInline
          muted
        ></video>
        <div className="camera-buttons">
          <button onClick={handleStartCamera}>Start Camera</button>
          <button onClick={handleCaptureImage}>Capture Image</button>
        </div>
      </div>
      <input type="file" multiple onChange={handleFileInputChange} />
      <button onClick={handleSubmit}>Submit Images</button>
      <div>
        {isLoading && <p>Loading...</p>}
        {!isLoading &&
          uploadedImages.map((image, index) => (
            <img
              key={index}
              src={URL.createObjectURL(image)}
              alt={`Uploaded ${index}`}
              style={{ maxWidth: "200px", maxHeight: "200px", margin: "5px" }}
            />
          ))}
      </div>
      {generatedText && (
        <div>
          <h2>Generated Text:</h2>
          <p>{generatedText}</p>
        </div>
      )}
    </div>
  );
};

export default GoogleGenerativeComponent;
