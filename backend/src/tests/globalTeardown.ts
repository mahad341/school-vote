import { AppDataSource } from '../config/database.js';

export default async function globalTeardown() {
  console.log('Tearing down test environment...');
  
  try {
    if (AppDataSource.isInitialized) {
      // Drop all test data
      await AppDataSource.dropDatabase();
      
      // Close connection
      await AppDataSource.destroy();
    }
    
    console.log('Test environment teardown complete');
  } catch (error) {
    console.error('Failed to teardown test environment:', error);
  }
}