import bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from '../models/User.js';
import { JWTService, JWTPayload } from './jwt.js';
import { AppDataSource } from '../config/database.js';
import { AuditLog, AuditAction, AuditSeverity } from '../models/AuditLog.js';

export interface LoginCredentials {
  studentId: string;
  password: string;
}

export interface AuthResult {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface RegisterData {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  house?: string;
  class?: string;
  role?: UserRole;
}

export class AuthService {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Authenticate user with credentials
   */
  static async login(credentials: LoginCredentials, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    const { studentId, password } = credentials;

    // Find user by student ID
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { studentId, status: UserStatus.ACTIVE }
    });

    if (!user) {
      // Log failed login attempt
      await this.logAuditEvent({
        action: AuditAction.FAILED_LOGIN,
        severity: AuditSeverity.MEDIUM,
        description: `Failed login attempt for student ID: ${studentId}`,
        ipAddress,
        userAgent,
        resourceType: 'user',
        resourceId: studentId,
      });

      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Log failed login attempt
      await this.logAuditEvent({
        action: AuditAction.FAILED_LOGIN,
        severity: AuditSeverity.MEDIUM,
        description: `Failed login attempt for user: ${user.id}`,
        ipAddress,
        userAgent,
        userId: user.id,
        resourceType: 'user',
        resourceId: user.id,
      });

      throw new Error('Invalid credentials');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await userRepository.save(user);

    // Generate tokens
    const tokens = JWTService.generateTokenPair(user);

    // Log successful login
    await this.logAuditEvent({
      action: AuditAction.LOGIN,
      severity: AuditSeverity.LOW,
      description: `User logged in: ${user.firstName} ${user.lastName}`,
      ipAddress,
      userAgent,
      userId: user.id,
      resourceType: 'user',
      resourceId: user.id,
    });

    return { user, tokens };
  }

  /**
   * Register a new user (admin/ICT admin only)
   */
  static async register(userData: RegisterData, createdBy?: string): Promise<User> {
    const userRepository = AppDataSource.getRepository(User);

    // Check if student ID already exists
    const existingUser = await userRepository.findOne({
      where: { studentId: userData.studentId }
    });

    if (existingUser) {
      throw new Error('Student ID already exists');
    }

    // Check if email already exists
    const existingEmail = await userRepository.findOne({
      where: { email: userData.email }
    });

    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, this.SALT_ROUNDS);

    // Create user
    const user = userRepository.create({
      studentId: userData.studentId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: hashedPassword,
      house: userData.house,
      class: userData.class,
      role: userData.role || UserRole.STUDENT,
    });

    const savedUser = await userRepository.save(user);

    // Log user creation
    await this.logAuditEvent({
      action: AuditAction.USER_CREATE,
      severity: AuditSeverity.MEDIUM,
      description: `New user created: ${savedUser.firstName} ${savedUser.lastName} (${savedUser.role})`,
      userId: createdBy,
      resourceType: 'user',
      resourceId: savedUser.id,
      newValues: {
        studentId: savedUser.studentId,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        role: savedUser.role,
        house: savedUser.house,
        class: savedUser.class,
      },
    });

    return savedUser;
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const decoded = JWTService.verifyRefreshToken(refreshToken);

      // Find user
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: decoded.userId, status: UserStatus.ACTIVE }
      });

      if (!user) {
        throw new Error('User not found or inactive');
      }

      // Generate new token pair
      const tokens = JWTService.generateTokenPair(user);

      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    user.password = hashedNewPassword;

    await userRepository.save(user);

    // Log password change
    await this.logAuditEvent({
      action: AuditAction.PASSWORD_CHANGE,
      severity: AuditSeverity.HIGH,
      description: `Password changed for user: ${user.firstName} ${user.lastName}`,
      userId: user.id,
      resourceType: 'user',
      resourceId: user.id,
    });
  }

  /**
   * Logout user (invalidate refresh token)
   */
  static async logout(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    // In a production system, you might want to maintain a blacklist of tokens
    // For now, we'll just log the logout event

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });

    if (user) {
      await this.logAuditEvent({
        action: AuditAction.LOGOUT,
        severity: AuditSeverity.LOW,
        description: `User logged out: ${user.firstName} ${user.lastName}`,
        ipAddress,
        userAgent,
        userId: user.id,
        resourceType: 'user',
        resourceId: user.id,
      });
    }
  }

  /**
   * Get current user profile
   */
  static async getCurrentUser(userId: string): Promise<User> {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Hash password utility
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify password utility
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Log audit event
   */
  private static async logAuditEvent(params: {
    action: AuditAction;
    severity: AuditSeverity;
    description?: string;
    details?: object;
    ipAddress?: string;
    userAgent?: string;
    userId?: string;
    resourceId?: string;
    resourceType?: string;
    oldValues?: object;
    newValues?: object;
  }): Promise<void> {
    try {
      const auditLogRepository = AppDataSource.getRepository(AuditLog);
      const auditLog = AuditLog.createLog(params);
      await auditLogRepository.save(auditLog);
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }
}