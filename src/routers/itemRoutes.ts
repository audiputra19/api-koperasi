import { Router } from "express";
import { deleteItemController, getItemController, inputItemController, searchItemController } from "../controllers/itemController";

const itemRouter = Router();

itemRouter.post("/get-items", getItemController);
itemRouter.post("/input-items", inputItemController);
itemRouter.get("/search-items", searchItemController);
itemRouter.post("/delete-items", deleteItemController);

export default itemRouter;