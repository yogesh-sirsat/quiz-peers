import { Router } from "express";
import {
  getAllQuizzes,
  getQuizById,
} from "../controllers/quizzes.controller.js";

const router = Router();

router.get("/get-all-quizzes", getAllQuizzes);
router.get("/:quizId", getQuizById);

export default router;
