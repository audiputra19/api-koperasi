import { Request, Response } from "express";
import connKopsas from "../config/db/kopsas";
import { RowDataPacket } from "mysql2";
import { Items } from "../interfaces/items";

interface MaxCodeRow extends RowDataPacket {
    maxCode: number | null;
}
const generateItemCode = async () => {
    const [rows] = await connKopsas.query<MaxCodeRow[]>(
        `SELECT MAX(CAST(RIGHT(kode, 4) AS UNSIGNED)) AS maxCode FROM items`
    );

    let nextCode = 1;
    if(rows.length > 0 && rows[0].maxCode) {
        nextCode = rows[0].maxCode + 1;
    }

    const code = nextCode.toString().padStart(4, '0');
    return `BG-${code}`;
}

export const inputItemController = async (req: Request, res: Response) => {
    const { barcode, nama, stok, satuan, rak, jenis, hargaBeli, hargaJual, hpp, stokMinimal, status } = req.body;

    try {
        if (
            !barcode || !nama || !satuan || !rak || !jenis || !hpp
        ) {
            return res.status(400).json({ message: 'Semua field wajib diisi!' });
        }

        if (
            isNaN(stok) || stok < 0 ||
            isNaN(hargaBeli) || hargaBeli <= 0 ||
            isNaN(hargaJual) || hargaJual <= 0 ||
            isNaN(stokMinimal) || stokMinimal <= 0 ||
            isNaN(status) || status === 0
        ) {
            return res.status(400).json({ message: 'Semua field wajib diisi!' });
        }

        const kode = await generateItemCode();
        await connKopsas.query<RowDataPacket[]>(
            `INSERT INTO items (kode, barcode, nama, stok, satuan, rak, jenis, harga_beli, harga_jual, hpp, stok_minimal, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [kode, barcode, nama, stok, satuan, rak, jenis, hargaBeli, hargaJual, hpp, stokMinimal, status]
        )

        res.status(200).json({ message: 'item berhasil ditambahkan' });
    } catch (error) {
        console.error("ERROR:", error);
        res.status(400).json({ message: 'terjadi kesalahan pada server' });
    }
}

export const getItemController = async (req: Request, res: Response) => {

    try {
        const [rows] = await connKopsas.query<RowDataPacket[]>(
            `SELECT kode, barcode, nama, stok, satuan, rak, jenis, harga_beli as hargaBeli, 
                harga_jual as hargaJual, hpp, stok_minimal as stokMinimal, status 
            FROM items 
            WHERE status <> '2'
            ORDER BY kode ASC`
        );
        const items = rows as Items[];

        res.status(200).json(items);
    } catch (error) {
        res.status(400).json({ message: 'terjadi kesalahan pada server' });
    }
}

export const searchItemController = async (req: Request, res: Response) => {
    const search = req.query.q || '';

    if (!search) return res.json([]);

    try {
        const [rows] = await connKopsas.query<RowDataPacket[]>(
            `SELECT kode as kodeItem, barcode, nama as namaItem, jenis, stok as jumlah, satuan, harga_jual as harga
            FROM items 
            WHERE status <> '2' AND (barcode LIKE ? OR nama LIKE ?)
            ORDER BY kode ASC`,
            [`%${search}%`, `%${search}%`]
        );
        const items = rows as Items[];

        res.status(200).json(items);
    } catch (error) {
        res.status(400).json({ message: 'terjadi kesalahan pada server' });
    }
}