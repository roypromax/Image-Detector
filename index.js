// Event listeners for start and stop buttons
document.getElementById("startButton").addEventListener("click", init);
document.getElementById("stopButton").addEventListener("click", stop);

// Teachable Machine model URL
const URL = "https://teachablemachine.withgoogle.com/models/8oyQv2ekf/";

let model, webcam, labelContainer, maxPredictions;
let isRunning = false;
let isIos = false;

// Check if running on iOS
if (
  window.navigator.userAgent.indexOf("iPhone") > -1 ||
  window.navigator.userAgent.indexOf("iPad") > -1
) {
  isIos = true;
}

// Function to initialize the app
async function init() {
  const loadingIndicator = document.getElementById("loading-indicator");
  loadingIndicator.style.display = "block"; // Show loading indicator

  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  // Load the model and metadata
  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  const flip = true;
  const width = 300;
  const height = 200;
  webcam = new tmImage.Webcam(width, height, flip);
  await webcam.setup(); // Request access to the webcam

  // Setup webcam video element
  if (isIos) {
    const webcamVideoContainer = document.getElementById("webcam-video");
    webcamVideoContainer.appendChild(webcam.webcam); // Add webcam object to the container
    webcamVideoElement = webcam.webcam; // Store the webcam video element

    const webCamVideo = document.getElementsByTagName("video")[0];
    webCamVideo.setAttribute("playsinline", true); // Set playsinline attribute for iOS
    webCamVideo.muted = "true";
    webCamVideo.style.width = width + "px";
    webCamVideo.style.height = height + "px";
  } else {
    document.getElementById("webcam-video").appendChild(webcam.canvas); // Add webcam canvas to the container
  }

  // Setup label container
  labelContainer = document.getElementById("label-container");
  for (let i = 0; i < maxPredictions; i++) {
    labelContainer.appendChild(document.createElement("div")); // Create divs for displaying class labels
  }

  // Start webcam and prediction loop
  webcam.play();
  window.requestAnimationFrame(loop);

  loadingIndicator.style.display = "none"; // Hide loading indicator

  // Disable start button and enable stop button
  document.getElementById("stopButton").disabled = false;
  document.getElementById("startButton").disabled = true;

  isRunning = true; // Update app state
}

// Function to stop the app
function stop() {
  webcam.stop(); // Stop the webcam
  document.getElementById("stopButton").disabled = true; // Disable the stop button
  document.getElementById("startButton").disabled = false; // Enable the start button
  labelContainer.innerHTML = ""; // Clear label container

  // Remove webcam video element
  if (isIos) {
    const webcamVideoContainer = document.getElementById("webcam-video");
    webcamVideoContainer.removeChild(webcamVideoElement);
  } else {
    const webcamContainer = document.getElementById("webcam-video");
    webcamContainer.removeChild(webcam.canvas);
  }

  isRunning = false; // Update app state
}

// Prediction loop
async function loop() {
  if (!isRunning) {
    const loadingIndicator = document.getElementById("loading-indicator");
    loadingIndicator.style.display = "none"; // Hide loading indicator
    return; // Exit the loop if the app is not running
  }

  webcam.update(); // Update the webcam frame
  await predict(); // Run prediction
  window.requestAnimationFrame(loop);
}

// Function to run the webcam image through the image model and display predictions
async function predict() {
  let prediction;
  if (isIos) {
    prediction = await model.predict(webcam.webcam);
  } else {
    prediction = await model.predict(webcam.canvas);
  }

  for (let i = 0; i < maxPredictions; i++) {
    const classPrediction =
      prediction[i].className +
      ": " +
      (prediction[i].probability * 100).toFixed(2) +
      "%";

    // Display class prediction and assign ID based on probability threshold
    labelContainer.childNodes[i].innerHTML = classPrediction;
    labelContainer.childNodes[i].setAttribute(
      "id",
      +classPrediction.split(" ")[1].split(".")[0] >= 75
        ? "maxLabel"
        : "normalLabel"
    );
  }
}