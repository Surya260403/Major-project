import { config } from "dotenv";
config(); 

import app from "./app.js";
import { v2 as cloudinary } from "cloudinary";


if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error(" Cloudinary credentials are missing in .env file!");
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const PORT = process.env.PORT || 5000;


try {
  app.listen(PORT, () => {
    console.log(` Server listening on port ${PORT}`);
  });
} catch (error) {
  console.error(" Error starting server:", error);
}
