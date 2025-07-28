import { RowDataPacket } from "mysql2";
import connKopsas from "../config/db/kopsas";
import { Kasir } from "../interfaces/kasir";
import { Request, Response } from "express";
import moment from "moment";

export const getLaporanController = async (req: Request, res: Response) => {
    const {date1, date2} = req.body;
    const tanggal1 = moment(date1).format("YYYY-MM-DD"); 
    const tanggal2 = moment(date2).format("YYYY-MM-DD");

    try {
        const [rows] = await connKopsas.query<RowDataPacket[]>(
            `SELECT * 
            FROM kasir
            WHERE DATE(tanggal) BETWEEN ? AND ?
            ORDER BY id_transaksi`,
            [tanggal1, tanggal2]
        );
        const laporan = rows as Kasir[];

        const dataLaporan = laporan.map(item => {
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

        res.status(200).json(dataLaporan);
    } catch (error) {
        res.status(400).json({ message: 'Terjadi kesalahan pada server' })
    }
}