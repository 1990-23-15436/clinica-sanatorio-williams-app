import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import pool, { lowercaseKeys } from './db.js';
import oracledb from 'oracledb';
import { sendVerificationEmail, sendAdminAuthorizationEmail, sendAppointmentEmail, COMPANY_EMAIL } from './mailer.js';
import { URLS } from '../constantes.js';
import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
dotenv.config();

const app = express();
const port = 3000;

// Configuración unificada de CORS para permitir solicitudes desde localhost e IPs de red local
app.use(cors({
  origin: true, // Permite peticiones dinámicas desde cualquier origen local/red
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Habilitar preflight para todas las rutas
app.options('*', cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_PATH = path.join(__dirname, 'public', 'uploads', 'patients');

if (!fs.existsSync(UPLOADS_PATH)) {
    fs.mkdirSync(UPLOADS_PATH, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const patientId = req.body.patient_id; 
        const patientPath = path.join(UPLOADS_PATH, String(patientId));
        
        if (!fs.existsSync(patientPath)) {
            fs.mkdirSync(patientPath, { recursive: true });
        }

        cb(null, patientPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

app.get('/api/stats/summary', async (req, res) => {
    const { doctorId } = req.query;

    try {
        const [patientRows] = await pool.query('SELECT COUNT(*) as total FROM Paciente');

        let appointmentsQuery = 'SELECT COUNT(*) as today FROM Appointment WHERE TRUNC(fecha_asignada) = TRUNC(SYSDATE) AND vigencia = 0';
        let queryParams = [];

        if (doctorId) {
            appointmentsQuery += ' AND id_doctor_a = :1';
            queryParams.push(doctorId);
        }

        const [appointmentRows] = await pool.query(appointmentsQuery, queryParams);

        res.json({
            success: true,
            totalPatients: patientRows[0].total,
            todayAppointments: appointmentRows[0].today
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// REGISTRO DE USUARIO Y ENVÍO DE AUTORIZACIÓN
app.post('/api/register', async (req, res) => {
    // Se elimina 'role' de la desestructuración
    const { dpi, names, lastnames, birthDate, phone, email, password, confirmPassword } = req.body.formData;
    
    // Asignamos el rol de médico por defecto y de forma interna
    const rol = "P_Medico";

    if (!names || !lastnames || !email || !password || !dpi) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Las contraseñas no coinciden' });
    }

    try {
        // 1. Verificar duplicados
        const [checkExisting] = await pool.query('SELECT * FROM Perfil WHERE dpi_perfil = :1 OR email = :2', [dpi, email]);
        if (checkExisting.length > 0) {
            return res.status(400).json({ error: 'El DPI o el correo electrónico ya se encuentran registrados.' });
        }

        const token = crypto.randomBytes(16).toString('hex');

        // Convertir la fecha de nacimiento enviada desde el formulario a objeto Date para Oracle
        const parsedBirthDate = birthDate ? new Date(birthDate) : null;

        // Fecha de expiración (12 horas)
        const fechaExpira = new Date();
        fechaExpira.setHours(fechaExpira.getHours() + 12);

        // 2. Guardar primero en la base de datos
        const query = `INSERT INTO Perfil (dpi_perfil, nombres, apellidos, fecha_nacimiento, num_celular, email, password, rol, token_verificacion, tonken_expirado, perfil_autorizado, email_verificado)
                       VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10, 0, 0)`;

        await pool.query(query, [dpi, names, lastnames, parsedBirthDate, phone, email, password, rol, token, fechaExpira]);

        // 3. Enviar correos ÚNICAMENTE si la inserción en BD fue exitosa
        sendVerificationEmail(email, token, names);
        sendAdminAuthorizationEmail(COMPANY_EMAIL, token, {
            names,
            lastnames,
            dpi,
            email,
            phone,
            role: rol
        });

        res.status(201).json({ message: 'Registro iniciado. Revisa tu correo para verificar la cuenta y espera la autorización.' });
    } catch (error) {
        console.error('Error al registrar usuario:', error && error.stack ? error.stack : error);
        return res.status(500).json({ error: 'Error interno del servidor al registrar usuario' });
    }
});

// Ruta para verificar el correo electrónico del usuario
app.get('/api/verify-email', async (req, res) => {
    const { token } = req.query;
    try {
        const [sqlCheck] = await pool.query("SELECT * FROM Perfil WHERE token_verificacion = :1", [token]);
        if (sqlCheck.length === 0) {
            return res.status(400).send("<h1>Token inválido o expirado</h1>");
        }

        const sqlcheck = sqlCheck[0];
        const fechaExpira = new Date(sqlcheck.tonken_expirado);
        const ahora = new Date();

        if (ahora > fechaExpira) {
            await pool.execute('DELETE FROM Perfil WHERE id_perfil = :1', [sqlcheck.id_perfil]);
            
            return res.status(400).send(`
                <div style="text-align:center; font-family:sans-serif;">
                <h1>El enlace ha expirado</h1>
                <p>Por seguridad, los enlaces de confirmación duran 12 horas.</p>
                <a href="${URLS.FRONTEND}/register">Intenta registrarte de nuevo</a>
                </div>
            `);
        }

        const sqlUpdate = "UPDATE Perfil SET email_verificado = 1 WHERE id_perfil = :1";
        await pool.query(sqlUpdate, [sqlcheck.id_perfil]);
        return res.redirect(`${URLS.FRONTEND}/login?verified=true`);

    } catch (error) {
        console.error("Error en verificación de email:", error);
        return res.status(500).send("<h1>Error interno al activar la cuenta</h1>");
    }
});

// NUEVA RUTA: Autorización presionada por el encargado desde el correo de la empresa
app.get('/api/authorize-profile', async (req, res) => {
    const { token } = req.query;
    try {
        const [sqlCheck] = await pool.query("SELECT * FROM Perfil WHERE token_verificacion = :1", [token]);
        if (sqlCheck.length === 0) {
            return res.status(400).send("<h1 style='text-align:center;'>Token de autorización inválido o no encontrado</h1>");
        }

        const sqlUpdate = "UPDATE Perfil SET perfil_autorizado = 1 WHERE token_verificacion = :1";
        await pool.query(sqlUpdate, [token]);

        return res.send(`
            <div style="text-align:center; font-family:sans-serif; padding: 40px;">
                <h1 style="color: #28a745;">¡Registro Autorizado Exitosamente!</h1>
                <p>El médico / personal ha sido autorizado y podrá ingresar al sistema en cuanto verifique su correo electrónico.</p>
            </div>
        `);
    } catch (error) {
        console.error("Error al autorizar perfil:", error);
        return res.status(500).send("<h1>Error interno al autorizar la cuenta</h1>");
    }
});

// Ruta para iniciar sesión
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    const [query_perfil] = await pool.query(
        "SELECT id_perfil, dpi_perfil, nombres, apellidos, rol, email, num_celular AS phone, fecha_nacimiento AS birth_date FROM Perfil WHERE email = :1 AND password = :2 AND email_verificado = 1 AND perfil_autorizado = 1", 
        [email, password]
    );

    if (query_perfil.length > 0) {
        res.json({ 
            success: true, 
            user: query_perfil[0] 
        });
    } else {
        res.status(401).json({ 
            success: false, 
            message: "Credenciales inválidas, o bien la cuenta no ha sido verificada / autorizada por la administración." 
        });
    }
});

app.put('/api/profile', async (req, res) => {
    const { dpi, nombres, apellidos, email, phone} = req.body;
    
    try {
        const [result] = await pool.execute(
            'UPDATE Perfil SET nombres = :1, apellidos = :2, email = :3, num_celular = :4 WHERE dpi_perfil = :5',
            [nombres, apellidos, email, phone, dpi]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        return res.json({ 
            success: true,
            message: 'Perfil actualizado correctamente, cierra sesión para ver los cambios' 
        });

    } catch (error) {
        console.error('Profile update error:', error);
        if (error.errorNum === 1) {
            return res.status(400).json({ error: 'El nuevo DPI ya está registrado por otro usuario' });
        }
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/api/patients', async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT 
                                            id_paciente AS id, 
                                            dpi, 
                                            nombre_completo AS full_name, 
                                            fecha_hora_registro AS register_date, 
                                            nit,
                                            fecha_nacimiento AS birthDate,
                                            TRUNC(MONTHS_BETWEEN(SYSDATE, fecha_nacimiento) / 12) AS age, 
                                            email, 
                                            direccion AS address, 
                                            telefono AS phone, 
                                            genero AS gender, 
                                            peso AS weight, 
                                            sintomas AS symptoms, 
                                            diagnostico AS medical_condition, 
                                            estado AS status 
                                        FROM Paciente ORDER BY fecha_hora_registro DESC`);

        res.json(rows);
    } catch (error) {
        console.error('Error al obtener pacientes:', error);
        res.status(500).json({ error: 'Error al cargar los expedientes' });
    }
});

app.get('/api/patients/:id', async (req, res) => {
    try {
        const [patients] = await pool.query(
            `SELECT 
                id_paciente AS id, 
                dpi, 
                nombre_completo AS full_name, 
                fecha_hora_registro AS register_date, 
                nit, 
                edad_registrada AS age,
                fecha_nacimiento AS birthDate, 
                email, 
                direccion AS address, 
                telefono AS phone, 
                genero AS gender, 
                peso AS weight, 
                sintomas AS symptoms, 
                diagnostico AS medical_condition, 
                estado AS status 
            FROM Paciente
            WHERE id_paciente = :1 
            ORDER BY fecha_hora_registro DESC`, [req.params.id]);

        const patient = patients[0];
        if (!patient) return res.status(404).json({ error: "Paciente no encontrado" });

        const [images] = await pool.query(
            'SELECT img_name FROM Img_Pacientes WHERE paciente_id = :1 ORDER BY fecha_creacion DESC', 
            [patient.id]
        );

        patient.img_list = images.map(row => row.img_name);
        res.json(patient);
    } catch (error) {
        console.error('Error al obtener pacientes:', error);
        res.status(500).json({ error: 'Error al cargar los expedientes' });
    }
});

app.get('/api/referrals/patient/:id', async (req, res) => {
    const {id} = req.params;
    try{
        const referidoData = 
        `SELECT
            id_referido AS id,
            nombre_completo AS full_name,
            dpi,
            nit,
            telefono AS phone,
            email,
            direccion AS address,
            tipo_contacto AS relation_type
        FROM Referido
        WHERE paciente_id = :1
        ORDER BY fecha_registro DESC`;

        const [rows] = await pool.execute(referidoData, [id]);
        res.json(rows);        
    } catch (error) {
        console.error('Error al obtener referido:', error);
        res.status(500).json({ error: 'Error al cargar los expedientes' });
    }
});

app.post('/api/referrals', async (req, res) => {
    const refData = req.body;
    try {
        const queryPatient = `INSERT INTO Referido (dpi, nombre_completo, nit, email, direccion, telefono, tipo_contacto, paciente_id)
                               VALUES (:1, :2, :3, :4, :5, :6, :7, :8)`;

        await pool.query(queryPatient, [refData.dpi, refData.full_name, refData.nit, refData.email, refData.address, refData.phone, refData.relation_type, refData.id_patient]);

        res.status(201).json({ message: 'Se agregó un referido' });
    } catch (error) {
        console.error('Error al registrar referido:', error);
        res.status(500).json({ error: 'Error en el registro' });
    }
});

app.use('/uploads/patients', express.static(UPLOADS_PATH));

app.post('/api/upload-image', upload.single('images'), async (req, res) => { 
    if (!req.file) {
        return res.status(400).json({ error: "No se recibió ningún archivo" });
    }

    try {
        const patientId = req.body.patient_id;
        const imgName = req.file.filename;
        await pool.query('INSERT INTO Img_Pacientes (paciente_id, img_name) VALUES (:1, :2)', [patientId, imgName]);
    } catch (error) {
        console.error('Error al guardar imagen en la base de datos:', error);
        return res.status(500).json({ error: 'Error al guardar la imagen' });
    }
    
    res.json({ fileName: req.file.filename });
});

app.put('/api/patients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const datos = req.body;

        // SOLUCIÓN: Convertir el string a objeto Date al actualizar
        const parsedBirthDate = datos.birthDate ? new Date(datos.birthDate) : null;

        const [result] = await pool.execute(`UPDATE Paciente SET 
                                        dpi = :1, 
                                        nombre_completo = :2, 
                                        nit = :3, 
                                        edad_registrada = :4,
                                        fecha_nacimiento = :5, 
                                        email = :6, 
                                        direccion = :7, 
                                        telefono = :8, 
                                        genero = :9, 
                                        peso = :10, 
                                        sintomas = :11,
                                        diagnostico = :12,
                                        estado = :13 
                                    WHERE id_paciente = :14`, 
                                    [datos.dpi, 
                                        datos.full_name, datos.nit, 
                                        datos.age, 
                                        parsedBirthDate, // Pasamos la fecha convertida
                                        datos.email, 
                                        datos.address, datos.phone, 
                                        datos.gender, datos.weight, 
                                        datos.symptoms, datos.medical_condition, 
                                        datos.status, id
                                    ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ success: true, message: "Actualizado correctamente" });
    } catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/patients', async (req, res) => {
    const referido = req.body.referido;
    const {dpi, full_name, nit, age, birthDate, gender, email, address, phone, symptoms} = req.body.patient;

    const connection = await pool.getConnection();

    try {
        // SOLUCIÓN: Convertir el string a un objeto Date para Oracle
        const parsedBirthDate = birthDate ? new Date(birthDate) : null;

        const queryPatient = `INSERT INTO Paciente (dpi, nombre_completo, nit, email, edad_registrada, fecha_nacimiento, genero, direccion, telefono, sintomas, estado)
                               VALUES (:dpi, :full_name, :nit, :email, :age, :birthDate, :gender, :address, :phone, :symptoms, :estado)
                               RETURNING id_paciente INTO :new_id`;

        // Pasamos 'parsedBirthDate' en lugar de 'birthDate'
        const resultPatient = await connection.execute(queryPatient, {
            dpi, full_name, nit, email, age, 
            birthDate: parsedBirthDate, 
            gender, address, phone, symptoms,
            estado: 'Activo',
            new_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
        }, { autoCommit: false });

        const resultIdPatient = resultPatient.outBinds.new_id[0];

        if (referido && referido.full_name && referido.dpi) {
            await connection.execute(
            'INSERT INTO Referido (nombre_completo, dpi, nit, telefono, email, direccion, tipo_contacto, paciente_id) VALUES (:1, :2, :3, :4, :5, :6, :7, :8)',
            [referido.full_name, referido.dpi, referido.nit, referido.phone, referido.email, referido.address, referido.relation_type, resultIdPatient],
            { autoCommit: false }
            );
            await connection.commit();
            res.status(201).json({ message: 'Paciente y referido registrados' });
        } else {
            await connection.commit();
            res.status(201).json({ message: 'Paciente registrado' });
        }

    } catch (error) {
        await connection.rollback();
        console.error('Error al registrar paciente:', error);
        res.status(500).json({ error: 'Error en el registro' });
    } finally {
        await connection.close();
    }
});

app.delete('/api/patients', async (req, res) => {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "No se proporcionaron IDs válidos" });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const placeholders = ids.map((_, i) => `:${i + 1}`).join(', ');

        const imagesResult = await connection.execute(
            `SELECT img_name FROM Img_Pacientes WHERE paciente_id IN (${placeholders})`,
            ids,
            { autoCommit: false }
        );
        const images = lowercaseKeys(imagesResult.rows);

        images.forEach(img => {
            const filePath = path.join(__dirname, 'public/uploads/patients', img.img_name);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    console.error(`Error al borrar archivo físico ${img.img_name}:`, err);
                }
            }
        });

        const deleteResult = await connection.execute(
            `DELETE FROM Paciente WHERE id_paciente IN (${placeholders})`,
            ids,
            { autoCommit: false }
        );

        await connection.commit();
        
        res.json({ 
            success: true, 
            message: `Se eliminaron ${deleteResult.rowsAffected} expedientes y sus datos asociados.` 
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error en la eliminación con CASCADE:", error);
        res.status(500).json({ error: "Error interno", details: error.message });
    } finally {
        if (connection) await connection.close();
    }
});

app.delete('/api/referrals', async (req, res) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "No se proporcionaron IDs válidos" });
    }

    try {
        const placeholders = ids.map((_, i) => `:${i + 1}`).join(', ');
        const [rows] = await pool.query(
            `DELETE FROM Referido WHERE id_referido IN (${placeholders})`,
            ids
        );

        res.json({ 
            success: true, 
            message: `Se eliminaron ${rows.affectedRows} contactos.` 
        });

    } catch (error){
        console.error("Error en la eliminación: ", error);
        res.status(500).json({ error: "Error interno", details: error.message });
    }
});

app.post('/api/appointments', async (req, res) => {
    let appointmentDate;

    const { dpi, date, time } = req.body.patient;
    if (!dpi || !date || !time) {
        return res.status(400).json({ 
            error: 'Todos los campos son obligatorios.' 
        });
    } else {
        appointmentDate = new Date(`${date}T${time}`);
        if (isNaN(appointmentDate.getTime())) {
            return res.status(400).json({ 
                error: 'Fecha u hora no válidas.' 
            });
        }
    }

    try {
        const [rows] = await pool.query('SELECT id_paciente FROM Paciente WHERE dpi = :1', [dpi]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }

        const queryCita = 'INSERT INTO Appointment (id_paciente_a, fecha_asignada) VALUES (:1, :2)';
        await pool.query(queryCita, [rows[0].id_paciente, appointmentDate]);
        res.status(201).json({ message: 'Cita registrada correctamente' });
    } catch (error) {
        console.error('Error al registrar cita:', error);
        return res.status(500).json({ error: 'Error del servidor' });
    }
});

app.get('/api/appointments/', async (req, res) => {
    const { month, year, doctor_id } = req.query;
    
    try {
        let query = `
            SELECT 
                c.id_appointment as id,
                c.id_doctor_a as doctor_id,
                c.fecha_asignada as appointment_date,
                p.nombre_completo as patient_name,
                p.telefono as patient_phone,
                p.edad_registrada as patient_age,
                p.genero as patient_gender,
                p.sintomas as patient_symptoms
            FROM Appointment c
            JOIN Paciente p ON c.id_paciente_a = p.id_paciente
            WHERE c.aceptada = 1
        `;

        const binds = {};

        if (doctor_id) {
            query += ` AND c.id_doctor_a = :doctor_id`;
            binds.doctor_id = doctor_id;
        }

        if (month && year) {
            query += ` AND EXTRACT(MONTH FROM c.fecha_asignada) = :month_val AND EXTRACT(YEAR FROM c.fecha_asignada) = :year_val`;
            binds.month_val = month;
            binds.year_val = year;
        }

        query += ` ORDER BY c.fecha_asignada ASC`;

        const [rows] = await pool.execute(query, binds);
        res.json(rows);
        
    } catch (error) {
        console.error("Error al obtener agenda:", error);
        res.status(500).json({ error: "Error al cargar la agenda" });
    }
});

app.get('/api/appointments/pending', async (req, res) => {
    const [rows] = await pool.execute(`SELECT 
                                        c.id_appointment as id, 
                                        c.id_paciente_a as patient_id, 
                                        c.fecha_asignada as appointment_date,
                                        c.vigencia as vigencia,
                                        p.nombre_completo as patient_name,
                                        p.telefono as patient_phone,
                                        p.edad_registrada as patient_age,
                                        p.genero as patient_gender,
                                        p.sintomas as patient_symptoms
                                        FROM Appointment c
                                        INNER JOIN Paciente p ON c.id_paciente_a = p.id_paciente 
                                        WHERE aceptada = 0 ORDER BY fecha_asignada ASC`
                                    );
    res.json(rows);
});

app.get('/api/appointments/:doctorId', async (req, res) => {
    try {
        const query = `
            SELECT 
                c.id_appointment as id,
                c.id_paciente_a as patient_id,
                c.id_doctor_a as doctor_id,
                c.fecha_registro as appointment_register,
                c.fecha_asignada as appointment_date,
                c.aceptada as is_accepted,
                p.nombre_completo as patient_name
            FROM Appointment c 
            INNER JOIN Paciente p ON c.id_paciente_a = p.id_paciente
            WHERE c.id_doctor_a = :1 AND c.aceptada = 1
            ORDER BY c.fecha_asignada ASC
        `;
        
        const [rows] = await pool.execute(query, [req.params.doctorId]);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener citas:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

app.put('/api/appointments/:id/accept', async (req, res) => {
    const { doctor_id, is_accepted } = req.body;
    let date, time, nombreD;
    try {
        const query = 'UPDATE Appointment SET aceptada = :1, id_doctor_a = :2 WHERE id_appointment = :3';
        const [result] = await pool.execute(query, [is_accepted, doctor_id, req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }

        const queryEmail = `
                        SELECT
                            c.fecha_asignada AS "date",
                            p.email AS emailP,
                            p.nombre_completo AS nombreP,
                            pf.email AS emailPf,
                            pf.nombres AS nombrePf,
                            pf.apellidos AS apellidosPf
                        FROM Appointment c
                        JOIN Paciente p ON c.id_paciente_a = p.id_paciente
                        JOIN Perfil pf ON c.id_doctor_a = pf.id_perfil
                        WHERE c.id_appointment = :1
                        `;
        const [rows] = await pool.query(queryEmail,[req.params.id]);
        const row = rows[0];
        if(row && row.date){
            const dt = new Date(row.date);
            date =  dt.toISOString().split('T')[0];
            time = dt.toTimeString().split(' ')[0];
            nombreD = row.nombrePf + " " + row.apellidosPf;
            sendAppointmentEmail(row.emailPf, row.emailP, row.nombreP, nombreD, date, time);
        }
        
        res.json({ success: true, message: 'Cita aceptada' });
    } catch (error) {
        console.error("Error al aceptar cita:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

app.put('/api/appointments/:id/unassign', async (req, res) => {
    const { id } = req.params;
    try {
        const query = 'UPDATE Appointment SET aceptada = 0, id_doctor_a = NULL WHERE id_appointment = :1';
        const [result] = await pool.execute(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }

        res.json({ success: true, message: 'Cita desasignada y devuelta a pendientes' });
    } catch (error) {
        console.error("Error al desasignar cita:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

app.listen(port, '::', () => {
  console.log(`Servidor (Oracle) escuchando en el puerto ${port}`);
});