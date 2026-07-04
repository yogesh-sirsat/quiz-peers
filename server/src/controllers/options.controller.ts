import { Request, Response, NextFunction } from "express";
import {
  createOptionData,
  getOptionsByQuestionIdData,
  updateOptionData,
  deleteOptionData,
} from "../models/options.models";
import HttpAppError from "../errors/app.error";

export async function createOption(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { questionId } = req.params;
    const { optionText, imageUrl, audioUrl } = req.body;
    if (!optionText) {
      throw new HttpAppError("Option text is required", 400);
    }
    const data = await createOptionData({ questionId: Number(questionId), optionText, imageUrl, audioUrl });
    res.status(201).send(data);
  } catch (error) {
    next(error);
  }
}

export async function getOptionsByQuestionId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { questionId } = req.params;
    const data = await getOptionsByQuestionIdData(Number(questionId));
    res.send(data);
  } catch (error) {
    next(error);
  }
}

export async function updateOption(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { optionId } = req.params;
    const { optionText, imageUrl, audioUrl } = req.body;
    const data = await updateOptionData(Number(optionId), { optionText, imageUrl, audioUrl });
    if (!data) {
      throw new HttpAppError("Option not found", 404);
    }
    res.send(data);
  } catch (error) {
    next(error);
  }
}

export async function deleteOption(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { optionId } = req.params;
    const success = await deleteOptionData(Number(optionId));
    if (!success) {
      throw new HttpAppError("Option not found", 404);
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

