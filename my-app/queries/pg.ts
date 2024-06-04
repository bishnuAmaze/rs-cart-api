import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: +`${process.env.DB_PORT}`,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

pool.query('SELECT NOW()', (err, res) => {
  console.log(err, res);
  pool.end();
});
