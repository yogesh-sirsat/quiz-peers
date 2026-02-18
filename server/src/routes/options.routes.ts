import { Router } from "express";
import {
  updateOption,
  deleteOption
} from "../controllers/options.controller.ts";

const router = Router();

router.patch("/:optionId", updateOption);
router.delete("/:optionId", deleteOption);

export default router;
