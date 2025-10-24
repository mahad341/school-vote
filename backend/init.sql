-- Initial database setup for E-Voting system
-- This file will be executed when the MySQL container starts

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS e_voting_db;
USE e_voting_db;

-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    studentId VARCHAR(20) UNIQUE NOT NULL,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin', 'ict_admin') DEFAULT 'student',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    house VARCHAR(50),
    class VARCHAR(20),
    hasVoted BOOLEAN DEFAULT FALSE,
    lastLoginAt TIMESTAMP NULL,
    votedAt TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student_id (studentId),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS election_posts (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    type ENUM('general', 'house_specific') DEFAULT 'general',
    status ENUM('active', 'inactive', 'completed') DEFAULT 'inactive',
    eligibleHouses JSON,
    maxVotes INT DEFAULT 1,
    votingStartsAt TIMESTAMP NULL,
    votingEndsAt TIMESTAMP NULL,
    totalVotes INT DEFAULT 0,
    displayOrder INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_display_order (displayOrder)
);

CREATE TABLE IF NOT EXISTS candidates (
    id VARCHAR(36) PRIMARY KEY,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    studentId VARCHAR(20),
    email VARCHAR(255),
    bio TEXT,
    manifesto TEXT,
    photoUrl VARCHAR(500),
    house VARCHAR(50),
    class VARCHAR(20),
    status ENUM('active', 'withdrawn', 'disqualified') DEFAULT 'active',
    voteCount INT DEFAULT 0,
    votePercentage DECIMAL(5,2) DEFAULT 0.00,
    displayOrder INT,
    postId VARCHAR(36) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (postId) REFERENCES election_posts(id) ON DELETE CASCADE,
    INDEX idx_post_id (postId),
    INDEX idx_status (status),
    INDEX idx_vote_count (voteCount)
);

CREATE TABLE IF NOT EXISTS votes (
    id VARCHAR(36) PRIMARY KEY,
    userId VARCHAR(36) NOT NULL,
    postId VARCHAR(36) NOT NULL,
    candidateId VARCHAR(36) NOT NULL,
    status ENUM('cast', 'verified', 'invalid') DEFAULT 'cast',
    verificationHash VARCHAR(255),
    metadata JSON,
    ipAddress INET,
    userAgent VARCHAR(500),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (postId) REFERENCES election_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (candidateId) REFERENCES candidates(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vote (userId, postId),
    INDEX idx_user_post (userId, postId),
    INDEX idx_post_candidate (postId, candidateId),
    INDEX idx_created_at (createdAt)
);

-- Insert sample data
INSERT IGNORE INTO users (id, studentId, firstName, lastName, email, password, role, status) VALUES
('admin-001', 'ADMIN001', 'System', 'Administrator', 'admin@school.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjYQmLxZhRmW', 'ict_admin', 'active'),
('admin-002', 'ADMIN002', 'Election', 'Admin', 'election@school.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjYQmLxZhRmW', 'admin', 'active');

INSERT IGNORE INTO election_posts (id, title, description, type, status, maxVotes) VALUES
('post-001', 'School President', 'Vote for the next School President', 'general', 'active', 1),
('post-002', 'House Prefect', 'Vote for your House Prefect', 'house_specific', 'active', 1);

INSERT IGNORE INTO candidates (id, firstName, lastName, studentId, email, bio, postId) VALUES
('cand-001', 'John', 'Doe', 'STU001', 'john.doe@school.edu', 'Experienced leader with vision for the future', 'post-001'),
('cand-002', 'Jane', 'Smith', 'STU002', 'jane.smith@school.edu', 'Dedicated to student welfare and academic excellence', 'post-001'),
('cand-003', 'Bob', 'Johnson', 'STU003', 'bob.johnson@school.edu', 'Passionate about sports and house spirit', 'post-002'),
('cand-004', 'Alice', 'Williams', 'STU004', 'alice.williams@school.edu', 'Focused on unity and collaboration', 'post-002');

-- Update eligible houses for house-specific post
UPDATE election_posts SET eligibleHouses = '["Red", "Blue", "Green", "Yellow"]' WHERE id = 'post-002';