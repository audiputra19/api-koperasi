import { Request, Response } from "express";
import { CustomRequest } from "../types/customRequest";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt";
import connKopsas from "../config/db/kopsas";
import { RowDataPacket } from "mysql2";
import { User } from "../interfaces/users";

export const loginController = async (req: Request, res: Response) => {
    const { idAdmin, password } = req.body;

    try {
        if(idAdmin.length === 0 || password.length === 0) return res.status(400).json({ message: 'Form wajib diisi!' });

        const [rows] = await connKopsas.query<RowDataPacket[]>(
            `SELECT * 
            FROM users 
            WHERE id = ?`,
            [idAdmin]
        );
        const user = rows[0] as User;
        //console.log(user);
        if(!user) return res.status(404).json({ message: 'Id admin atau password salah' });

        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if(!isPasswordValid) return res.status(401).json({ message: 'Id admin atau password salah' });

        const token = generateToken({ 
            id: user.id, 
            nama: user.nama,
            hakAkses: user.hakAkses,
            kategori: user.kategori 
        });

        res.status(200).json({ 
            data: {
              token
            },
            message: 'Login berhasil'  
        });
    } catch (error) {
        res.status(400).json({ message: 'terjadi kesalahan pada server' })
    }
}

export const me = (req: CustomRequest, res: Response) => res.status(200).json({ user: req.user });