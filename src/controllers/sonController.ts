// Sesuaikan lokasi file ini, misal: src/controllers/sonController.ts

import { Request, Response } from "express";
import connKopsas from "../config/db/kopsas";
import { RowDataPacket } from "mysql2";
import moment from "moment-timezone";
import { Son, SonDetail } from "../interfaces/son";

interface MaxCodeRow extends RowDataPacket {
    maxCode: number | null;
}

interface SonItemPayload {
    barcode?: string;
    itemCode: string;
    itemName: string;
    unit?: string;
    category?: string; 
    systemStock: number;
    physicalStock: number;
}

const generateSonNumber = async () => {
    const [rows] = await connKopsas.query<MaxCodeRow[]>(
        `SELECT MAX(CAST(LEFT(id_son, 4) AS UNSIGNED)) AS maxCode FROM son`
    );

    let nextCode = 1;
    if (rows.length > 0 && rows[0].maxCode) {
        nextCode = rows[0].maxCode + 1;
    }

    const code = nextCode.toString().padStart(4, '0');
    const month = moment().tz("Asia/Jakarta").format("MM");
    const year = moment().tz("Asia/Jakarta").format("YY");

    return `${code}/SON/KOPSA/${month}/${year}`;
}

export const inputSonController = async (req: Request, res: Response) => {
    const { items, date, createdBy }: {
        items: SonItemPayload[];
        date?: string;
        createdBy?: string;
    } = req.body;

    const connection = await connKopsas.getConnection();

    try {
        await connection.beginTransaction();

        if (!items || items.length === 0) {
            await connection.rollback();
            return res.status(200).json({ message: "Item belum diinput" });
        }

        const itemCodes = items.map((item) => item.itemCode);

        const sonNumber = await generateSonNumber();
        const sonDate = date
            ? moment(date).tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss")
            : moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");

        // Validasi semua kode item ada di tabel items
        for (const item of items) {
            const [rows] = await connection.query<RowDataPacket[]>(
                `SELECT kode FROM items WHERE kode = ?`,
                [item.itemCode]
            );

            if (rows.length === 0) {
                await connection.rollback();
                return res.status(400).json({
                    message: `Item dengan kode ${item.itemCode} tidak ditemukan.`
                });
            }
        }

        await connection.query<RowDataPacket[]>(
            `INSERT INTO son
            (id_son, tanggal, user_buat)
            VALUES (?, ?, ?)`,
            [sonNumber, sonDate, createdBy ?? null]
        );

        for (const item of items) {
            const selisih = Number(item.physicalStock) - Number(item.systemStock);

            await connection.query<RowDataPacket[]>(
                `INSERT INTO son_detail
                (id_son, kd_item, nama_item, stok_sistem, stok_fisik, selisih)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    sonNumber,
                    item.itemCode,
                    item.itemName,
                    item.systemStock,
                    item.physicalStock,
                    selisih,
                ]
            );

            // Item yang diinput: stok mengikuti hasil hitung fisik
            await connection.query<RowDataPacket[]>(
                `UPDATE items SET stok = ? WHERE kode = ?`,
                [item.physicalStock, item.itemCode]
            );
        }

        // Item yang TIDAK ikut diinput saat SON ini otomatis di-nol-kan
        // await connection.query(
        //     `UPDATE items SET stok = 0 WHERE kode NOT IN (?)`,
        //     [itemCodes]
        // );

        await connection.commit();
        res.status(200).json({ message: 'Data SON berhasil disimpan', sonNumber });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(400).json({ message: 'Terjadi kesalahan pada server' });
    } finally {
        connection.release();
    }
}

export const editSonController = async (req: Request, res: Response) => {
    const { sonNumber, items }: {
        sonNumber: string;
        items: SonItemPayload[];
        updatedBy?: string;
    } = req.body;

    if (!sonNumber) {
        return res.status(400).json({ message: "Nomor SON wajib diisi" });
    }

    if (!items || items.length === 0) {
        return res.status(400).json({ message: "Item belum diinput" });
    }

    const connection = await connKopsas.getConnection();

    try {
        await connection.beginTransaction();

        const [sonRows] = await connection.query<RowDataPacket[]>(
            `SELECT id_son FROM son WHERE id_son = ? FOR UPDATE`,
            [sonNumber]
        );

        if (sonRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: `SON ${sonNumber} tidak ditemukan.` });
        }

        for (const item of items) {
            const [rows] = await connection.query<RowDataPacket[]>(
                `SELECT kode FROM items WHERE kode = ?`,
                [item.itemCode]
            );

            if (rows.length === 0) {
                await connection.rollback();
                return res.status(400).json({
                    message: `Item dengan kode ${item.itemCode} tidak ditemukan.`
                });
            }
        }

        await connection.query(
            `DELETE FROM son_detail WHERE id_son = ?`,
            [sonNumber]
        );

        for (const item of items) {
            const selisih = Number(item.physicalStock) - Number(item.systemStock);

            await connection.query(
                `INSERT INTO son_detail
                (id_son, kd_item, nama_item, stok_sistem, stok_fisik, selisih)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    sonNumber,
                    item.itemCode,
                    item.itemName,
                    item.systemStock,
                    item.physicalStock,
                    selisih,
                ]
            );

            await connection.query(
                `UPDATE items SET stok = ? WHERE kode = ?`,
                [item.physicalStock, item.itemCode]
            );
        }

        await connection.commit();
        res.status(200).json({ message: "Data SON berhasil diubah", sonNumber });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(400).json({ message: "Terjadi kesalahan pada server" });
    } finally {
        connection.release();
    }
}

