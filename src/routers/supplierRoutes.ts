import { Router } from "express";
import { getSupplierController, inputSupplierController } from "../controllers/supplierController";

const supplierRouter = Router();
supplierRouter.post("/input-supplier", inputSupplierController);
supplierRouter.post("/get-supplier", getSupplierController);

export default supplierRouter;