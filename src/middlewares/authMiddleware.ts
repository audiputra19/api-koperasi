import { NextFunction, Response } from "express"
import { CustomRequest } from "../types/customRequest";
import { verifyToken } from "../utils/jwt";

export function authenticateToken(req: CustomRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1] as string;

    if(!token) {
        res.sendStatus(401).json({ message: 'Token tidak ditemukan' });
    }
    
    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        res.sendStatus(403).json({ message: 'Token tidak valid' });
    }
}