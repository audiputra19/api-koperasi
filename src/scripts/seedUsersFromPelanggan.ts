import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import connKopsas from "../config/db/kopsas";

async function seedUsersFromPelanggan() {
    console.log("Mulai proses seeding users dari data pelanggan...");

    try {
        const [rowsPelanggan] = await connKopsas.query<RowDataPacket[]>(
            `SELECT kode FROM pelanggan`
        );

        console.log(`Ditemukan ${rowsPelanggan.length} data pelanggan.`);

        let created = 0;
        let skipped = 0;

        for (const row of rowsPelanggan) {
            const kode = row.kode;

            const [rowsUsers] = await connKopsas.query<RowDataPacket[]>(
                `SELECT id FROM users WHERE id = ?`,
                [kode]
            );

            if (rowsUsers.length > 0) {
                skipped++;
                continue;
            }

            const hashedPassword = await bcrypt.hash(kode.toString(), 10);

            await connKopsas.query<ResultSetHeader>(
                `INSERT INTO users (id, password, role) VALUES (?, ?, ?)`,
                [kode, hashedPassword, "Anggota"]
            );

            created++;
            console.log(`✓ User dibuat untuk kode: ${kode}`);
        }

        console.log(`\nSelesai. Dibuat: ${created}, dilewati (sudah ada): ${skipped}.`);
    } catch (error) {
        console.error("Gagal seeding users:", error);
    } finally {
        process.exit(0);
    }
}

seedUsersFromPelanggan();