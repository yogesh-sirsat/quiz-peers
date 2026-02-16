import {
  createOptionData,
  getOptionsByQuestionIdData,
  updateOptionData,
  deleteOptionData,
  getOptionByIdData
} from "../models/options.models.js";
import HttpAppError from "../errors/app.error.js";

export async function createOption(req, res, next) {
  try {
    const { questionId } = req.params;
    const { optionText, imageUrl, audioUrl } = req.body;
    if (!optionText) {
      throw new HttpAppError("Option text is required", 400);
    }
    const data = await createOptionData({ questionId, optionText, imageUrl, audioUrl });
    res.status(201).send(data);
  } catch (error) {
    next(error);
  }
}

export async function getOptionsByQuestionId(req, res, next) {
  try {
    const { questionId } = req.params;
    const data = await getOptionsByQuestionIdData(questionId);
    res.send(data);
  } catch (error) {
    next(error);
  }
}

export async function updateOption(req, res, next) {
  try {
    const { optionId } = req.params;
    const { optionText, imageUrl, audioUrl } = req.body;
    const data = await updateOptionData(optionId, { optionText, imageUrl, audioUrl });
    if (!data) {
      throw new HttpAppError("Option not found", 404);
    }
    res.send(data);
  } catch (error) {
    next(error);
  }
}

export async function deleteOption(req, res, next) {
  try {
    const { optionId } = req.params;
    const success = await deleteOptionData(optionId);
    if (!success) {
      throw new HttpAppError("Option not found", 404);
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
