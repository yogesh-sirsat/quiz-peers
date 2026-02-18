import { Request, Response, NextFunction } from "express";
import { uploadToR2 } from "../utils/s3.utils.ts";
import { nanoid } from "nanoid";
import HttpAppError from "../errors/app.error.ts";

export async function uploadMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      throw new HttpAppError("No file uploaded", 400);
    }

    const file = req.file;
    const { folder = "misc" } = req.query; // Allow passing context like 'quizzes', 'questions', etc.
    
    const extension = file.originalname.split(".").pop();
    const uniqueId = nanoid();
    const typeFolder = file.mimetype.startsWith("image/") ? "images" : file.mimetype.startsWith("audio/") ? "audio" : "others";
    
    // Organized path: type/context/YYYY-MM/unique-name.ext
    const datePath = new Date().toISOString().slice(0, 7); // YYYY-MM
    const fileName = `${typeFolder}/${folder}/${datePath}/${uniqueId}.${extension}`;
    
    const publicUrl = await uploadToR2(file.buffer, fileName, file.mimetype);
    
    res.status(201).json({
      url: publicUrl,
      fileName: fileName
    });
  } catch (error) {
    next(error);
  }
}
