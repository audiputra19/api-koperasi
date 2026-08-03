import { Request, Response } from "express";
import connKopsas from "../config/db/kopsas";
import { RowDataPacket } from "mysql2";
import moment from "moment-timezone";
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
    const date = moment().tz("Asia/Jakarta").format("MM");
    const year = moment().tz("Asia/Jakarta").format("YY");

    return `${code}/KSR/KOPSA/${date}/${year}`;
}

export const inputKasirController = async (req: Request, res: Response) => {
    const { dataKasir, dataPelanggan, total, metode, startDate, userBuat } = req.body;

    const connection = await connKopsas.getConnection();

    try {
        await connection.beginTransaction();

        if (!dataKasir || dataKasir.length === 0) {
            await connection.rollback();
            return res.status(200).json({ message: "Item belum dipilih" });
        }

        if (dataPelanggan?.sumberPelanggan !== 'umum') {
            const [rowPelanggan] = await connKopsas.query(
                `SELECT pelanggan.limit_belanja AS limitBelanja, pelanggan.kredit
                FROM pelanggan
                WHERE pelanggan.kode = ?`,
                [dataPelanggan.kodePelanggan]
            );
    
            const startOfMonth = moment().tz("Asia/Jakarta").startOf("month").format("YYYY-MM-DD HH:mm:ss");
            const endOfMonth = moment().tz("Asia/Jakarta").endOf("month").format("YYYY-MM-DD HH:mm:ss");
    
            const [rowJumlahBelanjaBulanan] = await connKopsas.query(
                `SELECT SUM(kasir.total) AS total
                FROM kasir
                WHERE kasir.kd_pelanggan = ?
                AND kasir.tanggal BETWEEN ? AND ?`,
                [dataPelanggan.kodePelanggan, startOfMonth, endOfMonth]
            );
            const jmlBelanja = (rowJumlahBelanjaBulanan as { total: number }[])[0];
            const totalBelanja = Number(jmlBelanja.total ?? 0) + Number(total ?? 0);
            
            const pelanggan = (rowPelanggan as { limitBelanja: number, kredit: number }[])[0]
            const limitBelanja = Number(pelanggan.limitBelanja ?? 0);
            const kredit = Number(pelanggan.kredit ?? 0);
    
            if (kredit === 0) {
                await connection.rollback();
                return res.status(400).json({ message: "Pelanggan tidak dapat melakukan pembayaran kredit" });
            }
    
            if (limitBelanja > 0 && totalBelanja > limitBelanja) {
                await connection.rollback();
                return res.status(400).json({ message: "Pelanggan sudah melebihi limit belanja" });
            }
        }

        for (const item of dataKasir) {
            const [rows] = await connection.query<RowDataPacket[]>(
                `SELECT nama, stok FROM items WHERE kode = ?`,
                [item.kodeItem]
            );

            const dbItem = rows[0];

            if (!dbItem) {
                await connection.rollback();
                return res.status(400).json({ 
                    message: `Item dengan kode ${item.kodeItem} tidak ditemukan.` 
                });
            }

            if (dbItem.stok < item.jumlah) {
                await connection.rollback();
                return res.status(400).json({ 
                    message: `Stok "${dbItem.nama}" tidak mencukupi!` 
                });
            }
        }
        
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

        await connection.commit();
        res.status(200).json({ message: 'Transaksi berhasil disimpan' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(400).json({ message: 'Terjadi kesalahan pada server' });
    } finally {
        connection.release();
    }
}

export const updateKasirController = async (req: Request, res: Response) => {
    const { idTransaksi, dataKasir, dataPelanggan, total, metode, startDate, userBuat } = req.body;

    const connection = await connKopsas.getConnection();

    try {
        await connection.beginTransaction();

        if(dataKasir.length === 0) {
            await connection.rollback();
            return res.status(400).json({ message: "Item belum dipilih" });
        }

        const [oldDetails] = await connection.query<RowDataPacket[]>(
            `SELECT kd_item, jumlah FROM kasir_detail WHERE id_transaksi = ?`,
            [idTransaksi]
        );

        await connection.query<RowDataPacket[]>(
            `UPDATE kasir 
            SET tanggal = ?, kd_pelanggan = ?, nama_pelanggan = ?, total = ?, user_ubah = ?, metode = ? 
            WHERE id_transaksi = ?`, 
            [startDate, dataPelanggan.kodePelanggan, dataPelanggan.namaPelanggan, total, userBuat, 
            metode, idTransaksi]
        );

        for (const oldItem of oldDetails) {
            await connection.query<RowDataPacket[]>(
                `UPDATE items SET stok = stok + ? WHERE kode = ?`,
                [oldItem.jumlah, oldItem.kd_item]
            );
        }

        await connection.query<RowDataPacket[]>(
            `DELETE FROM kasir_detail WHERE id_transaksi = ?`,
            [idTransaksi]
        );

        for (const item of dataKasir) {
            await connection.query<RowDataPacket[]>(
                `INSERT INTO kasir_detail
                (id_transaksi, kd_item, nama_item, jenis, jumlah, satuan, harga)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [idTransaksi, item.kodeItem, item.namaItem, item.jenis, item.jumlah, item.satuan, item.harga]
            )

            await connection.query<RowDataPacket[]>(
                `UPDATE items SET stok = stok - ? WHERE kode = ?`,
                [item.jumlah, item.kodeItem]
            )
        }

        await connection.commit();
        res.status(200).json({ message: 'Transaksi berhasil disimpan' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(400).json({ message: 'Terjadi kesalahan pada server' });
    } finally {
        connection.release();
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
                metode: item.metode,
                sumber: item.sumber,
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
            `SELECT 
                kasir_detail.id_transaksi, items.barcode, kasir_detail.kd_item, kasir_detail.nama_item, 
				kasir_detail.jenis, kasir_detail.jumlah, kasir_detail.satuan,
                (
                    SELECT harga_item.harga_beli
                    FROM harga_item
                    WHERE harga_item.kd_item = kasir_detail.kd_item
                      AND harga_item.tanggal <= kasir.tanggal
                    ORDER BY harga_item.tanggal DESC
                    LIMIT 1
                ) AS harga_beli,
                (
                    SELECT harga_item.harga_jual
                    FROM harga_item
                    WHERE harga_item.kd_item = kasir_detail.kd_item
                      AND harga_item.tanggal <= kasir.tanggal
                    ORDER BY harga_item.tanggal DESC
                    LIMIT 1
                ) AS harga
            FROM kasir_detail
            JOIN kasir ON kasir.id_transaksi = kasir_detail.id_transaksi
            INNER JOIN items ON items.kode = kasir_detail.kd_item
            WHERE kasir.id_transaksi = ? 
            ORDER BY kasir_detail.nama_item`,
            [idTransaksi]
        );   
        const kasirDetail = rows as KasirDetail[];
        
        const dataKasirDetail = kasirDetail.map(item => {
            return {
                idTransaksi: item.id_transaksi,
                kodeItem: item.kd_item,
                namaItem: item.nama_item,
                jenis: item.jenis,
                jumlah: item.jumlah,
                satuan: item.satuan,
                harga: item.harga,
                harga_beli: item.harga_beli,
            }
        });

        res.status(200).json(dataKasirDetail);
    } catch (error) {
        res.status(400).json({ message: 'Terjadi kesalahan pada server' });
    }
}

export const deleteKasirController = async (req: Request, res: Response) => {
    const { idTransaksi } = req.body;

    const connection = await connKopsas.getConnection();

    try {
        await connection.beginTransaction();

        const [oldDetails] = await connection.query<RowDataPacket[]>(
            `SELECT kd_item, jumlah FROM kasir_detail WHERE id_transaksi = ?`,
            [idTransaksi]
        );

        for (const detail of oldDetails) {
            await connection.query(
                `UPDATE items SET stok = stok + ? WHERE kode = ?`,
                [detail.jumlah, detail.kd_item]
            );
        }

        await connection.query<RowDataPacket[]>(
            `DELETE FROM kasir WHERE id_transaksi = ?`, [idTransaksi]
        );

        await connection.query<RowDataPacket[]>(
            `DELETE FROM kasir_detail WHERE id_transaksi = ?`, [idTransaksi]
        );

        await connection.commit();
        res.status(200).json({ message: 'Data berhasil dihapus' });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({ message: 'Terjadi kesalahan pada server' });  
    } finally {
        connection.release();
    }
}

export const deleteKasirDetailController = async (req: Request, res: Response) => {
    const { idTransaksi, kdItem, total } = req.body;

    const connection = await connKopsas.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query<RowDataPacket[]>(
            `UPDATE kasir 
            SET total = total - ? 
            WHERE id_transaksi = ?`, 
            [total, idTransaksi]
        );

        await connection.query<RowDataPacket[]>(
            `DELETE FROM kasir_detail WHERE id_transaksi = ? AND kd_item = ?`, [idTransaksi, kdItem]
        );

        await connection.commit();
        res.status(200).json({ message: 'Data berhasil dihapus' });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({ message: 'Terjadi kesalahan pada server' });  
    } finally {
        connection.release();
    }
}