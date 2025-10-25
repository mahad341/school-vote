// Import configuration
import { BACKEND_URL } from '../../config.js';
// =============================================
// Backend API Integration
// =============================================

// API Configuration
const API_CONFIG = {
    BASE_URL: `${BACKEND_URL}/api`,
    SOCKET_URL: BACKEND_URL,
    TIMEOUT: 10000
};

// API Client Class
class ApiClient {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.socket = null;
        this.token = localStorage.getItem('auth_token');
        this.refreshToken = localStorage.getItem('refresh_token');
    }

    // HTTP Request Method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            timeout: API_CONFIG.TIMEOUT,
            ...options
        };

        // Add authorization header if token exists
        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);

            // Handle token refresh on 401
            if (response.status === 401 && this.refreshToken) {
                const newToken = await this.refreshAccessToken();
                if (newToken) {
                    config.headers['Authorization'] = `Bearer ${newToken}`;
                    return fetch(url, config);
                }
            }

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Network error' }));
                throw new Error(error.message || `HTTP ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Authentication Methods
    async login(credentials) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });

        if (response.token) {
            this.setToken(response.token, response.refreshToken);
        }

        return response;
    }

    async refreshAccessToken() {
        try {
            const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.refreshToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.setToken(data.token, data.refreshToken);
                return data.token;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.logout();
        }
        return null;
    }

    setToken(token, refreshToken) {
        this.token = token;
        this.refreshToken = refreshToken;
        localStorage.setItem('auth_token', token);
        if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
        }
    }

    logout() {
        this.token = null;
        this.refreshToken = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        this.disconnectSocket();
    }

    // User Management
    async getCurrentUser() {
        return this.request('/auth/me');
    }

    async getUsers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/users?${queryString}`);
    }

    async createUser(userData) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async updateUser(id, userData) {
        return this.request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async deleteUser(id) {
        return this.request(`/users/${id}`, {
            method: 'DELETE'
        });
    }

    // Election Posts
    async getPosts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/posts?${queryString}`);
    }

    async getPost(id) {
        return this.request(`/posts/${id}`);
    }

    async createPost(postData) {
        return this.request('/posts', {
            method: 'POST',
            body: JSON.stringify(postData)
        });
    }

    async updatePost(id, postData) {
        return this.request(`/posts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(postData)
        });
    }

    async deletePost(id) {
        return this.request(`/posts/${id}`, {
            method: 'DELETE'
        });
    }

    // Candidates
    async getCandidates(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/candidates?${queryString}`);
    }

    async getCandidate(id) {
        return this.request(`/candidates/${id}`);
    }

    async createCandidate(candidateData) {
        return this.request('/candidates', {
            method: 'POST',
            body: JSON.stringify(candidateData)
        });
    }

    async updateCandidate(id, candidateData) {
        return this.request(`/candidates/${id}`, {
            method: 'PUT',
            body: JSON.stringify(candidateData)
        });
    }

    async deleteCandidate(id) {
        return this.request(`/candidates/${id}`, {
            method: 'DELETE'
        });
    }

    // Voting
    async getVotes(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/votes?${queryString}`);
    }

    async castVote(voteData) {
        return this.request('/votes', {
            method: 'POST',
            body: JSON.stringify(voteData)
        });
    }

    // Voter-specific endpoints
    async getVoterProfile() {
        return this.request('/voter/profile');
    }

    async getVoterPosts() {
        return this.request('/voter/posts');
    }

    async getVoterCandidates(postId) {
        return this.request(`/voter/candidates/${postId}`);
    }

    async getVotingGuidelines() {
        return this.request('/voter/guidelines');
    }

    // Admin endpoints
    async getAdminResults() {
        return this.request('/admin/results');
    }

    async getAdminVoters() {
        return this.request('/admin/voters');
    }

    // ICT Admin endpoints
    async importVoters(votersData) {
        return this.request('/ict-admin/import-voters', {
            method: 'POST',
            body: JSON.stringify(votersData)
        });
    }

    async updateSystemStatus(status) {
        return this.request('/ict-admin/system-status', {
            method: 'PUT',
            body: JSON.stringify(status)
        });
    }

    async getSystemStatus() {
        return this.request('/ict-admin/system-status');
    }

    async getAuditLogs(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/ict-admin/audit-logs?${queryString}`);
    }

    async createBackup() {
        return this.request('/ict-admin/system/backup', {
            method: 'POST'
        });
    }

    async restoreBackup(backupId) {
        return this.request(`/ict-admin/system/restore/${backupId}`, {
            method: 'POST'
        });
    }

    async resetVotes() {
        return this.request('/ict-admin/reset-votes', {
            method: 'POST',
            body: JSON.stringify({ confirmation: 'RESET_VOTES' })
        });
    }

    async resetVoterStatuses() {
        return this.request('/ict-admin/reset-voters', {
            method: 'POST',
            body: JSON.stringify({ confirmation: 'RESET_VOTERS' })
        });
    }

    async resetSystem() {
        return this.request('/ict-admin/reset-system', {
            method: 'POST',
            body: JSON.stringify({ confirmation: 'RESET_SYSTEM' })
        });
    }

    async clearCache() {
        return this.request('/ict-admin/cache', {
            method: 'DELETE'
        });
    }

    async exportSystemData() {
        return this.request('/ict-admin/export');
    }

    async getPerformanceMetrics() {
        return this.request('/ict-admin/performance-metrics');
    }

    // Socket.io Integration
    connectSocket() {
        if (this.socket) return;

        this.socket = io(API_CONFIG.SOCKET_URL, {
            auth: {
                token: this.token
            }
        });

        this.socket.on('connect', () => {
            console.log('Connected to real-time server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from real-time server');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });
    }

    disconnectSocket() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Socket event listeners
    onVoteUpdate(callback) {
        if (this.socket) {
            this.socket.on('vote-cast', callback);
        }
    }

    onResultsUpdate(callback) {
        if (this.socket) {
            this.socket.on('results-update', callback);
        }
    }

    onSystemStatusChange(callback) {
        if (this.socket) {
            this.socket.on('system-status', callback);
        }
    }

    onAdminNotification(callback) {
        if (this.socket) {
            this.socket.on('admin-notification', callback);
        }
    }

    // Join real-time rooms
    joinVotingRoom() {
        if (this.socket) {
            this.socket.emit('join-voting');
        }
    }

    joinResultsRoom() {
        if (this.socket) {
            this.socket.emit('join-results');
        }
    }

    joinAdminRoom() {
        if (this.socket) {
            this.socket.emit('join-admin');
        }
    }

    joinPostRoom(postId) {
        if (this.socket) {
            this.socket.emit('join-post', { postId });
        }
    }

    leavePostRoom(postId) {
        if (this.socket) {
            this.socket.emit('leave-post', { postId });
        }
    }
}

// Global API instance
const apiClient = new ApiClient();

// Export for use in other modules
window.ApiClient = ApiClient;
window.apiClient = apiClient;