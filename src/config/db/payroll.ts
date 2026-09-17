import mysql from 'mysql2/promise'
import { attachDatabasePool } from '@vercel/functions'

declare global {
  var __connPayroll: mysql.Pool | undefined
}

const connPayroll =
  global.__connPayroll ??
  mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME_PAYROLL,

    timezone: '+07:00',

    waitForConnections: true,

    connectionLimit: 2,
    maxIdle: 1,

    idleTimeout: 5000,

    queueLimit: 0,

    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  })

global.__connPayroll = connPayroll

attachDatabasePool(connPayroll)

connPayroll.on('connection', () => {
  console.log('Database Payroll: koneksi baru dibuat')
})

export default connPayroll