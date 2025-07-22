import { Router } from "express";
import { getItemController, inputItemController, searchItemController } from "../controllers/itemController";

const itemRouter = Router();

itemRouter.post("/get-items", getItemController);
itemRouter.post("/input-items", inputItemController);
itemRouter.get("/search-items", searchItemController);

export default itemRouter;