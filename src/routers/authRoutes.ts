import { Router } from "express";
import { loginController, me } from "../controllers/authController";
import { authenticateToken } from "../middlewares/authMiddleware";

const authRouter = Router();
authRouter.post("/login", loginController);
authRouter.post("/me", authenticateToken, me);

export default authRouter;