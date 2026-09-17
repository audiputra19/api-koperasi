import mysql from 'mysql2/promise'

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
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    idleTimeout: 60000,
    maxIdle: 1,
})

global.__connPayroll = connPayroll

connPayroll.on('connection', () => {
  console.log('Database Payroll: koneksi baru dibuat')
})

export default connPayroll