export const getSonController = async (req: Request, res: Response) => {
    try {
        const [rows] = await connKopsas.query<RowDataPacket[]>(
            `SELECT 
                son.id_son, 
                son.tanggal, 
                son.user_buat,
                COUNT(son_detail.kd_item) AS total_item
            FROM son
            LEFT JOIN son_detail ON son_detail.id_son = son.id_son
            GROUP BY son.id_son, son.tanggal, son.user_buat
            ORDER BY son.id_son DESC`
        );
        const sonList = rows as (Son & { total_item: number })[];

        const data = sonList.map((item) => ({
            id: item.id_son,
            sonNumber: item.id_son,
            date: item.tanggal,
            totalItems: item.total_item,
            createdBy: item.user_buat,
        }));

        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ message: 'Terjadi kesalahan pada server' });
    }
}

export const getSonDetailController = async (req: Request, res: Response) => {
    const { sonNumber } = req.body;

    try {
        const [rows] = await connKopsas.query<RowDataPacket[]>(
            `SELECT * FROM son_detail WHERE id_son = ? ORDER BY nama_item`,
            [sonNumber]
        );
        const sonDetail = rows as SonDetail[];

        const data = sonDetail.map((item) => ({
            sonNumber: item.id_son,
            itemCode: item.kd_item,
            itemName: item.nama_item,
            systemStock: item.stok_sistem,
            physicalStock: item.stok_fisik,
            difference: item.selisih,
        }));

        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ message: 'Terjadi kesalahan pada server' });
    }
}

export const deleteSonController = async (req: Request, res: Response) => {
    const { sonNumber } = req.body;

    if (!sonNumber) {
        return res.status(400).json({ message: 'Nomor SON wajib diisi' });
    }

    const connection = await connKopsas.getConnection();

    try {
        await connection.beginTransaction();

        const [sonRows] = await connection.query<RowDataPacket[]>(
            `SELECT id_son FROM son WHERE id_son = ? FOR UPDATE`,
            [sonNumber]
        );

        if (sonRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: `SON ${sonNumber} tidak ditemukan.` });
        }

        const [detailRows] = await connection.query<RowDataPacket[]>(
            `SELECT kd_item, selisih FROM son_detail WHERE id_son = ?`,
            [sonNumber]
        );

        for (const row of detailRows) {
            await connection.query(
                `UPDATE items SET stok = stok - ? WHERE kode = ?`,
                [Number(row.selisih), row.kd_item]
            );
        }

        await connection.query(
            `DELETE FROM son_detail WHERE id_son = ?`, [sonNumber]
        );

        await connection.query(
            `DELETE FROM son WHERE id_son = ?`, [sonNumber]
        );

        await connection.commit();
        res.status(200).json({ message: 'Data SON berhasil dihapus dan stok dikembalikan' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(400).json({ message: 'Terjadi kesalahan pada server' });
    } finally {
        connection.release();
    }
}