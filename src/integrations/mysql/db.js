import mysql2 from 'mysql2/promise.js';
import mysql from 'mysql2';
import { DB } from '../constantes.js';

const pool = mysql2.createPool({
  host: DB.DB_HOST,
  user: DB.DB_USER,
  password: DB.DB_PASSWORD,
  database: DB.DB_NAME,
  port: DB.PORT_DB
});

export const db = mysql.createConnection({
  host: DB.DB_HOST,
  user: DB.DB_USER,
  password: DB.DB_PASSWORD,
  database: DB.DB_NAME,
  port: DB.PORT_DB
});

export default pool;