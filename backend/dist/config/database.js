import { DataSource } from 'typeorm';
import { config } from 'dotenv';
config();
export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
    entities: ['dist/models/**/*.js'],
    migrations: ['dist/migrations/**/*.js'],
    subscribers: ['dist/subscribers/**/*.js'],
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false,
        ca: process.env.DB_SSL_CA,
        cert: process.env.DB_SSL_CERT,
        key: process.env.DB_SSL_KEY
    } : false,
    extra: process.env.NODE_ENV === 'production' ? {
        ssl: {
            rejectUnauthorized: false,
            ca: process.env.DB_SSL_CA,
            cert: process.env.DB_SSL_CERT,
            key: process.env.DB_SSL_KEY
        }
    } : undefined,
});
export const connectDatabase = async () => {
    try {
        await AppDataSource.initialize();
        console.log('Database connected successfully');
    }
    catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
};
