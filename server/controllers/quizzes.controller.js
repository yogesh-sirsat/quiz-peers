import { getAllQuizzesData, getQuizByIdData } from "../models/quiz.models.js";

export async function getAllQuizzes(req, res, next) {
  try {
    const data = await getAllQuizzesData();
    res.send(data);
  } catch (error) {
    next(error);
  }
}

export async function getQuizById(req, res, next) {
  try {
    const { quizId } = req.params;
    const data = await getQuizByIdData(quizId);
    res.send(data);
  } catch (error) {
    next(error);
  }
}
