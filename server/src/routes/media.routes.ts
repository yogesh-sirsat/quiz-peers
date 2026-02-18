import { Router } from "express";
import multer from "multer";
import { uploadMedia } from "../controllers/media.controller.ts";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

router.post("/upload", upload.single("file"), uploadMedia);

export default router;
