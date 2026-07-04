import { Router } from "express";
import {
  getAllQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizQuestions,
  getAllCategories
} from "../controllers/quizzes.controller";
import { addQuestionToQuiz, removeQuestionFromQuiz } from "../controllers/questions.controller";

const router = Router();

router.get("/", getAllQuizzes);
router.get("/get-all-quizzes", getAllQuizzes);
router.post("/", createQuiz);
router.get("/:quizId", getQuizById);
router.patch("/:quizId", updateQuiz);
router.delete("/:quizId", deleteQuiz);
router.get("/:quizId/get-questions", getQuizQuestions);
router.get("/categories/all", getAllCategories);

// Relationship routes
router.post("/:quizId/questions", addQuestionToQuiz);
router.delete("/:quizId/questions/:questionId", removeQuestionFromQuiz);

export default router;

