import { RowDataPacket } from "mysql2";

export interface Son extends RowDataPacket {
    id_son: string;
    tanggal: string;
    user_buat: string;
    user_ubah?: string | null;
}

export interface SonDetail extends RowDataPacket {
    id_son: string;
    kd_item: string;
    nama_item: string;
    stok_sistem: number;
    stok_fisik: number;
    selisih: number;
}