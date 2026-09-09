import oracledb from 'oracledb';
import { DB } from '../constantes.js';

// node-oracledb corre en modo "Thin" desde la version 6 en adelante: no
// necesita el Oracle Instant Client instalado en el servidor, se conecta
// directo por red (igual de simple que mysql2 en ese sentido).

// mysql2 devuelve cada fila como un objeto { columna: valor }. Por defecto
// oracledb devuelve arreglos posicionales; con esto lo igualamos para no
// tener que tocar como server.js lee cada fila (row.nombre_completo, etc.).
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// mysql2 confirma (commit) cada INSERT/UPDATE/DELETE automaticamente.
// Oracle no lo hace por defecto: sin esto, cualquier cambio se revertiria
// al cerrar la conexion. Este valor es el default para llamadas sueltas;
// las rutas que arman una transaccion real (varias sentencias que deben
// tener exito juntas) lo desactivan puntualmente con autoCommit:false y
// hacen su propio commit()/rollback() -ver POST/DELETE /api/patients en
// server.js.
oracledb.autoCommit = true;

// DB.DB_NAME ahora debe ser el "service name" de la base conectable, no un
// nombre de base al estilo MySQL. Si usas la imagen gvenzl/oracle-free tal
// como la tienes en Docker, ese valor es "FREEPDB1". DB.DB_USER y
// DB.DB_PASSWORD son las credenciales del usuario que creaste con
// "createAppUser" (sanatorio_williams), no las de system/sys.
const oraclePool = await oracledb.createPool({
    user: DB.DB_USER,
    password: DB.DB_PASSWORD,
    connectString: `${DB.DB_HOST}:${DB.PORT_DB}/${DB.DB_NAME}`,
    poolMin: 2,
    poolMax: 10,
    poolIncrement: 1
});

// Oracle devuelve los nombres de columna en MAYUSCULAS salvo que el alias
// vaya entre comillas dobles en el SQL (ej. AS "full_name"). En vez de
// editar cada alias de cada consulta de server.js, normalizamos las llaves
// a minuscula una sola vez, aqui.
export function lowercaseKeys(rows) {
    return rows.map(row => {
        const out = {};
        for (const key in row) out[key.toLowerCase()] = row[key];
        return out;
    });
}

// Envoltorio para que "const [rows] = await pool.query(sql, params)" siga
// funcionando igual que con mysql2. connection.execute() de oracledb
// devuelve un OBJETO ({rows, rowsAffected, outBinds, ...}), no un arreglo
// [rows, fields] como mysql2. Aqui pedimos una conexion del pool,
// ejecutamos, la liberamos, y devolvemos [rows, result] para no tener que
// reescribir cada "const [algo] = await pool.query(...)" de server.js.
async function run(sql, binds = [], opts = {}) {
    const connection = await oraclePool.getConnection();
    try {
        const result = await connection.execute(sql, binds, opts);
        const rows = result.rows ? lowercaseKeys(result.rows) : [];
        rows.affectedRows = result.rowsAffected ?? 0; // compatibilidad con el nombre que usa mysql2
        if (result.outBinds) rows.outBinds = result.outBinds;
        return [rows, result];
    } finally {
        await connection.close();
    }
}

// getConnection() se deja pasar directo al pool real de oracledb (no al
// envoltorio de arriba): las rutas que arman una transaccion piden su
// propia conexion y llaman a connection.execute() varias veces antes de
// hacer commit/rollback, igual que hacian con mysql2 -solo que oracledb no
// tiene beginTransaction() (no hace falta: alcanza con autoCommit:false en
// cada execute) ni release() (se usa close()).
const pool = {
    query: run,
    execute: run,
    getConnection: () => oraclePool.getConnection()
};

export const db = pool; // se mantiene por si algun otro archivo importa { db }
export default pool;