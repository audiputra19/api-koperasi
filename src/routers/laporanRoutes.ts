import { Router } from "express";
import { getLaporanController } from "../controllers/laporanController";

const laporanRouter = Router();

laporanRouter.post('/get-laporan', getLaporanController);

export default laporanRouter;