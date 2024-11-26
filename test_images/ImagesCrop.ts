const axios = require("axios");
const fs = require("fs");
const sharp = require("sharp");

const imagePath = "./test_images/bottles2.jpeg"; // Ensure this is the correct path

// Check if the file exists
if (!fs.existsSync(imagePath)) {
  console.error("Image file does not exist.");
  process.exit(1);
} else {
  console.log("Image file exists, proceeding with cropping...");
}

// Function to check the bounding box dimensions
const checkValidBoundingBox = (x, y, width, height) => {
  if (width <= 0 || height <= 0) {
    return false; // Invalid dimensions
  }
  return true;
};

// Function to process image and crop based on predictions
function processImage(predictions) {
  sharp(imagePath)
    .metadata()
    .then((metadata) => {
      const imageWidth = metadata.width;
      const imageHeight = metadata.height;

      predictions.forEach((prediction, index) => {
        const {x, y, width, height} = prediction;
        const integerX = Math.round(x - width / 2);
        const integerY = Math.round(y - height / 2);
        const integerWidth = Math.round(width);
        const integerHeight = Math.round(height);

        // Ensure the bounding box is within image dimensions
        if (integerX < 0 || integerY < 0 || integerX + integerWidth > imageWidth || integerY + integerHeight > imageHeight) {
          console.error(`Bounding box ${index + 1} is out of bounds.`);
          return;
        }

        // Check for invalid bounding box
        if (!checkValidBoundingBox(integerX, integerY, integerWidth, integerHeight)) {
          console.error(`Invalid bounding box at index ${index + 1}. Skipping crop.`);
          return;
        }

        // Crop and save the image
        sharp(imagePath)
          .extract({left: integerX, top: integerY, width: integerWidth, height: integerHeight})
          .toFormat("png")
          .toFile(`./test_images/output/output_bottle_${index + 1}.png`, (err, info) => {
            if (err) {
              console.error("Error cropping image:", err);
            } else {
              console.log(`Cropped image saved as output_bottle_${index + 1}.png`);
            }
          });
      });
    })
    .catch((err) => {
      console.error("Error reading image metadata:", err);
    });
}

// Get image and predictions from Roboflow API
const image = fs.readFileSync(imagePath, {encoding: "base64"});

axios({
  method: "POST",
  url: "https://outline.roboflow.com/wine-labels-segmentation-dpgxq/1",
  params: {
    api_key: process.env.ROBOFLOW_API_KEY,
    confidence: 75
  },
  data: image,
  headers: {"Content-Type": "application/x-www-form-urlencoded"},
})
  .then((response) => {
    const predictions = response.data.predictions;  // Assuming predictions are in this key
    processImage(predictions);  // Call the function to process the predictions
  })
  .catch((error) => {
    console.error("Error during API request:", error.message);
  });
