import { Router } from "express";
import {
  updateOption,
  deleteOption
} from "../controllers/options.controller";

const router = Router();

router.patch("/:optionId", updateOption);
router.delete("/:optionId", deleteOption);

export default router;

