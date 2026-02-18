import { Router } from "express";
import {
  createQuestion,
  getQuestionById,
  getAllQuestions,
  updateQuestion,
  deleteQuestion,
  setCorrectOption
} from "../controllers/questions.controller.ts";
import {
  createOption,
  getOptionsByQuestionId
} from "../controllers/options.controller.ts";

const router = Router();

router.get("/", getAllQuestions);
router.post("/", createQuestion);
router.get("/:questionId", getQuestionById);
router.patch("/:questionId", updateQuestion);
router.delete("/:questionId", deleteQuestion);

// Relationship with options
router.get("/:questionId/options", getOptionsByQuestionId);
router.post("/:questionId/options", createOption);
router.put("/:questionId/correct-option", setCorrectOption);

export default router;
