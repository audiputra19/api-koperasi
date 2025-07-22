import { Request, Response } from "express";
import connKopsas from "../config/db/kopsas";
import { RowDataPacket } from "mysql2";
import moment from "moment";

interface MaxCodeRow extends RowDataPacket {
    maxCode: number | null;
}
const generateIdTransaction = async () => {
    const [rows] = await connKopsas.query<MaxCodeRow[]>(
        `SELECT MAX(CAST(LEFT(id_transaksi, 4) AS UNSIGNED)) AS maxCode FROM kasir`
    );

    let nextCode = 1;
    if(rows.length > 0 && rows[0].maxCode) {
        nextCode = rows[0].maxCode + 1;
    }

    const code = nextCode.toString().padStart(4, '0');
    const date = moment().format('DD');
    const year = moment().format('YY');

    return `${code}/KSR/KOPSA/${date}/${year}`;
}
export const inputKasirController = async (req: Request, res: Response) => {
    const { dataKasir, dataPelanggan, total, metode, userBuat } = req.body;
    const tanggal = moment().format('YYYY-MM-DD HH:mm:ss');

    try {
        const idTransaction = await generateIdTransaction();
        await connKopsas.query<RowDataPacket[]>(
            `INSERT INTO kasir 
            (id_transaksi, tanggal, kd_pelanggan, nama_pelanggan, total, user_buat, metode)
            VALUES (?, ?, ?, ?, ?, ?, ?)`, 
            [idTransaction, tanggal, dataPelanggan.kodePelanggan, dataPelanggan.namaPelanggan, total, userBuat, metode]
        )

        for (const item of dataKasir) {
            await connKopsas.query<RowDataPacket[]>(
                `INSERT INTO kasir_detail
                (id_transaksi, kd_item, nama_item, jenis, jumlah, satuan, harga)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [idTransaction, item.kodeItem, item.namaItem, item.jenis, item.jumlah, item.satuan, item.harga]
            )

            await connKopsas.query<RowDataPacket[]>(
                `UPDATE items SET stok = stok - ? WHERE kode = ?`,
                [item.jumlah, item.kodeItem]
            )
        }

        res.status(200).json({ message: 'Transaksi berhasil disimpan' });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Terjadi kesalahan pada server' });
    }
}

export const getKasirController = (req: Request, res: Response) => {

}