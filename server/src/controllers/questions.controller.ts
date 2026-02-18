import { Request, Response, NextFunction } from "express";
import {
  createQuestionData,
  getQuestionByIdData,
  getAllQuestionsData,
  updateQuestionData,
  deleteQuestionData,
  addQuestionToQuizData,
  removeQuestionFromQuizData,
  setCorrectOptionData
} from "../models/questions.models.ts";
import { getOptionByIdData } from "../models/options.models.ts";
import HttpAppError from "../errors/app.error.ts";

export async function createQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { questionText, categoryId, imageUrl, audioUrl, difficulty, quizId } = req.body;
    if (!questionText) {
      throw new HttpAppError("Question text is required", 400);
    }
    const data = await createQuestionData({ questionText, categoryId, imageUrl, audioUrl, difficulty });
    
    if (quizId) {
      await addQuestionToQuizData(Number(quizId), data.questionId);
    }
    
    res.status(201).send(data);
  } catch (error) {
    next(error);
  }
}

export async function getQuestionById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { questionId } = req.params;
    const data = await getQuestionByIdData(Number(questionId));
    if (!data) {
      throw new HttpAppError("Question not found", 404);
    }
    res.send(data);
  } catch (error) {
    next(error);
  }
}

export async function getAllQuestions(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await getAllQuestionsData();
    res.send(data);
  } catch (error) {
    next(error);
  }
}

export async function updateQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { questionId } = req.params;
    const { questionText, categoryId, imageUrl, audioUrl, difficulty } = req.body;
    const data = await updateQuestionData(Number(questionId), { questionText, categoryId, imageUrl, audioUrl, difficulty });
    if (!data) {
      throw new HttpAppError("Question not found", 404);
    }
    res.send(data);
  } catch (error) {
    next(error);
  }
}

export async function deleteQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { questionId } = req.params;
    const success = await deleteQuestionData(Number(questionId));
    if (!success) {
      throw new HttpAppError("Question not found", 404);
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function addQuestionToQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { quizId } = req.params;
    const { questionId } = req.body;
    if (!questionId) {
      throw new HttpAppError("Question ID is required", 400);
    }
    await addQuestionToQuizData(Number(quizId), Number(questionId));
    res.status(200).send({ message: "Question added to quiz" });
  } catch (error) {
    next(error);
  }
}

export async function removeQuestionFromQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { quizId, questionId } = req.params;
    const success = await removeQuestionFromQuizData(Number(quizId), Number(questionId));
    if (!success) {
      throw new HttpAppError("Relationship not found", 404);
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function setCorrectOption(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { questionId } = req.params;
    const { optionId } = req.body;
    if (!optionId) {
      throw new HttpAppError("Option ID is required", 400);
    }

    const option = await getOptionByIdData(Number(optionId));
    if (!option || Number(option.questionId) !== Number(questionId)) {
      throw new HttpAppError("Option does not belong to this question", 400);
    }

    await setCorrectOptionData(Number(questionId), Number(optionId));
    res.status(200).send({ message: "Correct option set" });
  } catch (error) {
    next(error);
  }
}
