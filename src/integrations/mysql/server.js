
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import pool from './db.js';
import { sendVerificationEmail, sendAppointmentEmail } from './mailer.js';
import { URLS } from '../constantes.js';
import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
            fs.mkdirSync(patientPath, { recursive: true }); // recursive: true crea carpetas intermedias
        }

        cb(null, patientPath);
    },
    filename: (req, file, cb) => {
        // Usamos el nombre que ya viene generado desde el frontend
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

app.use(cors({
  origin: URLS.FRONTEND, // Reemplaza exactamente con la URL de tu frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get('/api/stats/summary', async (req, res) => {
    const { doctorId } = req.query; // El frontend envía esto en los params

    try {
        // 1. Contar pacientes totales
        const [patientRows] = await pool.query('SELECT COUNT(*) as total FROM Paciente');
        
        // 2. Contar citas de HOY para este médico específico
        // Usamos CURDATE() para obtener solo las del día actual
        let appointmentsQuery = 'SELECT COUNT(*) as today FROM Appointment WHERE DATE(fecha_asignada) = CURDATE() AND vigencia = 0';
        let queryParams = [];

        if (doctorId) {
            appointmentsQuery += ' AND id_doctor_a = ?';
            queryParams.push(doctorId);
        }

        const [appointmentRows] = await pool.query(appointmentsQuery, queryParams);

        // Enviamos ambos datos al frontend
        res.json({
            success: true,
            totalPatients: patientRows[0].total,
            todayAppointments: appointmentRows[0].today
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/register', async (req, res) => {
    const {  dpi,names, lastnames, birthDate, phone, email, password, confirmPassword, role} = req.body.formData;
    let rol;

    if (role == "medico") {
        rol = "P_Medico";
    } else if (role == "secretario") {
        rol = "P_Admin";
    } else {
        return res.status(400).json({ error: 'Rol no válido' });
    }


    const [queryCheckMedico] = await pool.query('SELECT * FROM Medicos WHERE dpi_medico = ?', [dpi]);  
    if (queryCheckMedico.length === 0) {
        console.log("El DPI no está autorizado para registrarse.");
        return res.status(500).json({ message: "El DPI no está autorizado para registrarse." });
    } else if (!rol === "P_Medico") {
        console.log("El DPI no está autorizado para registrarse.");
        return res.status(500).json({ message: "El DPI no está autorizado para registrarse." });
    }

    const [queryCheckAdmin] = await pool.query('SELECT * FROM Personal_admin WHERE dpi_admin = ?', [dpi]);
    if (queryCheckAdmin.length === 0 && !rol === "P_Admin") {
        console.log("El DPI no está autorizado para registrarse.");
        return res.status(500).json({ message: "El DPI no está autorizado para registrarse." });
    } else if (!rol === "P_Admin") {
        console.log("El DPI no está autorizado para registrarse.");
        return res.status(500).json({ message: "El DPI no está autorizado para registrarse." });
    }

    if (!names || !lastnames || !email || !password) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    
    try {
        const queryCheckPerfil = 'SELECT * FROM Perfil WHERE dpi_perfil = ?';
        if (queryCheckPerfil.length === 1) {
            console.log("El DPI ya esta registrado");
            return res.status(500).json({ message: "El DPI no está autorizado para registrarse." });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Las contraseñas no coinciden' });
        }
        const token = crypto.randomBytes(16).toString('hex');
        sendVerificationEmail(email, token, names);
        

        const fechaExpira = new Date();
        fechaExpira.setHours(fechaExpira.getHours() + 12); // El token expira en 12 horas        
        
        

        const query = 'INSERT INTO Perfil (dpi_perfil, nombres, apellidos, fecha_nacimiento, num_celular, email, password, rol, token_verificacion, tonken_expirado, perfil_autorizado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)';

        await pool.query(query, [dpi, names, lastnames, birthDate, phone, email, confirmPassword, rol, token, fechaExpira]);
        

        res.status(201).json({ message: 'Usuario creado. Verifica la bandeja de entrada de tu correo.' });
    } catch (error) {
        console.error('Error al registrar usuario:', error && error.stack ? error.stack : error);
        return res.status(500).json({ error: 'Error del servidor' });
    }
});


// Ruta para verificar el correo electrónico
app.get('/api/verify-email', async (req, res) => {
    const { token } = req.query;
    try {
        // Buscamos si existe un usuario con ese token
        const [sqlCheck] = await pool.query("SELECT * FROM Perfil WHERE token_verificacion = ?", [token]);
        if (sqlCheck.length === 0) {
            return res.status(400).send("<h1>Token inválido o expirado</h1>");
        }

        const sqlcheck = sqlCheck[0]


        const fechaExpira = new Date(sqlcheck.tonken_expirado);
        const ahora = new Date();
        console.log('Si llego3');
        // Comprobamos si el tiempo ya pasó
        if (ahora > fechaExpira) {
            const [sqlSearchDelete] = await pool.query("SELECT id_perfil FROM Perfil WHERE token_verificacion = ?", [token]);
            const sqlsearchdelete = sqlSearchDelete[0]
            const sqlDelete = 'DELETE FROM Perfil WHERE id_perfil = ?';
            await pool.execute(sqlDelete,[sqlsearchdelete.id_perfil])
            
            return res.status(400).send(`
                <div style="text-align:center; font-family:sans-serif;">
                <h1>El enlace ha expirado</h1>
                <p>Por seguridad, los enlaces de confirmación solo duran 24 horas.</p>
                <a href="${URLS.FRONTEND}/register">Intenta registrarte de nuevo</a>
                </div>
            `);
        
        }

        // Si existe, lo marcamos como verificado y borramos el token
        const sqlUpdate = "UPDATE Perfil SET email_verificado = 1, token_verificacion = NULL WHERE token_verificacion = ?";
        await pool.query(sqlUpdate, [token]);
        return res.redirect(`${URLS.FRONTEND}/login?verified=true`);

    }catch (error) {
        console.error("Error en verificación de email:", error);
        return res.status(500).send("<h1>Error interno al activar la cuenta</h1>");
    }
});


// Ruta para iniciar sesión
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    // Buscamos al usuario por email y password (luego podrías usar bcrypt para seguridad)
    const [query_perfil] = await pool.query("SELECT id_perfil, dpi_perfil, nombres, apellidos, rol, email, num_celular AS phone, fecha_nacimiento AS birth_date FROM Perfil WHERE email = ? AND password = ? AND email_verificado = 1 AND perfil_autorizado = 1", [email, password]);

    if (query_perfil.length > 0) {
        // Si hay coincidencia, devolvemos los datos del usuario (sin la contraseña)
        res.json({ 
            success: true, 
            user: query_perfil[0] 
        });
    } else {
        // Si no hay coincidencia
        res.status(401).json({ 
            success: false, 
            message: "Credenciales inválidas. Verifica tu correo y contraseña." 
        });
    }
});

app.put('/api/profile', async (req, res) => {
    // Recibimos el dpi_original para saber a quién actualizar, además de los nuevos datos
    const { dpi, nombres, apellidos, email, phone} = req.body;
    
    try {
        // Ejecutar la actualización
        const [result] = await pool.execute(
            'UPDATE Perfil SET nombres = ?, apellidos = ?, email = ?, num_celular = ? WHERE dpi_perfil = ?',
            [nombres, apellidos, email, phone, dpi]
        );

        // 3. Verificar si se actualizó algo
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        return res.json({ 
            success: true,
            message: 'Perfil actualizado correctamente, cierra sesión para ver los cambios' 
        });

    } catch (error) {
        console.error('Profile update error:', error);
        // Si el error es por DPI duplicado (porque el nuevo DPI ya existe)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El nuevo DPI ya está registrado por otro usuario' });
        }
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/api/patients', async (req, res) => {
    try {
        // Consulta para obtener los pacientes
        // Asegúrate de que los nombres de las columnas coincidan con tu tabla en MariaDB
        const [rows] = await pool.query(`SELECT 
                                            id_paciente AS id, 
                                            dpi, 
                                            nombre_completo AS full_name, 
                                            fecha_hora_registro AS register_date, 
                                            nit,
                                            fecha_nacimiento AS birthDate,
                                            TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE()) AS age, 
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
        // Consulta para obtener los pacientes
        // Asegúrate de que los nombres de las columnas coincidan con tu tabla en MariaDB
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
            WHERE id_paciente = ? 
            ORDER BY fecha_hora_registro DESC`, [req.params.id]);

        const patient = patients[0];
        if (!patient) return res.status(404).json({ error: "Paciente no encontrado" });

        const [images] = await pool.query(
            'SELECT img_name FROM Img_Pacientes WHERE paciente_id = ? ORDER BY fecha_creacion DESC', 
            [patient.id]
        );

        // Esto es lo que alimenta el .map() en tu galería
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
        WHERE paciente_id = ?
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
    
    
    const connection = await pool.getConnection(); // Obtener conexión para transacción

    try {
        await connection.beginTransaction();
        const queryPatient = 'INSERT INTO Referido (dpi, nombre_completo, nit, email, direccion, telefono, tipo_contacto, paciente_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        

        // 1. Insertar Paciente
        
        await pool.query(queryPatient,[refData.dpi, refData.full_name, refData.nit, refData.email, refData.address, refData.phone, refData.relation_type, refData.id_patient]);
        
        await connection.commit();
        res.status(201).json({ message: 'Se agrego un referido' });
    }catch (error){
        await connection.rollback();
        res.status(500).json({ error: 'Error en el registro' });
    }
        
        
});


app.use('/uploads/patients', express.static(UPLOADS_PATH));

app.post('/api/upload-image', upload.single('images'), (req, res) => { 
    if (!req.file) {
        return res.status(400).json({ error: "No se recibió ningún archivo" });
    }

    try {
        const patientId = req.body.patient_id; // Asegúrate de que este valor se establezca correctamente antes de esta ruta
        const imgName = req.file.filename;
        pool.query('INSERT INTO Img_Pacientes (paciente_id, img_name) VALUES (?, ?)', [patientId, imgName]);
    } catch (error) {
        console.error('Error al guardar imagen en la base de datos:', error);
        return res.status(500).json({ error: 'Error al guardar la imagen' });
    }
    
    res.json({ fileName: req.file.filename });
});

// RUTA 2: Para guardar los datos en la base de datos (JSON normal)
app.put('/api/patients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const datos = req.body; // Al ser JSON, Express ya lo convierte en objeto


        const [result] = await pool.execute(`UPDATE Paciente SET 
                                        dpi = ?, 
                                        nombre_completo = ?, 
                                        nit = ?, 
                                        edad_registrada = ?,
                                        fecha_nacimiento = ?, 
                                        email = ?, 
                                        direccion = ?, 
                                        telefono = ?, 
                                        genero = ?, 
                                        peso = ?, 
                                        sintomas = ?,
                                        diagnostico = ?,
                                        estado = ? 
                                    WHERE id_paciente = ?`, 
                                    [datos.dpi, 
                                        datos.full_name, datos.nit, 
                                        datos.age, datos.birthDate, datos.email, 
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
        res.status(500).json({ error: error.message }); // Esto es lo que ves en el navegador
    }
});

app.post('/api/patients', async (req, res) => {
    const referido = req.body.referido;
    const {dpi, full_name, nit, age, birthDate, gender, email, address, phone, symptoms} = req.body.patient;
    
    
    const connection = await pool.getConnection(); // Obtener conexión para transacción

    try {
        await connection.beginTransaction();
        const queryPatient = 'INSERT INTO Paciente (dpi, nombre_completo, nit, email, edad_registrada, fecha_nacimiento, genero, direccion, telefono, sintomas, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        

        // 1. Insertar Paciente
        
        const [resultPatient] = await pool.query(queryPatient,[dpi, full_name, nit, email, age, birthDate, gender, address, phone, symptoms, 'Activo']);
        
        const resultIdPatient = resultPatient.insertId;

        // 2. Si hay referido, insertarlo usando el patientId como llave foránea
        if (referido && referido.full_name && referido.dpi) {
            await connection.query(
            'INSERT INTO Referido (nombre_completo, dpi, nit, telefono, email, direccion, tipo_contacto, paciente_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [referido.full_name, referido.dpi, referido.nit, referido.phone, referido.email, referido.address, referido.relation_type, resultIdPatient]
            );
            await connection.commit();
            res.status(201).json({ message: 'Paciente y referido registrados' });
            console.log(birthDate, age);
        } else {
            await connection.commit();
            console.log(birthDate, age);
            res.status(201).json({ message: 'Paciente registrados' });
        }

        
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: 'Error en el registro' });
    } finally {
        connection.release();
    }
});

app.delete('/api/patients', async (req, res) => {
    const { ids } = req.body; // Se espera un arreglo: [1, 2, 3]
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "No se proporcionaron IDs válidos" });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. OBTENER NOMBRES DE FOTOS PARA BORRAR ARCHIVOS FÍSICOS
        // Hacemos esto ANTES de borrar al paciente, porque después ya no existirán los registros
        const [images] = await connection.query(
            'SELECT img_name FROM Img_Pacientes WHERE paciente_id IN (?)', 
            [ids]
        );

        // 2. ELIMINAR ARCHIVOS DEL DISCO
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

        // 3. BORRAR AL PACIENTE (EL "CASCADE" HARÁ EL RESTO)
        // Al borrar aquí, MariaDB borrará automáticamente Referidos e Img_Pacientes
        const [result] = await connection.query(
            'DELETE FROM Paciente WHERE id_paciente IN (?)', 
            [ids]
        );

        await connection.commit();
        
        res.json({ 
            success: true, 
            message: `Se eliminaron ${result.affectedRows} expedientes y sus datos asociados (fotos y referidos).` 
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error en la eliminación con CASCADE:", error);
        res.status(500).json({ error: "Error interno", details: error.message });
    } finally {
        if (connection) connection.release();
    }
});

app.delete('/api/referrals', async (req, res) => {
    const { ids } = req.body;
    let connection;
    try{
        connection = await pool.getConnection();
        const [result] = await connection.query(
            'DELETE FROM Referido WHERE id_referido IN (?)', 
            [ids]
        );

        await connection.commit();
        
        res.json({ 
            success: true, 
            message: `Se eliminaron ${result.affectedRows} contactos o encargados.` 
        });

    } catch (error){
        if (connection) await connection.rollback();
        console.error("Error en la eliminación: ", error);
        res.status(500).json({ error: "Error interno", details: error.message });

    }
});



app.post('/api/appointments', async (req, res) => {
    let appointmentDate;

    const { dpi, date, time } = req.body.patient;
    if (!dpi || !date || !time) {
        return res.status(400).json({ 
        error: 'Todos los campos (DPI, fecha y hora) son obligatorios.' 
        });
    } else {
        appointmentDate = new Date(`${date}T${time}`);
        if (isNaN(appointmentDate.getTime())) {
            return res.status(400).json({ 
                error: 'Fecha u hora no válidas. Asegúrate de usar el formato correcto.' 
            });
        }
    }

    

    try {

        const [rows] = await pool.query('SELECT id_paciente FROM Paciente WHERE dpi = ?', [dpi]);
        const users = rows;

        if (users.length === 0) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        } else{
            console.log('Paciente encontrado con ID:', users[0].id_paciente);
        }

        const queryCita = 'INSERT INTO Appointment (id_paciente_a, fecha_asignada) VALUES (?, ?)';
        await pool.query(queryCita, [users[0].id_paciente, appointmentDate]);
        res.status(201).json({ message: 'Cita registrada correctamente' });
    } catch (error) {
        console.error('Error al registrar cita:', error);
        return res.status(500).json({ error: 'Error del servidor' });
    }
});

