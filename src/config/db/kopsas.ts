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
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  })

if (process.env.NODE_ENV !== 'production') {
  global.__connKopsas = connKopsas
}

connKopsas.on('connection', () => {
  console.log('Database Kopsas: koneksi baru dibuat')
})

export default connKopsas