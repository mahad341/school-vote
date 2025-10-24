import request from 'supertest';
import app from '../server';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
import { ElectionPost } from '../models/ElectionPost';
describe('Admin Functionality', () => {
    let adminUser;
    let adminToken;
    let testPost;
    beforeAll(async () => {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        // Create admin user
        const userRepository = AppDataSource.getRepository(User);
        adminUser = userRepository.create({
            studentId: 'ADMIN001',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@example.com',
            password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9S2',
            role: UserRole.ADMIN,
        });
        await userRepository.save(adminUser);
        // Login as admin
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
            studentId: 'ADMIN001',
            password: 'password123',
        });
        adminToken = loginResponse.body.data.tokens.accessToken;
    });
    afterAll(async () => {
        // Clean up
        const userRepository = AppDataSource.getRepository(User);
        const postRepository = AppDataSource.getRepository(ElectionPost);
        if (testPost) {
            await postRepository.delete({ id: testPost.id });
        }
        await userRepository.delete({ id: adminUser.id });
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    });
    describe('POST /api/posts', () => {
        it('should create election post as admin', async () => {
            const response = await request(app)
                .post('/api/posts')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                title: 'Test President Election',
                description: 'Test election for president position',
                type: 'general',
                maxVotes: 1,
            });
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('Test President Election');
            testPost = response.body.data;
        });
        it('should reject post creation without admin role', async () => {
            // Create regular user
            const userRepository = AppDataSource.getRepository(User);
            const regularUser = userRepository.create({
                studentId: 'REG001',
                firstName: 'Regular',
                lastName: 'User',
                email: 'regular@example.com',
                password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9S2',
                role: UserRole.STUDENT,
            });
            await userRepository.save(regularUser);
            // Login as regular user
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                studentId: 'REG001',
                password: 'password123',
            });
            const regularToken = loginResponse.body.data.tokens.accessToken;
            const response = await request(app)
                .post('/api/posts')
                .set('Authorization', `Bearer ${regularToken}`)
                .send({
                title: 'Unauthorized Post',
                type: 'general',
            });
            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            // Clean up
            await userRepository.delete({ id: regularUser.id });
        });
    });
    describe('POST /api/candidates', () => {
        it('should create candidate as admin', async () => {
            const response = await request(app)
                .post('/api/candidates')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                firstName: 'Jane',
                lastName: 'Smith',
                studentId: 'CAND002',
                email: 'jane@example.com',
                bio: 'Test candidate for president',
                postId: testPost.id,
            });
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.firstName).toBe('Jane');
        });
    });
    describe('PUT /api/posts/:id/status', () => {
        it('should update post status as admin', async () => {
            const response = await request(app)
                .put(`/api/posts/${testPost.id}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                status: 'active',
            });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('active');
        });
    });
    describe('GET /api/posts/:id/results', () => {
        it('should get election results', async () => {
            const response = await request(app)
                .get(`/api/posts/${testPost.id}/results`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.post).toBeDefined();
            expect(response.body.data.candidates).toBeDefined();
            expect(response.body.data.totalVotes).toBeDefined();
        });
    });
});
