import { Request, Response } from "express"
import connKopsas from "../config/db/kopsas"
import { RowDataPacket } from "mysql2"

export const getHakAksesController = async (req: Request, res: Response) => {
    try {
        const [rows] = await connKopsas.query<RowDataPacket[]>(
            `SELECT users.id, users.nama, users.kategori, hak_akses.delete, hak_akses.date_cashier AS dateCashier
            FROM users 
            INNER JOIN hak_akses ON hak_akses.id = users.id
            WHERE users.kategori = '2'`
        );

        res.status(200).json(rows);
    } catch (error) {
        res.status(400).json({ message: 'Terjadi kesalahan pada server' });
    }
}

export const updateHakAksesController = async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateField = Object.keys(req.body)[0];
    const value = req.body[updateField];

    try {
        await connKopsas.query(`UPDATE hak_akses SET \`${updateField}\` = ? WHERE id = ?`, [value, id]);
        res.json({ message: 'Hak akses berhasil diupdate' });
    } catch (err) {
        res.status(500).json({ error: 'Gagal update hak akses' });
    }
};