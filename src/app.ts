import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response } from "express";
import authRouter from "./routers/authRoutes";
import cors from "cors";
import supplierRouter from "./routers/supplierRoutes";
import pelangganRouter from "./routers/pelangganRoutes";
import itemRouter from "./routers/itemRoutes";
import kasirRouter from "./routers/kasirRoutes";
import PembelianRouter from "./routers/pembellianRoutes";
import laporanRouter from "./routers/laporanRoutes";
import dashboardRouter from "./routers/dashboardRoutes";
import hakAksesRouter from "./routers/hakAksesRoutes";
import sonRouter from "./routers/sonRoutes";

const app = express();

app.use(cors({
     origin: 'https://koperasi-next-app.vercel.app'
    // origin: 'http://localhost:3000'
    // origin: 'https://koperasi-app-omega.vercel.app'
}));

app.use(express.json());
app.use("/auth", authRouter);
app.use("/", supplierRouter);
app.use("/", pelangganRouter);
app.use("/", itemRouter);
app.use("/", kasirRouter);
app.use("/", PembelianRouter);
app.use("/", laporanRouter);
app.use("/", dashboardRouter);
app.use("/", hakAksesRouter);
app.use("/", sonRouter);

app.get("/", (req: Request, res: Response) => {
    res.send("welcome");
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});