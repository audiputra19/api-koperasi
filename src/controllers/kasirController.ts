import { Request, Response } from "express";
import connKopsas from "../config/db/kopsas";
import { RowDataPacket } from "mysql2";
import moment from "moment";
import { Kasir, KasirDetail } from "../interfaces/kasir";

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
    const { dataKasir, dataPelanggan, total, metode, startDate, userBuat } = req.body;

    try {
        const idTransaction = await generateIdTransaction();
        await connKopsas.query<RowDataPacket[]>(
            `INSERT INTO kasir 
            (id_transaksi, tanggal, kd_pelanggan, nama_pelanggan, total, user_buat, metode)
            VALUES (?, ?, ?, ?, ?, ?, ?)`, 
            [idTransaction, startDate, dataPelanggan.kodePelanggan, dataPelanggan.namaPelanggan, total, userBuat, metode]
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

export const updateKasirController = async (req: Request, res: Response) => {
    const { idTransaksi, dataKasir, dataPelanggan, total, metode, startDate, userBuat } = req.body;

    try {

        await connKopsas.query<RowDataPacket[]>(
            `UPDATE kasir 
            SET tanggal = ?, kd_pelanggan = ?, nama_pelanggan = ?, total = ?, user_ubah = ?, metode = ? 
            WHERE id_transaksi = ?`, 
            [startDate, dataPelanggan.kodePelanggan, dataPelanggan.namaPelanggan, total, userBuat, 
            metode, idTransaksi]
        )

        for (const item of dataKasir) {
            await connKopsas.query<RowDataPacket[]>(
                `INSERT INTO kasir_detail
                (id_transaksi, kd_item, nama_item, jenis, jumlah, satuan, harga)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [idTransaksi, item.kodeItem, item.namaItem, item.jenis, item.jumlah, item.satuan, item.harga]
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

export const getKasirController = async (req: Request, res: Response) => {

    try {
        const [rows] = await connKopsas.query<RowDataPacket[]>(
            `SELECT * FROM kasir ORDER BY id_transaksi`
        );
        const kasir = rows as Kasir[];

        const dataKasir = kasir.map(item => {
            return {
                idTransaksi: item.id_transaksi,
                tanggal: item.tanggal,
                kdPelanggan: item.kd_pelanggan,
                namaPelanggan: item.nama_pelanggan,
                total: item.total,
                userBuat: item.user_buat,
                userUbah: item.user_ubah,
                metode: item.metode
            }
        });

        res.status(200).json(dataKasir);
    } catch (error) {
        res.status(400).json({ message: 'Terjadi kesalahan pada server' })
    }
}

export const getKasirDetailController = async (req: Request, res: Response) => {
    const { idTransaksi } = req.body;

    try {
        const [rows] = await connKopsas.query<RowDataPacket[]>(
            `SELECT kasir_detail.id_transaksi, items.barcode, kasir_detail.kd_item, kasir_detail.nama_item, 
                    kasir_detail.jenis, kasir_detail.jumlah, kasir_detail.satuan, kasir_detail.harga
            FROM kasir_detail 
            INNER JOIN items ON items.kode = kasir_detail.kd_item 
            WHERE id_transaksi = ? 
            ORDER BY nama_item`,
            [idTransaksi]
        );   
        const kasirDetail = rows as KasirDetail[];
        
        const dataKasirDetail = kasirDetail.map(item => {
            return {
                kodeItem: item.kd_item,
                namaItem: item.nama_item,
                jenis: item.jenis,
                jumlah: item.jumlah,
                satuan: item.satuan,
                harga: item.harga,
            }
        });

        res.status(200).json(dataKasirDetail);
    } catch (error) {
        res.status(400).json({ message: 'Terjadi kesalahan pada server' })
    }
}