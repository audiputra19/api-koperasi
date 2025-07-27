import { Request, Response } from "express";
import connKopsas from "../config/db/kopsas";
import { RowDataPacket } from "mysql2";
import { Supplier } from "../interfaces/supplier";

interface MaxCodeRow extends RowDataPacket {
    maxCode: number | null;
}
const generateSupplierCode = async () => {
    const [rows] = await connKopsas.query<MaxCodeRow[]>(
        `SELECT MAX(CAST(RIGHT(kode, 4) AS UNSIGNED)) AS maxCode FROM supplier`
    );

    let nextCode = 1;
    if(rows.length > 0 && rows[0].maxCode) {
        nextCode = rows[0].maxCode + 1;
    }

    const code = nextCode.toString().padStart(4, '0');
    return `SP-${code}`;
}

export const inputSupplierController = async (req: Request, res: Response) => {
    const {nama, alamat} = req.body;

    try {
        const kode = await generateSupplierCode();

        await connKopsas.query<RowDataPacket[]>(
            `INSERT INTO supplier (kode, nama, alamat) 
            VALUES (?, ?, ?)`,
            [kode, nama, alamat]
        )

        res.status(200).json({ message: 'supplier berhasil ditambahkan' });
    } catch (error) {
        res.status(400).json({ message: 'terjadi kesalahan pada server' });
    }
}

export const getSupplierController = async (req: Request, res: Response) => {
    try {
        const [suppliers] = await connKopsas.query<RowDataPacket[]>(
            `SELECT * FROM supplier ORDER BY kode ASC`
        );

        res.status(200).json(suppliers);
    } catch (error) {
        res.status(400).json({ message: 'terjadi kesalahan pada server' });
    }
}

export const searchSupplierController = async (req: Request, res: Response) => {
    const search = req.query.q || '';

    if (!search) return res.json([]);

    try {
        const [rows] = await connKopsas.query<RowDataPacket[]>(
            `SELECT kode, nama, alamat FROM supplier WHERE nama LIKE ?`,
            [`%${search}%`]
        )
        const supplier = rows as Supplier[];

        res.status(200).json(supplier);
    } catch (error) {
        res.status(400).json({ message: "Terjadi kesalahan pada server" })
    }
}