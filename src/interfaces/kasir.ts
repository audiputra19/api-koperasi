export interface Kasir {
    id_transaksi: string;
    tanggal: string;
    kd_pelanggan: number;
    nama_pelanggan: string;
    total: number;
    user_buat: string;
    user_ubah: string;
    metode: number;
}

export interface KasirDetail {
    id_transaksi: string;
    kd_item: string;
    nama_item: string;
    jenis: string;
    jumlah: number;
    satuan: string;
    harga: number;
}