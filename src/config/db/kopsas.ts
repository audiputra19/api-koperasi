import mysql from 'mysql2/promise'

const connKopsas = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME_KOPSAS
});

connKopsas.getConnection()
.then(() => {
    console.log('Database Kopsas connected successfully');
})
.catch(err => {
    console.error('Database Kopsas connection failed:', err);
});

export default connKopsas;