import { Router } from "express";
import { inputKasirController } from "../controllers/kasirController";

const kasirRouter = Router();

kasirRouter.post('/input-kasir', inputKasirController);

export default kasirRouter;