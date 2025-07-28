import { Router } from "express";
import { deletePembelianController, deletePembelianDetailController, getPembelianController, getPembelianDetailController, inputPembelianController, updatePembelianController } from "../controllers/pembelianController";

const PembelianRouter = Router();

PembelianRouter.post('/input-pembelian', inputPembelianController);
PembelianRouter.post('/update-pembelian', updatePembelianController);
PembelianRouter.post('/get-pembelian', getPembelianController);
PembelianRouter.post('/get-pembeliandetail', getPembelianDetailController);
PembelianRouter.post('/delete-pembelian', deletePembelianController);
PembelianRouter.post('/delete-pembeliandetail', deletePembelianDetailController);

export default PembelianRouter;