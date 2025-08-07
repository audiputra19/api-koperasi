import { Router } from "express";
import { getHakAksesController, updateHakAksesController } from "../controllers/hakAksesController";

const hakAksesRouter = Router();

hakAksesRouter.post('/get-Akses', getHakAksesController);
hakAksesRouter.patch('/update-akses/:id', updateHakAksesController);

export default hakAksesRouter;