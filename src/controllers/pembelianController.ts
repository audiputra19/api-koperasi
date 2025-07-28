import { Request, Response } from "express";
import connKopsas from "../config/db/kopsas";
import { RowDataPacket } from "mysql2";
import moment from "moment";
import { Pembelian, PembelianDetail } from "../interfaces/pembelian";

interface MaxCodeRow extends RowDataPacket {
    maxCode: number | null;
}
const generateIdTransaction = async () => {
    const [rows] = await connKopsas.query<MaxCodeRow[]>(
        `SELECT MAX(CAST(LEFT(id_transaksi, 4) AS UNSIGNED)) AS maxCode FROM pembelian`
    );

    let nextCode = 1;
    if(rows.length > 0 && rows[0].maxCode) {
        nextCode = rows[0].maxCode + 1;
    }

    const code = nextCode.toString().padStart(4, '0');
    const date = moment().format('DD');
    const year = moment().format('YY');

    return `${code}/BL/KOPSA/${date}/${year}`;
}
export const inputPembelianController = async (req: Request, res: Response) => {
    const { dataPembelian, dataSupplier, total, metode, startDate, userBuat } = req.body;

    try {
        if(dataPembelian.length === 0) return res.status(400).json({ message: "Item belum dipilih" });

        const idTransaction = await generateIdTransaction();
        await connKopsas.query<RowDataPacket[]>(
            `INSERT INTO pembelian 
            (id_transaksi, tanggal, kd_supplier, nama_supplier, total, user_buat, metode)
            VALUES (?, ?, ?, ?, ?, ?, ?)`, 
            [idTransaction, startDate, dataSupplier.kodeSupplier, dataSupplier.namaSupplier, total, userBuat, metode]
        )

        for (const item of dataPembelian) {
            await connKopsas.query<RowDataPacket[]>(
                `INSERT INTO pembelian_detail
                (id_transaksi, kd_item, nama_item, jenis, jumlah, satuan, harga)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [idTransaction, item.kodeItem, item.namaItem, item.jenis, item.jumlah, item.satuan, item.harga]
            )

            await connKopsas.query<RowDataPacket[]>(
                `UPDATE items SET stok = stok + ? WHERE kode = ?`,
                [item.jumlah, item.kodeItem]
            )
        }

        res.status(200).json({ message: 'Transaksi berhasil disimpan' });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Terjadi kesalahan pada server' });
    }
}

export const updatePembelianController = async (req: Request, res: Response) => {
    const { idTransaksi, dataPembelian, dataSupplier, total, metode, startDate, userBuat } = req.body;

    try {
        if(dataPembelian.length === 0) return res.status(400).json({ message: "Item belum dipilih" });

        await connKopsas.query<RowDataPacket[]>(
            `UPDATE pembelian 
            SET tanggal = ?, kd_supplier = ?, nama_supplier = ?, total = ?, user_ubah = ?, metode = ? 
            WHERE id_transaksi = ?`, 
            [startDate, dataSupplier.kodeSupplier, dataSupplier.namaSupplier, total, userBuat, 
            metode, idTransaksi]
        )

        await connKopsas.query<RowDataPacket[]>(
            `DELETE FROM pembelian_detail WHERE id_transaksi = ?`,
            [idTransaksi]
        )

        for (const item of dataPembelian) {
            await connKopsas.query<RowDataPacket[]>(
                `INSERT INTO pembelian_detail
                (id_transaksi, kd_item, nama_item, jenis, jumlah, satuan, harga)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [idTransaksi, item.kodeItem, item.namaItem, item.jenis, item.jumlah, item.satuan, item.harga]
            )

            await connKopsas.query<RowDataPacket[]>(
                `UPDATE items SET stok = stok + ? WHERE kode = ?`,
                [item.jumlah, item.kodeItem]
            )
        }

        res.status(200).json({ message: 'Transaksi berhasil disimpan' });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Terjadi kesalahan pada server' });
    }
}

export const getPembelianController = async (req: Request, res: Response) => {

    try {
        const [rows] = await connKopsas.query<RowDataPacket[]>(
            `SELECT * FROM pembelian ORDER BY id_transaksi`
        );
        const pembelian = rows as Pembelian[];

        const dataPembelian = pembelian.map(item => {
            return {
                idTransaksi: item.id_transaksi,
                tanggal: item.tanggal,
                kdSupplier: item.kd_supplier,
                namaSupplier: item.nama_supplier,
                total: item.total,
                userBuat: item.user_buat,
                userUbah: item.user_ubah,
                metode: item.metode
            }
        });

        res.status(200).json(dataPembelian);
    } catch (error) {
        res.status(400).json({ message: 'Terjadi kesalahan pada server' })
    }
}

export const getPembelianDetailController = async (req: Request, res: Response) => {
    const { idTransaksi } = req.body;

    try {
        const [rows] = await connKopsas.query<RowDataPacket[]>(
            `SELECT pembelian_detail.id_transaksi, items.barcode, pembelian_detail.kd_item, pembelian_detail.nama_item, 
                    pembelian_detail.jenis, pembelian_detail.jumlah, pembelian_detail.satuan, pembelian_detail.harga
            FROM pembelian_detail 
            INNER JOIN items ON items.kode = pembelian_detail.kd_item 
            WHERE id_transaksi = ? 
            ORDER BY nama_item`,
            [idTransaksi]
        );   
        const PembelianDetail = rows as PembelianDetail[];
        
        const dataPembelianDetail = PembelianDetail.map(item => {
            return {
                kodeItem: item.kd_item,
                namaItem: item.nama_item,
                jenis: item.jenis,
                jumlah: item.jumlah,
                satuan: item.satuan,
                harga: item.harga,
            }
        });

        res.status(200).json(dataPembelianDetail);
    } catch (error) {
        res.status(400).json({ message: 'Terjadi kesalahan pada server' })
    }
}

export const deletePembelianController = async (req: Request, res: Response) => {
    const { idTransaksi } = req.body;

    try {
        await connKopsas.query<RowDataPacket[]>(
            `DELETE FROM pembelian WHERE id_transaksi = ?`, [idTransaksi]
        );

        res.status(200).json({ message: 'Data berhasil dihapus' });
    } catch (error) {
        res.status(400).json({ message: 'Terjadi kesalahan pada server' });  
    }
}

export const deletePembelianDetailController = async (req: Request, res: Response) => {
    const { idTransaksi, kdItem, total } = req.body;

    try {
        await connKopsas.query<RowDataPacket[]>(
            `UPDATE pembelian 
            SET total = total - ? 
            WHERE id_transaksi = ?`, 
            [total, idTransaksi]
        );

        await connKopsas.query<RowDataPacket[]>(
            `DELETE FROM pembelian_detail WHERE id_transaksi = ? AND kd_item = ?`, [idTransaksi, kdItem]
        );

        res.status(200).json({ message: 'Data berhasil dihapus' });
    } catch (error) {
        res.status(400).json({ message: 'Terjadi kesalahan pada server' });  
    }
}