// =============================================
// Backend API Integration
// =============================================

// API Client for backend communication
const apiClient = {
    baseURL: 'http://localhost:3001/api',

    // Authentication methods
    async login(credentials) {
        const response = await fetch(`${this.baseURL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        if (data.token) {
            this.setToken(data.token);
            if (data.refreshToken) this.setRefreshToken(data.refreshToken);
        }
        return data;
    },

    async register(userData) {
        const response = await fetch(`${this.baseURL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            },
            body: JSON.stringify(userData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    },

    async logout() {
        const response = await fetch(`${this.baseURL}/auth/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${this.getToken()}` }
        });
        this.clearTokens();
        return response.ok;
    },

    async refreshToken() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token available');

        const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        this.setToken(data.tokens.accessToken);
        this.setRefreshToken(data.tokens.refreshToken);
        return data;
    },

    async getCurrentUser() {
        const response = await fetch(`${this.baseURL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${this.getToken()}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data;
    },

    // Posts methods
    async getPosts(params = {}) {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${this.baseURL}/posts?${query}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data;
    },

    async getPost(id) {
        const response = await fetch(`${this.baseURL}/posts/${id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data;
    },

    async createPost(postData) {
        const response = await fetch(`${this.baseURL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            },
            body: JSON.stringify(postData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data;
    },

    async updatePost(id, postData) {
        const response = await fetch(`${this.baseURL}/posts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            },
            body: JSON.stringify(postData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data;
    },

    async deletePost(id) {
        const response = await fetch(`${this.baseURL}/posts/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${this.getToken()}` }
        });
        if (!response.ok) throw new Error('Failed to delete post');
        return true;
    },

    // Candidates methods
    async getCandidates(params = {}) {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${this.baseURL}/candidates?${query}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data;
    },

    async getCandidate(id) {
        const response = await fetch(`${this.baseURL}/candidates/${id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data;
    },

    async createCandidate(candidateData) {
        const response = await fetch(`${this.baseURL}/candidates`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            },
            body: JSON.stringify(candidateData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data;
    },

    async updateCandidate(id, candidateData) {
        const response = await fetch(`${this.baseURL}/candidates/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            },
            body: JSON.stringify(candidateData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data;
    },

    async deleteCandidate(id) {
        const response = await fetch(`${this.baseURL}/candidates/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${this.getToken()}` }
        });
        if (!response.ok) throw new Error('Failed to delete candidate');
        return true;
    },

    // Votes methods
    async castVote(voteData) {
        const response = await fetch(`${this.baseURL}/votes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            },
            body: JSON.stringify(voteData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data;
    },

    async getMyVotes() {
        const response = await fetch(`${this.baseURL}/votes/my-votes`, {
            headers: { 'Authorization': `Bearer ${this.getToken()}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data;
    },

    async getVotes(params = {}) {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${this.baseURL}/votes/stats?${query}`, {
            headers: { 'Authorization': `Bearer ${this.getToken()}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data;
    },

    // Admin methods
    async getAdminVoters(params = {}) {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${this.baseURL}/ict-admin/users?${query}`, {
            headers: { 'Authorization': `Bearer ${this.getToken()}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data;
    },

    async bulkImportUsers(users) {
        const response = await fetch(`${this.baseURL}/ict-admin/users/bulk-import`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            },
            body: JSON.stringify({ users })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data;
    },

    async resetVotes() {
        const response = await fetch(`${this.baseURL}/ict-admin/system/reset-votes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            },
            body: JSON.stringify({ confirmation: 'RESET_ALL_VOTES' })
        });
        if (!response.ok) throw new Error('Failed to reset votes');
        return true;
    },

    async resetVoterStatuses() {
        const response = await fetch(`${this.baseURL}/ict-admin/reset-voters`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            },
            body: JSON.stringify({ confirmation: 'RESET_VOTERS' })
        });
        if (!response.ok) throw new Error('Failed to reset voter statuses');
        return true;
    },

    async resetSystem() {
        const response = await fetch(`${this.baseURL}/ict-admin/reset-system`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            },
            body: JSON.stringify({ confirmation: 'RESET_SYSTEM' })
        });
        if (!response.ok) throw new Error('Failed to reset system');
        return true;
    },

    async getSystemStatus() {
        const response = await fetch(`${this.baseURL}/ict-admin/system-status`, {
            headers: { 'Authorization': `Bearer ${this.getToken()}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data;
    },

    async updateSystemStatus(status) {
        const response = await fetch(`${this.baseURL}/ict-admin/system-status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            },
            body: JSON.stringify(status)
        });
        if (!response.ok) throw new Error('Failed to update system status');
        return true;
    },

    async getBackups(params = {}) {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${this.baseURL}/backups?${query}`, {
            headers: { 'Authorization': `Bearer ${this.getToken()}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data;
    },

    async createBackup(backupData) {
        const response = await fetch(`${this.baseURL}/backups`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            },
            body: JSON.stringify(backupData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data;
    },

    async restoreBackup(backupId) {
        const response = await fetch(`${this.baseURL}/backups/${backupId}/restore`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            },
            body: JSON.stringify({ confirmation: 'RESTORE_BACKUP' })
        });
        if (!response.ok) throw new Error('Failed to restore backup');
        return true;
    },

    async getAuditLogs(params = {}) {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${this.baseURL}/ict-admin/audit-logs?${query}`, {
            headers: { 'Authorization': `Bearer ${this.getToken()}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data;
    },

    async exportSystemData() {
        const response = await fetch(`${this.baseURL}/ict-admin/export`, {
            headers: { 'Authorization': `Bearer ${this.getToken()}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data;
    },

    async getPerformanceMetrics() {
        const response = await fetch(`${this.baseURL}/ict-admin/performance-metrics`, {
            headers: { 'Authorization': `Bearer ${this.getToken()}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.data;
    },

    // Token management
    setToken(token) {
        localStorage.setItem('auth_token', token);
        this.token = token;
    },

    getToken() {
        return localStorage.getItem('auth_token') || this.token;
    },

    setRefreshToken(token) {
        localStorage.setItem('refresh_token', token);
        this.refreshToken = token;
    },

    getRefreshToken() {
        return localStorage.getItem('refresh_token') || this.refreshToken;
    },

    clearTokens() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        this.token = null;
        this.refreshToken = null;
    }
};

// =============================================
// Application Initialization
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    // Set up module selection
    const moduleBtns = document.querySelectorAll('.module-btn');
    const voterLogin = document.getElementById('voter-login');
    const adminLogin = document.getElementById('admin-login');
    const ictAdminLogin = document.getElementById('ict-admin-login');
    
    if (moduleBtns.length > 0) {
        moduleBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                moduleBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                voterLogin.style.display = 'none';
                adminLogin.style.display = 'none';
                ictAdminLogin.style.display = 'none';

                if (this.dataset.module === 'voter') {
                    voterLogin.style.display = 'block';
                } else if (this.dataset.module === 'admin') {
                    adminLogin.style.display = 'block';
                } else if (this.dataset.module === 'ict-admin') {
                    ictAdminLogin.style.display = 'block';
                }
            });
        });
    }
    
    // Voter login
    const voterLoginBtn = document.getElementById('voter-login-btn');
    if (voterLoginBtn) {
        voterLoginBtn.addEventListener('click', async function() {
            const studentId = document.getElementById('student-id').value.trim();
            if (!studentId) {
                alert('Please enter your student ID');
                return;
            }

            try {
                // Backend authentication
                const response = await apiClient.login({
                    studentId: studentId,
                    password: 'default' // Voters don't have passwords, use default
                });

                if (response.token) {
                    // Backend authentication successful
                    localStorage.setItem('user_role', 'student');
                    localStorage.setItem('student_id', studentId);
                    window.location.href = `Voter-module.html?studentId=${studentId}&backend=true`;
                }
            } catch (error) {
                console.error('Authentication failed:', error);
                alert('Authentication failed. Please check your student ID and try again.');
            }
        });
    }
    
    // Admin login
    const adminLoginBtn = document.getElementById('admin-login-btn');
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', async function() {
            const username = document.getElementById('admin-username').value.trim();
            const password = document.getElementById('admin-password').value.trim();

            if (!username || !password) {
                alert('Please enter both username and password');
                return;
            }

            try {
                // Backend authentication
                const response = await apiClient.login({
                    username: username,
                    password: password
                });

                if (response.user && response.user.role === 'admin') {
                    localStorage.setItem('user_role', 'admin');
                    localStorage.setItem('admin_user', JSON.stringify(response.user));
                    window.location.href = 'Admin-module.html?backend=true';
                } else {
                    alert('Invalid admin credentials');
                }
            } catch (error) {
                console.error('Authentication failed:', error);
                alert('Authentication failed. Please check your credentials and try again.');
            }
        });
    }

    // ICT Admin login
    const ictAdminLoginBtn = document.getElementById('ict-admin-login-btn');
    if (ictAdminLoginBtn) {
        ictAdminLoginBtn.addEventListener('click', async function() {
            const username = document.getElementById('ict-admin-username').value.trim();
            const password = document.getElementById('ict-admin-password').value.trim();

            if (!username || !password) {
                alert('Please enter both username and password');
                return;
            }

            try {
                // Backend authentication
                const response = await apiClient.login({
                    username: username,
                    password: password
                });

                if (response.user && response.user.role === 'ict_admin') {
                    localStorage.setItem('user_role', 'ict_admin');
                    localStorage.setItem('ict_admin_user', JSON.stringify(response.user));
                    window.location.href = 'ICT-Admin.html?backend=true';
                } else {
                    alert('Invalid ICT admin credentials');
                }
            } catch (error) {
                console.error('Authentication failed:', error);
                alert('Authentication failed. Please check your credentials and try again.');
            }
        });
    }
});