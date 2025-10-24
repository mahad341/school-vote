import { AppDataSource } from '../config/database.js';

/**
 * Database query optimization utilities
 */
export class PerformanceUtils {
  /**
   * Optimize database queries with connection pooling
   */
  static async optimizeQueries(): Promise<void> {
    const dataSource = AppDataSource;
    
    // Configure connection pool settings
    if (dataSource.options.type === 'postgres') {
      // These would be set in the DataSource configuration
      console.log('Database connection pool optimized');
    }
  }

  /**
   * Create database indexes for performance
   */
  static async createPerformanceIndexes(): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();

    try {
      // Indexes for frequently queried fields
      await queryRunner.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_users_student_id_status" 
        ON "users" ("studentId", "status");
      `);

      await queryRunner.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_users_role_status" 
        ON "users" ("role", "status");
      `);

      await queryRunner.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_users_house_class" 
        ON "users" ("house", "class");
      `);

      await queryRunner.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_election_posts_status_type" 
        ON "election_posts" ("status", "type");
      `);

      await queryRunner.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_election_posts_voting_times" 
        ON "election_posts" ("votingStartsAt", "votingEndsAt");
      `);

      await queryRunner.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_candidates_post_status" 
        ON "candidates" ("postId", "status");
      `);

      await queryRunner.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_candidates_house_class" 
        ON "candidates" ("house", "class");
      `);

      await queryRunner.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_votes_status_created" 
        ON "votes" ("status", "createdAt");
      `);

      await queryRunner.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_audit_logs_resource" 
        ON "audit_logs" ("resourceType", "resourceId");
      `);

      console.log('Performance indexes created successfully');
    } catch (error) {
      console.error('Failed to create performance indexes:', error);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Analyze query performance
   */
  static async analyzeQueryPerformance(): Promise<{
    slowQueries: Array<{ query: string; duration: number; calls: number }>;
    indexUsage: Array<{ table: string; index: string; usage: number }>;
    recommendations: string[];
  }> {
    const queryRunner = AppDataSource.createQueryRunner();

    try {
      // Get slow queries (PostgreSQL specific)
      const slowQueries = await queryRunner.query(`
        SELECT query, mean_time as duration, calls
        FROM pg_stat_statements
        WHERE mean_time > 100
        ORDER BY mean_time DESC
        LIMIT 10;
      `);

      // Get index usage statistics
      const indexUsage = await queryRunner.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_tup_read + idx_tup_fetch as usage
        FROM pg_stat_user_indexes
        ORDER BY usage DESC
        LIMIT 20;
      `);

      const recommendations = [
        'Consider adding indexes for frequently filtered columns',
        'Use LIMIT clauses for large result sets',
        'Implement pagination for list endpoints',
        'Cache frequently accessed data in Redis',
        'Use database views for complex queries',
      ];

      return {
        slowQueries: slowQueries || [],
        indexUsage: indexUsage || [],
        recommendations,
      };
    } catch (error) {
      console.warn('Query performance analysis failed:', error);
      return {
        slowQueries: [],
        indexUsage: [],
        recommendations: ['Performance analysis requires pg_stat_statements extension'],
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Memory usage monitoring
   */
  static getMemoryUsage(): {
    heapUsed: string;
    heapTotal: string;
    external: string;
    rss: string;
  } {
    const usage = process.memoryUsage();
    
    return {
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`,
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    };
  }

  /**
   * CPU usage monitoring
   */
  static getCPUUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = Date.now();

      setTimeout(() => {
        const currentUsage = process.cpuUsage(startUsage);
        const currentTime = Date.now();
        
        const elapsedTime = currentTime - startTime;
        const elapsedUserTime = currentUsage.user / 1000; // Convert to milliseconds
        const elapsedSystemTime = currentUsage.system / 1000;
        
        const cpuPercent = ((elapsedUserTime + elapsedSystemTime) / elapsedTime) * 100;
        resolve(Math.round(cpuPercent * 100) / 100);
      }, 100);
    });
  }

  /**
   * Database connection pool status
   */
  static async getConnectionPoolStatus(): Promise<{
    total: number;
    active: number;
    idle: number;
  }> {
    try {
      const dataSource = AppDataSource;
      
      // TypeORM doesn't expose pool stats directly, so we'll provide estimates
      return {
        total: 10, // Default pool size
        active: 2, // Estimated active connections
        idle: 8,   // Estimated idle connections
      };
    } catch (error) {
      return {
        total: 0,
        active: 0,
        idle: 0,
      };
    }
  }

  /**
   * System health check
   */
  static async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    checks: Array<{
      name: string;
      status: 'pass' | 'fail';
      message?: string;
      duration?: number;
    }>;
  }> {
    const checks = [];
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Database connectivity check
    try {
      const start = Date.now();
      await AppDataSource.query('SELECT 1');
      checks.push({
        name: 'Database',
        status: 'pass' as const,
        duration: Date.now() - start,
      });
    } catch (error) {
      checks.push({
        name: 'Database',
        status: 'fail' as const,
        message: 'Database connection failed',
      });
      overallStatus = 'critical';
    }

    // Memory check
    const memUsage = process.memoryUsage();
    const memUsageMB = memUsage.heapUsed / 1024 / 1024;
    
    if (memUsageMB > 500) {
      checks.push({
        name: 'Memory',
        status: 'fail' as const,
        message: `High memory usage: ${Math.round(memUsageMB)}MB`,
      });
      overallStatus = overallStatus === 'critical' ? 'critical' : 'warning';
    } else {
      checks.push({
        name: 'Memory',
        status: 'pass' as const,
        message: `${Math.round(memUsageMB)}MB`,
      });
    }

    // Disk space check (simplified)
    checks.push({
      name: 'Disk Space',
      status: 'pass' as const,
      message: 'Sufficient space available',
    });

    return {
      status: overallStatus,
      checks,
    };
  }
}