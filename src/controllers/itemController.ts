import { Request, Response } from "express";
import connKopsas from "../config/db/kopsas";
import { RowDataPacket } from "mysql2";
import { Items } from "../interfaces/items";
import moment from "moment";

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
    const { kdItem, barcode, nama, stok, satuan, rak, jenis, hargaBeli, hargaJual, stokMinimal, status } = req.body;
    const date = moment().format("YYYY-MM-DD HH:mm:ss");

    try {

        //console.log(hargaBeli, hargaJual); return;

        if (
            !barcode || !nama || !satuan || !rak || !jenis
        ) {
            return res.status(400).json({ message: 'Semua field wajib diisi!' });
        }

        if (
            isNaN(stokMinimal) || stokMinimal <= 0 ||
            isNaN(status) || status === 0
        ) {
            return res.status(400).json({ message: 'Semua field wajib diisi!' });
        }

        const kode = await generateItemCode();

        const [rowsItem] = await connKopsas.query<RowDataPacket[]>(
            `SELECT * FROM items WHERE kode = ?`, 
            [kdItem]
        );

        if(rowsItem.length > 0) {
            await connKopsas.query<RowDataPacket[]>(
                `UPDATE items 
                SET barcode = ?, nama = ?, satuan = ?, rak = ?, jenis = ?, stok_minimal = ?, status = ?
                WHERE kode = ?`,
                [barcode, nama, satuan, rak, jenis, stokMinimal, status, kdItem]
            )

            if(hargaBeli > 0 && hargaJual > 0) {
                await connKopsas.query<RowDataPacket[]>(
                    `INSERT INTO harga_item (kd_item, tanggal, harga_beli, harga_jual)
                    VALUES (?, ?, ?, ?)`,
                    [kdItem, date, hargaBeli, hargaJual]
                )
            }
        } else {
            if(isNaN(stok) || stok < 0 ||
            isNaN(hargaBeli) || hargaBeli <= 0 ||
            isNaN(hargaJual) || hargaJual <= 0){
                return res.status(400).json({ message: 'Semua field wajib diisi!' });
            }

            await connKopsas.query<RowDataPacket[]>(
                `INSERT INTO items (kode, barcode, nama, stok, satuan, rak, jenis, stok_minimal, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [kode, barcode, nama, stok, satuan, rak, jenis, stokMinimal, status]
            )

            if(hargaBeli > 0 && hargaJual > 0) {
                await connKopsas.query<RowDataPacket[]>(
                    `INSERT INTO harga_item (kd_item, tanggal, harga_beli, harga_jual)
                    VALUES (?, ?, ?, ?)`,
                    [kode, date, hargaBeli, hargaJual]
                )
            }
        }

        res.status(200).json({ message: 'item berhasil ditambahkan' });
    } catch (error) {
        console.error("ERROR:", error);
        res.status(400).json({ message: 'terjadi kesalahan pada server' });
    }
}

export const getItemController = async (req: Request, res: Response) => {

    try {
        const [rows] = await connKopsas.query<RowDataPacket[]>(
            `SELECT 
                i.kode, 
                i.barcode, 
                i.nama, 
                i.stok, 
                i.satuan, 
                i.rak, 
                i.jenis, 
                i.stok_minimal AS stokMinimal, 
                i.status,
                h.harga_beli AS hargaBeli,
                h.harga_jual AS hargaJual
            FROM items i
            LEFT JOIN (
                SELECT kd_item, harga_beli, harga_jual
                FROM harga_item
                WHERE (kd_item, tanggal) IN (
                    SELECT kd_item, MAX(tanggal)
                    FROM harga_item
                    GROUP BY kd_item
                )
            ) h ON h.kd_item = i.kode
            WHERE i.status <> '2'
            ORDER BY i.kode ASC`
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
            `SELECT 
                i.kode AS kodeItem, 
                i.barcode, 
                i.nama AS namaItem, 
                i.jenis, 
                i.stok AS jumlah, 
                i.satuan,
                (
                    SELECT h.harga_jual
                    FROM harga_item h
                    WHERE h.kd_item = i.kode
                    ORDER BY h.tanggal DESC
                    LIMIT 1
                ) AS harga
            FROM items i
            WHERE i.status <> '2'
            AND (i.barcode LIKE ? OR i.nama LIKE ?)
            ORDER BY i.kode ASC`,
            [`%${search}%`, `%${search}%`]
        );
        const items = rows as Items[];

        res.status(200).json(items);
    } catch (error) {
        res.status(400).json({ message: 'terjadi kesalahan pada server' });
    }
}