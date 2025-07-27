import { Router } from "express";
import { getSupplierController, inputSupplierController, searchSupplierController } from "../controllers/supplierController";

const supplierRouter = Router();
supplierRouter.post("/input-supplier", inputSupplierController);
supplierRouter.post("/get-supplier", getSupplierController);
supplierRouter.get("/search-supplier", searchSupplierController);

export default supplierRouter;