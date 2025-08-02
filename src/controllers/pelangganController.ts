import { Request, Response } from "express";
import connPayroll from "../config/db/payroll";
import { RowDataPacket } from "mysql2";
import { Pelanggan } from "../interfaces/pelanggan";
import connKopsas from "../config/db/kopsas";
import moment from "moment";

export const getPelangganController = async (req: Request, res: Response) => {

    try {
        const [rows] = await connPayroll.query<RowDataPacket[]>(
            `SELECT dt_karyawan.ID_KAR as kode, 
                dt_karyawan.NM_LKP as nama, 
                pelanggan.id_kategori as idKategori, 
                pelanggan.limit_belanja as limitBelanja,
                pelanggan.kredit
            FROM payroll_new.dt_karyawan
            LEFT JOIN kopsa.pelanggan ON pelanggan.kode = dt_karyawan.ID_KAR
            WHERE dt_karyawan.OFF <> '1' 
            ORDER BY dt_karyawan.NM_LKP`
        );
        const pelanggan = rows as Pelanggan[];
        //console.log(pelanggan);
        res.status(200).json(pelanggan);
    } catch (error) {
        res.status(400).json({ message: "Terjadi kesalahan pada server" })
    }
}

export const inputPelangganController = async (req: Request, res: Response) => {
    const {kode, idKategori, limitBelanja, kredit} = req.body;
    const date = moment().format("YYYY-MM-DD HH:mm:ss");

    try {
        const [rowsPelanggan] = await connKopsas.query<RowDataPacket[]>(
            `SELECT * FROM pelanggan WHERE kode = ?`, 
            [kode]
        );

        if(rowsPelanggan.length > 0) {
            await connKopsas.query<RowDataPacket[]>(
                `UPDATE pelanggan 
                SET id_kategori = ?, limit_belanja = ?, kredit = ?
                WHERE kode = ?`,
                [idKategori, limitBelanja, kredit, kode]
            );
        } else {
            await connKopsas.query<RowDataPacket[]>(
                `INSERT INTO pelanggan (kode, id_kategori, limit_belanja, kredit, tanggal) 
                VALUES (?, ?, ?, ?, ?)`,
                [kode, idKategori, limitBelanja, kredit, date]
            );
        }

        res.status(200).json({ message: "Pelanggan berhasil ditambahkan" });
    } catch (error) {
        console.error("DB Error:", error);
        res.status(400).json({ message: "Terjadi kesalahan pada server" })
    }
}

export const searchPelangganController = async (req: Request, res: Response) => {
    const search = req.query.q || '';

    if (!search) return res.json([]);

    try {
        const [rows] = await connPayroll.query<RowDataPacket[]>(
            `SELECT dt_karyawan.ID_KAR as kode, 
                dt_karyawan.NM_LKP as nama, 
                pelanggan.id_kategori as idKategori, 
                pelanggan.limit_belanja as limitBelanja
            FROM payroll_new.dt_karyawan
            LEFT JOIN kopsa.pelanggan ON pelanggan.kode = dt_karyawan.ID_KAR
            WHERE dt_karyawan.OFF <> '1' AND (dt_karyawan.ID_KAR LIKE ? OR dt_karyawan.NM_LKP LIKE ?)
            ORDER BY dt_karyawan.NM_LKP`,
            [`%${search}%`, `%${search}%`]
        )
        const pelanggan = rows as Pelanggan[];

        res.status(200).json(pelanggan);
    } catch (error) {
        res.status(400).json({ message: "Terjadi kesalahan pada server" })
    }
}