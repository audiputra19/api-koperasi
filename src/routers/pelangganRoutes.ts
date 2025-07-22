import { Router } from "express";
import { getPelangganController, inputPelangganController, searchPelangganController } from "../controllers/pelangganController";

const pelangganRouter = Router();

pelangganRouter.post("/get-pelanggan", getPelangganController);
pelangganRouter.post("/input-pelanggan", inputPelangganController);
pelangganRouter.get("/search-pelanggan", searchPelangganController);

export default pelangganRouter;