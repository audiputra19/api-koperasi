// Sesuaikan lokasi file ini, misal: src/routes/son.routes.ts

import { Router } from "express";
import {
    inputSonController,
    getSonController,
    getSonDetailController,
    deleteSonController,
    editSonController,
} from "../controllers/sonController";

const sonRouter = Router();

sonRouter.post("/input-son", inputSonController);
sonRouter.post("/update-son", editSonController);
sonRouter.post("/get-son", getSonController);
sonRouter.post("/get-sondetail", getSonDetailController);
sonRouter.post("/delete-son", deleteSonController);

export default sonRouter;