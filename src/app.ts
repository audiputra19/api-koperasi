import dotenv from "dotenv";
dotenv.config();
import express from "express";
import authRouter from "./routers/authRoutes";
import cors from "cors";
import supplierRouter from "./routers/supplierRoutes";
import pelangganRouter from "./routers/pelangganRoutes";
import itemRouter from "./routers/itemRoutes";
import kasirRouter from "./routers/kasirRoutes";
import PembelianRouter from "./routers/pembellianRoutes";

const app = express();

app.use(cors({
    origin: 'http://localhost:5173'
}));

app.use(express.json());
app.use("/auth", authRouter);
app.use("/", supplierRouter);
app.use("/", pelangganRouter);
app.use("/", supplierRouter);
app.use("/", itemRouter);
app.use("/", kasirRouter);
app.use("/", PembelianRouter);

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});