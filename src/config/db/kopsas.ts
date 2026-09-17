import mysql from 'mysql2/promise'
import { attachDatabasePool } from '@vercel/functions'

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

    connectionLimit: 2,
    maxIdle: 1,

    idleTimeout: 5000,

    queueLimit: 0,

    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  })

global.__connKopsas = connKopsas

attachDatabasePool(connKopsas)

connKopsas.on('connection', () => {
  console.log('Database Kopsas: koneksi baru dibuat')
})

export default connKopsas