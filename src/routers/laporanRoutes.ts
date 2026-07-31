import { Router } from "express";
import { getLaporanController, getLaporanPembelianController } from "../controllers/laporanController";

const laporanRouter = Router();

laporanRouter.post('/get-laporan', getLaporanController);
laporanRouter.post('/get-laporan-pembelian', getLaporanPembelianController);

export default laporanRouter;