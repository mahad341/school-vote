import request from 'supertest';
import app from '../server';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
describe('Authentication Endpoints', () => {
    let testUser;
    let authToken;
    beforeAll(async () => {
        // Initialize test database connection
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        // Create test user
        const userRepository = AppDataSource.getRepository(User);
        testUser = userRepository.create({
            studentId: 'TEST001',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9S2', // 'password123'
            role: UserRole.STUDENT,
        });
        await userRepository.save(testUser);
    });
    afterAll(async () => {
        // Clean up test data
        const userRepository = AppDataSource.getRepository(User);
        await userRepository.delete({ studentId: 'TEST001' });
        // Close database connection
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    });
    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                studentId: 'TEST001',
                password: 'password123',
            });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.studentId).toBe('TEST001');
            expect(response.body.data.tokens.accessToken).toBeDefined();
            authToken = response.body.data.tokens.accessToken;
        });
        it('should reject invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                studentId: 'TEST001',
                password: 'wrongpassword',
            });
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                studentId: '',
                password: '',
            });
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });
    });
    describe('GET /api/auth/me', () => {
        it('should return user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.studentId).toBe('TEST001');
        });
        it('should reject request without token', async () => {
            const response = await request(app)
                .get('/api/auth/me');
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });
    describe('POST /api/auth/logout', () => {
        it('should logout successfully', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});
