import {
  createQuestionData,
  getQuestionByIdData,
  getAllQuestionsData,
  updateQuestionData,
  deleteQuestionData,
  addQuestionToQuizData,
  removeQuestionFromQuizData,
  setCorrectOptionData
} from "../models/questions.models.js";
import { getOptionByIdData } from "../models/options.models.js";
import HttpAppError from "../errors/app.error.js";

export async function createQuestion(req, res, next) {
  try {
    const { questionText, categoryId, imageUrl, audioUrl, difficulty, quizId } = req.body;
    if (!questionText) {
      throw new HttpAppError("Question text is required", 400);
    }
    const data = await createQuestionData({ questionText, categoryId, imageUrl, audioUrl, difficulty });
    
    if (quizId) {
      await addQuestionToQuizData(quizId, data.question_id);
    }
    
    res.status(201).send(data);
  } catch (error) {
    next(error);
  }
}

export async function getQuestionById(req, res, next) {
  try {
    const { questionId } = req.params;
    const data = await getQuestionByIdData(questionId);
    if (!data) {
      throw new HttpAppError("Question not found", 404);
    }
    res.send(data);
  } catch (error) {
    next(error);
  }
}

export async function getAllQuestions(req, res, next) {
  try {
    const data = await getAllQuestionsData();
    res.send(data);
  } catch (error) {
    next(error);
  }
}

export async function updateQuestion(req, res, next) {
  try {
    const { questionId } = req.params;
    const { questionText, categoryId, imageUrl, audioUrl, difficulty } = req.body;
    const data = await updateQuestionData(questionId, { questionText, categoryId, imageUrl, audioUrl, difficulty });
    if (!data) {
      throw new HttpAppError("Question not found", 404);
    }
    res.send(data);
  } catch (error) {
    next(error);
  }
}

export async function deleteQuestion(req, res, next) {
  try {
    const { questionId } = req.params;
    const success = await deleteQuestionData(questionId);
    if (!success) {
      throw new HttpAppError("Question not found", 404);
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function addQuestionToQuiz(req, res, next) {
  try {
    const { quizId } = req.params;
    const { questionId } = req.body;
    if (!questionId) {
      throw new HttpAppError("Question ID is required", 400);
    }
    await addQuestionToQuizData(quizId, questionId);
    res.status(200).send({ message: "Question added to quiz" });
  } catch (error) {
    next(error);
  }
}

export async function removeQuestionFromQuiz(req, res, next) {
  try {
    const { quizId, questionId } = req.params;
    const success = await removeQuestionFromQuizData(quizId, questionId);
    if (!success) {
      throw new HttpAppError("Relationship not found", 404);
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function setCorrectOption(req, res, next) {
  try {
    const { questionId } = req.params;
    const { optionId } = req.body;
    if (!optionId) {
      throw new HttpAppError("Option ID is required", 400);
    }

    const option = await getOptionByIdData(optionId);
    if (!option || option.question_id !== parseInt(questionId)) {
      throw new HttpAppError("Option does not belong to this question", 400);
    }

    await setCorrectOptionData(questionId, optionId);
    res.status(200).send({ message: "Correct option set" });
  } catch (error) {
    next(error);
  }
}
