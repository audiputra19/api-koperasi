import { Router } from "express";
import { loginController, me, userController } from "../controllers/authController";
import { authenticateToken } from "../middlewares/authMiddleware";

const authRouter = Router();
authRouter.post("/login", loginController);
authRouter.post("/me", authenticateToken, me);
authRouter.post("/user", userController);

export default authRouter;