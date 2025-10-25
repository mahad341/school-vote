import "reflect-metadata";
import { AppDataSource } from '../config/database.js';
import { AuthService } from '../utils/auth.js';
import { UserRole } from '../models/User.js';

async function setupAdminUsers() {
  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Database connected successfully');
    }

    // Synchronize database schema
    await AppDataSource.synchronize();
    console.log('Database schema synchronized');

    console.log('Setting up admin users...');

    // Create admin user
    const adminUser = await AuthService.register({
      studentId: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@school.edu',
      password: 'admin123',
      role: UserRole.ADMIN,
    });

    console.log('Admin user created:', adminUser.studentId);

    // Create ICT admin user
    const ictAdminUser = await AuthService.register({
      studentId: 'ictadmin',
      firstName: 'ICT',
      lastName: 'Administrator',
      email: 'ictadmin@school.edu',
      password: 'ictadmin123',
      role: UserRole.ICT_ADMIN,
    });

    console.log('ICT Admin user created:', ictAdminUser.studentId);

    console.log('Admin users setup completed successfully!');
    console.log('Admin login: studentId=admin, password=admin123');
    console.log('ICT Admin login: studentId=ictadmin, password=ictadmin123');

  } catch (error) {
    console.error('Error setting up admin users:', error);
    process.exit(1);
  } finally {
    // Close database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Run the setup
setupAdminUsers();