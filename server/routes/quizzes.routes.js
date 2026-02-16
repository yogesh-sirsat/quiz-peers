import { Router } from "express";
import {
  getAllQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz
} from "../controllers/quizzes.controller.js";
import { addQuestionToQuiz, removeQuestionFromQuiz } from "../controllers/questions.controller.js";

const router = Router();

router.get("/", getAllQuizzes);
router.get("/get-all-quizzes", getAllQuizzes);
router.post("/", createQuiz);
router.get("/:quizId", getQuizById);
router.patch("/:quizId", updateQuiz);
router.delete("/:quizId", deleteQuiz);

// Relationship routes
router.post("/:quizId/questions", addQuestionToQuiz);
router.delete("/:quizId/questions/:questionId", removeQuestionFromQuiz);

export default router;
