import { DataSource } from 'typeorm';
import { User } from '../models/User.js';
import { ElectionPost } from '../models/ElectionPost.js';
import { Candidate } from '../models/Candidate.js';
import { Vote } from '../models/Vote.js';
import { AuditLog } from '../models/AuditLog.js';
export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
    entities: [User, ElectionPost, Candidate, Vote, AuditLog],
    migrations: ['src/migrations/**/*.ts']
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
