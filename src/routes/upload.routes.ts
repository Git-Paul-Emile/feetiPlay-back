import { Router, type Request, type Response } from "express";
import multer from "multer";
import { cloudinary } from "../config/cloudinary.js";
import { authenticate } from "../middlewares/authenticate.js";
import { AppError } from "../utils/AppError.js";
import { StatusCodes } from "http-status-codes";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Seules les images sont acceptées"));
    }
    cb(null, true);
  },
});

router.post("/image", authenticate, upload.single("image"), async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError("Aucun fichier fourni", StatusCodes.BAD_REQUEST);
  }

  const folder = (req.query.folder as string) || "feetiplay";

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Upload échoué"));
        resolve(result);
      }
    );
    stream.end(req.file!.buffer);
  });

  res.json({ url: result.secure_url });
});

export default router;
