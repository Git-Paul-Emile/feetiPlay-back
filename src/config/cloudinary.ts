import { v2 as cloudinary } from "cloudinary";

// Parse CLOUDINARY_URL = cloudinary://api_key:api_secret@cloud_name
const cloudinaryUrl = process.env.CLOUDINARY_URL ?? "";
const match = cloudinaryUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);

if (match) {
  cloudinary.config({
    api_key:    match[1],
    api_secret: match[2],
    cloud_name: match[3],
  });
} else {
  console.warn("[cloudinary] CLOUDINARY_URL manquante ou invalide");
}

export { cloudinary };
