import mysql from 'mysql2/promise'

declare global {
  var __connKopsas: mysql.Pool | undefined
}

const connKopsas =
  global.__connKopsas ??
  mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME_KOPSAS,
    timezone: '+07:00',
    waitForConnections: true,
    connectionLimit: 2, // diturunkan dari 10 — di serverless ini dikali jumlah instance yang jalan bersamaan
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    idleTimeout: 60000, // tutup koneksi idle setelah 60 detik, jangan menahan slot MySQL terlalu lama
    maxIdle: 1, // maksimal 1 koneksi idle yang disimpan pool, sisanya ditutup
})

global.__connKopsas = connKopsas

connKopsas.on('connection', () => {
  console.log('Database Kopsas: koneksi baru dibuat')
})

export default connKopsas