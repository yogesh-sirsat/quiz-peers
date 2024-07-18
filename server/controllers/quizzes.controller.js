import { getAllQuizzesData, getQuizByIdData } from "../models/quiz.models.js";

export async function getAllQuizzes(req, res) {
  try {
    const data = await getAllQuizzesData();
    res.send(data);
  } catch (error) {
    res.send(error);
  }
}

export async function getQuizById(req, res) {
  try {
    const { quizId } = req.params;
    const data = await getQuizByIdData(quizId);
    res.send(data);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}
