import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export function generateToken(payload: object) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

export function verifyToken(token: string) {
    return jwt.verify(token, JWT_SECRET);
}