app.get('/api/appointments/', async (req, res) => {
    const { month, year, doctor_id } = req.query; // Extraemos los parámetros de la URL
    
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
        
        const params = [];

        // Filtro por Doctor (Si el usuario es médico o si la secretaria eligió uno)
        if (doctor_id) {
            query += ` AND c.id_doctor_a = ?`;
            params.push(doctor_id);
        }

        // FILTRO DINÁMICO POR MES Y AÑO
        if (month && year) {
            query += ` AND MONTH(c.fecha_asignada) = ? AND YEAR(c.fecha_asignada) = ?`;
            params.push(month, year);
        }

        query += ` ORDER BY c.fecha_asignada ASC`;

        const [rows] = await pool.execute(query, params);
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
        // Hacemos un JOIN con la tabla de Pacientes para traer el nombre
        // Ordenamos por fecha y hora de la más próxima a la más lejana
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
            WHERE c.id_doctor_a = ? AND c.aceptada = 1
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
        const query = 'UPDATE Appointment SET aceptada = ?, id_doctor_a = ? WHERE id_appointment = ?';
        const [result] = await pool.execute(query, [is_accepted, doctor_id, req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }
        const queryEmail = `
                        SELECT
                            c.fecha_asignada AS date,
                            p.email AS emailP,
                            p.nombre_completo AS nombreP,
                            pf.email AS emailPf,
                            pf.nombres AS nombrePf,
                            pf.apellidos AS apellidosPf
                        FROM Appointment c
                        JOIN Paciente p ON c.id_paciente_a = p.id_paciente
                        JOIN Perfil pf ON c.id_doctor_a = pf.id_perfil
                        WHERE c.id_appointment = ?;
                        `
        const [rows] = await pool.query(queryEmail,[req.params.id]);
        const row = rows[0]
        if(row.date){
            const dt = new Date(row.date)
            date =  dt.toISOString().split('T')[0]
            time = dt.toTimeString().split(' ')[0]
            nombreD = row.nombrePf + " " + row.apellidosPf
        }
        sendAppointmentEmail(row.emailPf, row.emailP, row.nombreP, nombreD, date, time)
        
        res.json({ success: true, message: 'Cita aceptada' });
    } catch (error) {
        console.error("Error al aceptar cita:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

app.put('/api/appointments/:id/unassign', async (req, res) => {
    const { id } = req.params;
    try {
        // Ponemos aceptada en 0 (falso) e id_doctor_a en NULL
        const query = 'UPDATE Appointment SET aceptada = 0, id_doctor_a = NULL WHERE id_appointment = ?';
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
  console.log(`Servidor MySQL escuchando en el puerto ${port}`);
});

//BUSCA EL USUARIO CONFIRMADO