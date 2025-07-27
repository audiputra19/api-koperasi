export interface Pembelian {
    id_transaksi: string;
    tanggal: string;
    kd_supplier: number;
    nama_supplier: string;
    total: number;
    user_buat: string;
    user_ubah: string;
    metode: number;
}

export interface PembelianDetail {
    id_transaksi: string;
    kd_item: string;
    nama_item: string;
    jenis: string;
    jumlah: number;
    satuan: string;
    harga: number;
}