import { Router } from "express";
import { deleteKasirController, deleteKasirDetailController, getKasirController, getKasirDetailController, inputKasirController, updateKasirController } from "../controllers/kasirController";

const kasirRouter = Router();

kasirRouter.post('/input-kasir', inputKasirController);
kasirRouter.post('/update-kasir', updateKasirController);
kasirRouter.post('/get-kasir', getKasirController);
kasirRouter.post('/get-kasirdetail', getKasirDetailController);
kasirRouter.post('/delete-kasir', deleteKasirController);
kasirRouter.post('/delete-kasirdetail', deleteKasirDetailController);

export default kasirRouter;