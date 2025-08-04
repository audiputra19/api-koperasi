import { Router } from "express";
import { getExpiredItemController, getLimitItemController, getMostBuyerController, getPopulerItemController, getTotalAnggotaController, getTotalItemController, getTotalSupplierController } from "../controllers/dashboardController";

const dashboardRouter = Router();

dashboardRouter.post('/get-total-anggota', getTotalAnggotaController);
dashboardRouter.post('/get-total-supplier', getTotalSupplierController);
dashboardRouter.post('/get-total-item', getTotalItemController);
dashboardRouter.post('/get-limit-item', getLimitItemController);
dashboardRouter.post('/get-expired-item', getExpiredItemController);
dashboardRouter.post('/get-populer-item', getPopulerItemController);
dashboardRouter.post('/get-most-buyer', getMostBuyerController);

export default dashboardRouter;