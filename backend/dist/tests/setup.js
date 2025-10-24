import { AppDataSource } from '../config/database.js';
// Setup test environment
beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.DB_NAME = 'e_voting_test_db';
    // Initialize database connection for tests
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }
});
afterAll(async () => {
    // Close database connection after all tests
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
});
// Global test utilities
global.testUtils = {
    createTestUser: async (userData) => {
        const userRepository = AppDataSource.getRepository('User');
        const user = userRepository.create(userData);
        return userRepository.save(user);
    },
    createTestPost: async (postData) => {
        const postRepository = AppDataSource.getRepository('ElectionPost');
        const post = postRepository.create(postData);
        return postRepository.save(post);
    },
    createTestCandidate: async (candidateData) => {
        const candidateRepository = AppDataSource.getRepository('Candidate');
        const candidate = candidateRepository.create(candidateData);
        return candidateRepository.save(candidate);
    },
    cleanup: async () => {
        // Clean up test data
        const entities = ['Vote', 'Candidate', 'ElectionPost', 'User', 'AuditLog'];
        for (const entity of entities) {
            try {
                const repository = AppDataSource.getRepository(entity);
                await repository.clear();
            }
            catch (error) {
                console.warn(`Failed to clear ${entity}:`, error);
            }
        }
    }
};
