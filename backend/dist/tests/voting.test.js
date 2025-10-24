import request from 'supertest';
import app from '../server';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
import { ElectionPost, PostType, PostStatus } from '../models/ElectionPost';
import { Candidate, CandidateStatus } from '../models/Candidate';
describe('Voting System', () => {
    let testUser;
    let testPost;
    let testCandidate;
    let authToken;
    beforeAll(async () => {
        // Initialize test database connection
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        // Create test user
        const userRepository = AppDataSource.getRepository(User);
        testUser = userRepository.create({
            studentId: 'VOTE001',
            firstName: 'Voter',
            lastName: 'Test',
            email: 'voter@example.com',
            password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9S2',
            role: UserRole.STUDENT,
            house: 'Red',
        });
        await userRepository.save(testUser);
        // Create test election post
        const postRepository = AppDataSource.getRepository(ElectionPost);
        testPost = postRepository.create({
            title: 'Test President',
            description: 'Test election for president',
            type: PostType.GENERAL,
            status: PostStatus.ACTIVE,
            maxVotes: 1,
            votingStartsAt: new Date(Date.now() - 3600000), // 1 hour ago
            votingEndsAt: new Date(Date.now() + 3600000), // 1 hour from now
        });
        await postRepository.save(testPost);
        // Create test candidate
        const candidateRepository = AppDataSource.getRepository(Candidate);
        testCandidate = candidateRepository.create({
            firstName: 'John',
            lastName: 'Doe',
            studentId: 'CAND001',
            email: 'john@example.com',
            bio: 'Test candidate',
            postId: testPost.id,
            status: CandidateStatus.ACTIVE,
        });
        await candidateRepository.save(testCandidate);
        // Login to get auth token
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
            studentId: 'VOTE001',
            password: 'password123',
        });
        authToken = loginResponse.body.data.tokens.accessToken;
    });
    afterAll(async () => {
        // Clean up test data
        const candidateRepository = AppDataSource.getRepository(Candidate);
        const postRepository = AppDataSource.getRepository(ElectionPost);
        const userRepository = AppDataSource.getRepository(User);
        const voteRepository = AppDataSource.getRepository('Vote');
        await voteRepository.delete({ userId: testUser.id });
        await candidateRepository.delete({ id: testCandidate.id });
        await postRepository.delete({ id: testPost.id });
        await userRepository.delete({ id: testUser.id });
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    });
    describe('GET /api/posts', () => {
        it('should return active election posts', async () => {
            const response = await request(app)
                .get('/api/posts')
                .query({ status: 'active' });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });
    describe('GET /api/candidates', () => {
        it('should return candidates for a post', async () => {
            const response = await request(app)
                .get('/api/candidates')
                .query({ postId: testPost.id });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });
    describe('POST /api/votes', () => {
        it('should cast a vote successfully', async () => {
            const response = await request(app)
                .post('/api/votes')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                postId: testPost.id,
                candidateId: testCandidate.id,
            });
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.postId).toBe(testPost.id);
            expect(response.body.data.candidateId).toBe(testCandidate.id);
        });
        it('should prevent double voting', async () => {
            const response = await request(app)
                .post('/api/votes')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                postId: testPost.id,
                candidateId: testCandidate.id,
            });
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('already voted');
        });
        it('should require authentication', async () => {
            const response = await request(app)
                .post('/api/votes')
                .send({
                postId: testPost.id,
                candidateId: testCandidate.id,
            });
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });
    describe('GET /api/votes/my-votes', () => {
        it('should return user votes', async () => {
            const response = await request(app)
                .get('/api/votes/my-votes')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });
    describe('GET /api/posts/:id/results', () => {
        it('should return election results', async () => {
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
