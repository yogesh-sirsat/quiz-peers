import { Request, Response, NextFunction } from "express";
import { getAllQuizzesData, getQuizByIdData, createQuizData, updateQuizData, deleteQuizData, getQuizQuestionsForPlay, getAllCategoriesData } from "../models/quiz.models.ts";
import HttpAppError from "../errors/app.error.ts";

export async function getAllQuizzes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { onlyValid, includeTesting } = req.query;
    const data = await getAllQuizzesData(onlyValid !== "false", includeTesting === "true");
    res.send(data);
  } catch (error) {
    next(error);
  }
}

export async function getQuizById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { quizId } = req.params;
    const data = await getQuizByIdData(Number(quizId));
    if (!data) {
      throw new HttpAppError("Quiz not found", 404);
    }
    res.send(data);
  } catch (error) {
    next(error);
  }
}

export async function createQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { quizName, description, coverImageUrl, status } = req.body;
    if (!quizName) {
      throw new HttpAppError("Quiz name is required", 400);
    }
    const data = await createQuizData({ quizName, description, coverImageUrl, status });
    res.status(201).send(data);
  } catch (error) {
    next(error);
  }
}

export async function updateQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { quizId } = req.params;
    const { quizName, description, coverImageUrl, status } = req.body;
    const data = await updateQuizData(Number(quizId), { quizName, description, coverImageUrl, status });
    if (!data) {
      throw new HttpAppError("Quiz not found", 404);
    }
    res.send(data);
  } catch (error) {
    next(error);
  }
}

export async function deleteQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { quizId } = req.params;
    const { deleteQuestions } = req.query;
    const success = await deleteQuizData(Number(quizId), deleteQuestions === "true");
    if (!success) {
      throw new HttpAppError("Quiz not found", 404);
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function getQuizQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { quizId } = req.params;
    const data = await getQuizQuestionsForPlay(Number(quizId));
    res.send(data);
  } catch (error) {
    next(error);
  }
}

export async function getAllCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await getAllCategoriesData();
    res.send(data);
  } catch (error) {
    next(error);
  }
}
