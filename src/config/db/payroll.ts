import mysql from 'mysql2/promise'

const connPayroll = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME_PAYROLL
});

connPayroll.getConnection()
.then(() => {
    console.log('Database Payroll connected successfully');
})
.catch(err => {
    console.error('Database Payroll connection failed:', err);
});

export default connPayroll;