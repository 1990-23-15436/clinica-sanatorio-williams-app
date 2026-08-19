# 🏥 Clinic Management System - Gestión Clínica Integral

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

Este es un sistema web robusto diseñado para la digitalización y gestión de procesos en una clínica médica. El sistema permite la interacción fluida entre pacientes (registro y citas) y personal médico (gestión de expedientes, agenda y estadísticas).

## 🚀 Funcionalidades Principales

### 🧑‍over 🩺 Vista del Paciente
- **Registro de Pacientes:** Formulario dinámico para nuevos pacientes con validación de datos.
- **Agendamiento de Citas:** Interfaz intuitiva para que el paciente solicite consultas médicas de forma autónoma.
- **Página de Inicio Personalizada:** Landing page con acceso rápido a servicios médicos.

### 👨‍⚕️ Panel Administrativo (Médicos/Staff)
- **Dashboard de Control:** Visualización en tiempo real de estadísticas (total de pacientes, citas del día) mediante integración con API.
- **Agenda Médica:** Calendario interactivo para visualizar y gestionar citas aceptadas.
- **Gestión de Citas:** Sistema de aprobación para solicitudes de pacientes entrantes.
- **Expedientes Clínicos Digitales:** - Registro detallado de información del paciente.
    - **Gestión de Archivos:** Carga de imágenes y documentos médicos (estudios, radiografías).
    - **Generación de PDF:** Exportación de datos de pacientes a formato PDF para reportes externos.
- **Gestión de Perfil:** Control de datos profesionales y autenticación segura.

## 🛠️ Stack Tecnológico

**Frontend:**
- **React.js** con **TypeScript** para un desarrollo tipado y seguro.
- **Tailwind CSS** para un diseño moderno, responsive y profesional.
- **Lucide React** para iconografía médica y de interfaz.
- **Axios / Fetch API** para el consumo de servicios REST.
- **Context API** para la gestión del estado de autenticación.

**Backend:**
- **Node.js** y **Express** para la creación de una API REST escalable.
- **MySQL** como base de datos relacional para la integridad de los datos médicos.
- **Multer** para la gestión y almacenamiento de archivos multimedia en el servidor.
- **Nodemailer** para el envío de notificaciones y verificaciones por correo electrónico.

## 📸 Vista Previa (Screenshots)

> **Nota:** Reemplaza las rutas de las imágenes con las capturas reales de tu proyecto subidas a la carpeta `/assets` de tu repositorio.

| Dashboard Principal | Gestión de Agenda |
| :---: | :---: |
| ![Dashboard](./assets/dashboard-preview.png) | ![Agenda](./assets/agenda-preview.png) |

| Expedientes Clínicos | Registro de Citas |
| :---: | :---: |
| ![Expedientes](./assets/expedientes-preview.png) | ![Citas](./assets/citas-preview.png) |

## ⚙️ Instalación y Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/tu-usuario/nombre-del-repo.git](https://github.com/tu-usuario/nombre-del-repo.git)