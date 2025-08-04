import { Request, Response } from "express";
import connKopsas from "../config/db/kopsas";
import { RowDataPacket } from "mysql2";
import moment from "moment";

const year = moment().year();

export const getTotalAnggotaController = async (req: Request, res: Response) => {
    try {
        const [rows] = await connKopsas.query<RowDataPacket[]>(
            `SELECT * FROM pelanggan`
        );
        const total = rows.length;

        res.status(200).json({ total });
    } catch (error) {
        res.status(400).json({ message: "Terjadi kesalahan pada server" });
    }
}

export const getTotalSupplierController = async (req: Request, res: Response) => {
    try {
        const [rows] = await connKopsas.query<RowDataPacket[]>(
            `SELECT * FROM supplier`
        );
        const total = rows.length;

        res.status(200).json({ total });
    } catch (error) {
        res.status(400).json({ message: "Terjadi kesalahan pada server" });
    }
}

export const getTotalItemController = async (req: Request, res: Response) => {
    try {
        const [rows] = await connKopsas.query<RowDataPacket[]>(
            `SELECT * FROM items`
        );
        const total = rows.length;

        res.status(200).json({ total });
    } catch (error) {
        res.status(400).json({ message: "Terjadi kesalahan pada server" });
    }
}

export const getLimitItemController = async (req: Request, res: Response) => {
    try {
        const [rows] = await connKopsas.query<RowDataPacket[]>(
            `SELECT 
                kode,
                nama,
                stok AS jumlah,
                rak
            FROM 
                items
            WHERE 
                stok <= stok_minimal
                AND status = 1;`
        );

        res.status(200).json(rows);
    } catch (error) {
        res.status(400).json({ message: "Terjadi kesalahan pada server" });
    }
}

export const getExpiredItemController = async (req: Request, res: Response) => {
    try {
        const [rows] = await connKopsas.query<RowDataPacket[]>(
            `SELECT pembelian_detail.kd_item AS kode, pembelian_detail.nama_item AS nama, pembelian_detail.jumlah, items.rak, pembelian_detail.expired_date AS expiredDate
            FROM pembelian_detail
            INNER JOIN items ON items.kode = pembelian_detail.kd_item
            WHERE DATE(expired_date) BETWEEN CURDATE() AND CURDATE() + INTERVAL 7 DAY`
        );

        res.status(200).json(rows);
    } catch (error) {
        res.status(400).json({ message: "Terjadi kesalahan pada server" });
    }
}

export const getPopulerItemController = async (req: Request, res: Response) => {
    try {
        const [rows] = await connKopsas.query<RowDataPacket[]>(
            `SELECT pembelian_detail.nama_item AS nama, SUM(pembelian_detail.jumlah) AS total 
            FROM pembelian_detail
            INNER JOIN pembelian ON pembelian.id_transaksi = pembelian_detail.id_transaksi
            WHERE YEAR(pembelian.tanggal) = ?
            GROUP BY pembelian_detail.kd_item 
            ORDER BY pembelian_detail.jumlah DESC 
            LIMIT 5`, 
            [year]
        );

        res.status(200).json(rows);
    } catch (error) {
        res.status(400).json({ message: "Terjadi kesalahan pada server" });
    }
}

export const getMostBuyerController = async (req: Request, res: Response) => {
    try {
        const [rows] = await connKopsas.query<RowDataPacket[]>(
            `SELECT kasir.nama_pelanggan AS nama, SUM(kasir.total) AS total 
            FROM kasir 
            WHERE YEAR(kasir.tanggal) = ?
            GROUP BY kasir.kd_pelanggan
            ORDER BY kasir.total DESC
            LIMIT 5`, 
            [year]
        );

        res.status(200).json(rows);
    } catch (error) {
        res.status(400).json({ message: "Terjadi kesalahan pada server" });
    }
}