import dotenv from 'dotenv';
dotenv.config();

export const URLS = {
    BACKEND: process.env.ND_URL + ':' + process.env.ND_PORT_BACKEND,
    FRONTEND: process.env.ND_URL_PORT_FRONTEND,
};

export const DB = {
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
    PORT_DB: process.env.DB_PORT,
};

export const EMAIL = {
    EU: process.env.EMAIL_USER,
    EP: process.env.EMAIL_PASS,
    ECU: process.env.EMAIL_CUSTOMER_USER,
    ECP: process.env.EMAIL_CUSTOMER_PASS
};
