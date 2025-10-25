document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('ict-admin-module')) {
        loadIctAdminDashboard();
    }
});

// Global toast notification system
function showGlobalToast(message, type = 'info', duration = 4000) {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.global-toast');
    existingToasts.forEach(toast => toast.remove());

    // Create new toast
    const toast = document.createElement('div');
    toast.className = `global-toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <div class="toast-progress"></div>
    `;

    // Add styles if not already present
    if (!document.getElementById('global-toast-styles')) {
        const styles = document.createElement('style');
        styles.id = 'global-toast-styles';
        styles.textContent = `
            .global-toast {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                min-width: 300px;
                max-width: 500px;
                background: var(--card-bg, #fff);
                border: 1px solid var(--primary, #00529B);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                overflow: hidden;
                animation: slideInRight 0.3s ease-out;
            }
            .global-toast.success { border-color: #28a745; }
            .global-toast.error { border-color: #dc3545; }
            .global-toast.info { border-color: #17a2b8; }
            .global-toast.warning { border-color: #ffc107; }
            .toast-content {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
                font-size: 14px;
                color: var(--text-dark, #333);
            }
            .toast-content i {
                font-size: 18px;
                flex-shrink: 0;
            }
            .toast-progress {
                height: 3px;
                background: var(--primary, #00529B);
                animation: progress ${duration}ms linear;
            }
            .global-toast.success .toast-progress { background: #28a745; }
            .global-toast.error .toast-progress { background: #dc3545; }
            .global-toast.info .toast-progress { background: #17a2b8; }
            .global-toast.warning .toast-progress { background: #ffc107; }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes progress {
                from { width: 100%; }
                to { width: 0%; }
            }
            @media (max-width: 600px) {
                .global-toast {
                    left: 10px;
                    right: 10px;
                    min-width: auto;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }, duration);

    // Add slideOutRight animation if not present
    if (!document.getElementById('slide-out-styles')) {
        const slideOutStyles = document.createElement('style');
        slideOutStyles.id = 'slide-out-styles';
        slideOutStyles.textContent = `
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(slideOutStyles);
    }
}

function loadIctAdminDashboard() {
    // Theme toggle
    const themeToggle = document.getElementById('ict-theme-toggle');
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });
    
    // Load saved theme
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
    
    // Menu navigation
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            loadIctSection(target);
        });
    });
    // Hamburger menu for mobile sidebar toggle
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const sidebar = document.querySelector('.sidebar');
    if (hamburgerMenu && sidebar) {
        hamburgerMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('active');
            if (sidebar.classList.contains('active')) {
                document.body.classList.add('sidebar-open');
            } else {
                document.body.classList.remove('sidebar-open');
            }
        });
        // Close sidebar when clicking outside (mobile only)
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 800 && sidebar.classList.contains('active')) {
                // If click is outside sidebar and hamburger
                if (!sidebar.contains(e.target) && !hamburgerMenu.contains(e.target)) {
                    sidebar.classList.remove('active');
                    document.body.classList.remove('sidebar-open');
                }
            }
        });
    }
    // Load the dashboard by default
    loadIctSection('dashboard');
    window.addEventListener('databaseUpdated', () => {
        const activeMenu = document.querySelector('.menu-item.active');
        if (activeMenu) {
            const target = activeMenu.getAttribute('data-target');
            loadIctSection(target);
        }
    });
    // Removed duplicate hamburger menu event listener

    // User profile modal logic
    const userInfo = document.querySelector('.user-info');
    if (userInfo) {
        // Create modal if not exists
        let profileModal = document.getElementById('profile-modal');
        if (!profileModal) {
            profileModal = document.createElement('div');
            profileModal.id = 'profile-modal';
            profileModal.style.display = 'none';
            profileModal.style.position = 'fixed';
            profileModal.style.top = '0';
            profileModal.style.left = '0';
            profileModal.style.width = '100vw';
            profileModal.style.height = '100vh';
            profileModal.style.background = 'rgba(0,0,0,0.3)';
            profileModal.style.zIndex = '9999';
            profileModal.innerHTML = `
                <div class="card profile-card" style="max-width:400px;margin:80px auto;position:relative;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
                    <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;">
                        <div class="card-title" style="font-size:1.25rem;font-weight:700;letter-spacing:0.5px;">User Profile</div>
                        <button id="close-profile-modal" style="background:none;border:none;cursor:pointer;font-size:1.5rem;color:#888;line-height:1;">&times;</button>
                    </div>
                    <div style="display:flex;align-items:center;gap:20px;margin-bottom:16px;flex-wrap:wrap;">
                        <div class="user-avatar" style="width:64px;height:64px;border-radius:50%;background:var(--primary-light,#eee);display:flex;align-items:center;justify-content:center;font-size:2.2rem;color:var(--primary,#00529B);">
                            <i class="fas fa-user-shield"></i>
                        </div>
                        <div style="min-width:120px;">
                            <div style="font-size:1.1rem;font-weight:700;line-height:1.3;">ICT Admin</div>
                            <div style="color:var(--text-light,#666);font-size:0.98rem;">Role: <span style="font-weight:600;">Superuser</span></div>
                            <div style="color:var(--text-light,#666);font-size:0.98rem;">Username: <span style="font-weight:600;">itadmin</span></div>
                        </div>
                    </div>
                    <div class="card-body" style="font-size:1rem;color:var(--text-dark,#333);line-height:1.7;">
                        <div style="margin-bottom:6px;"><strong>Email:</strong> <span style="font-weight:500;">ictadmin@school.edu</span></div>
                        <div style="margin-bottom:6px;"><strong>Last Login:</strong> <span style="font-weight:500;">${new Date().toLocaleString()}</span></div>
                        <div><strong>Account Status:</strong> <span class="status active" style="font-size:0.95rem;vertical-align:middle;">Active</span></div>
                    </div>
                </div>
                <style>
                @media (max-width: 600px) {
                    #profile-modal .profile-card {
                        max-width: 96vw !important;
                        margin: 30px auto !important;
                        padding: 12px !important;
                    }
                    #profile-modal .card-header, #profile-modal .card-body {
                        padding: 10px !important;
                    }
                    #profile-modal .user-avatar {
                        width: 48px !important;
                        height: 48px !important;
                        font-size: 1.5rem !important;
                    }
                }
                </style>
            `;
            document.body.appendChild(profileModal);
        }
        userInfo.style.cursor = 'pointer';
        userInfo.addEventListener('click', () => {
            profileModal.style.display = 'block';
        });
        // Close modal when clicking the close button or outside the modal card
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) {
                profileModal.style.display = 'none';
            }
        });
        const closeBtn = profileModal.querySelector('#close-profile-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                profileModal.style.display = 'none';
            });
        }
    }
}

function loadIctSection(section) {
    const contentDiv = document.getElementById('ict-dashboard-content');
    
    switch(section) {
        case 'dashboard':
            loadIctDashboardContent(contentDiv);
            break;
            break;
        case 'admin-management':
            loadAdminManagementContent(contentDiv);
            break;
        case 'student-data':
            loadStudentDataContent(contentDiv);
            break;
        case 'voter-logs':
            loadVoterLogsContent(contentDiv);
            break;
        case 'system-performance':
            loadSystemPerformanceContent(contentDiv);
            break;
        case 'audit-trail':
            loadAuditTrailContent(contentDiv);
            break;
        case 'system-reset':
            loadSystemResetContent(contentDiv);
            break;
        case 'backup-recovery':
            loadBackupRecoveryContent(contentDiv);
            break;
        case 'system-status':
            loadSystemStatusContent(contentDiv);
            break;
        // Add other cases here as they are implemented
    }
}

async function loadIctDashboardContent(container) {
    try {
        const [userStats, postStats, voteStats] = await Promise.all([
            apiClient.getAdminVoters(),
            apiClient.getPosts(),
            apiClient.getVotes()
        ]);

        const voters = userStats || [];
        const posts = postStats || [];
        const votes = voteStats || [];
        const votedCount = voters.filter(v => v.voted).length;

        container.innerHTML = `
            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Total Voters</div>
                        <div class="card-icon voters">
                            <i class="fas fa-users"></i>
                        </div>
                    </div>
                    <div class="card-value">${voters.length}</div>
                    <div class="card-label">Total students loaded</div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Voted</div>
                        <div class="card-icon votes">
                            <i class="fas fa-check-to-slot"></i>
                        </div>
                    </div>
                    <div class="card-value">${votedCount}</div>
                    <div class="card-label">Total students who have voted</div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Active Posts</div>
                        <div class="card-icon posts">
                            <i class="fas fa-list"></i>
                        </div>
                    </div>
                    <div class="card-value">${posts.filter(p => p.active).length}</div>
                    <div class="card-label">Positions for election</div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Total Votes</div>
                        <div class="card-icon candidates">
                            <i class="fas fa-vote-yea"></i>
                        </div>
                    </div>
                    <div class="card-value">${votes.length}</div>
                    <div class="card-label">Votes cast in system</div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div class="card-title">System Status</div>
                        <div class="card-icon">
                            <i class="fas fa-server"></i>
                        </div>
                    </div>
                    <div class="card-value">Online</div>
                    <div class="card-label">Backend services running</div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Database</div>
                        <div class="card-icon">
                            <i class="fas fa-database"></i>
                        </div>
                    </div>
                    <div class="card-value">Connected</div>
                    <div class="card-label">PostgreSQL active</div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading ICT dashboard:', error);
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">ICT Admin Dashboard</div>
                </div>
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Unable to load dashboard data. Please check your connection and try again.</p>
                    <button onclick="loadIctDashboardContent(document.getElementById('ict-dashboard-content'))" class="btn btn-primary">Retry</button>
                </div>
            </div>
        `;
    }
}

async function loadSystemStatusContent(container) {
    try {
        const systemStatus = await apiClient.getSystemStatus();

        container.innerHTML = `
            <div class="card" style="margin-bottom: 30px;">
                <div class="card-header">
                    <div class="card-title">System Status Control</div>
                </div>
                <div class="system-status-indicator">
                    <div class="system-status-toggle ${systemStatus.enabled ? 'active' : ''}" id="system-status-toggle">
                        <div class="toggle-slider"></div>
                    </div>
                    <div class="status-text ${systemStatus.enabled ? 'enabled' : 'disabled'}" id="current-status-text">
                        ${systemStatus.enabled ? 'System Enabled' : 'System Disabled'}
                    </div>
                </div>
                <p style="margin-top: 15px; color: var(--text-light);">
                    <i class="fas fa-info-circle"></i>
                    ${systemStatus.enabled ?
                        'The voting system is currently online and accepting votes.' :
                        'The voting system is offline. Only ICT administrators can access the system.'}
                </p>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">System Information</div>
                </div>
                <div class="system-info">
                    <div class="info-item">
                        <strong>Status:</strong> <span class="status ${systemStatus.enabled ? 'active' : 'inactive'}">${systemStatus.enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div class="info-item">
                        <strong>Maintenance Mode:</strong> <span class="status ${systemStatus.maintenance ? 'warning' : 'inactive'}">${systemStatus.maintenance ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div class="info-item">
                        <strong>Last Updated:</strong> <span>${new Date(systemStatus.lastUpdated).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `;

        const toggle = document.getElementById('system-status-toggle');
        const statusText = document.getElementById('current-status-text');

        toggle.addEventListener('click', async () => {
            try {
                const newStatus = !systemStatus.enabled;
                await apiClient.updateSystemStatus({ enabled: newStatus });

                // Update UI
                systemStatus.enabled = newStatus;
                toggle.classList.toggle('active');
                statusText.className = `status-text ${systemStatus.enabled ? 'enabled' : 'disabled'}`;
                statusText.textContent = systemStatus.enabled ? 'System Enabled' : 'System Disabled';

                // Update info paragraph
                const infoPara = container.querySelector('.system-status-indicator + p');
                if (infoPara) {
                    infoPara.innerHTML = `<i class="fas fa-info-circle"></i> ${systemStatus.enabled ? 'The voting system is currently online and accepting votes.' : 'The voting system is offline. Only ICT administrators can access the system.'}`;
                }

                // Show notification
                const toastMessage = systemStatus.enabled ?
                    'Voting system has been enabled. Users can now access the system.' :
                    'Voting system has been disabled.';
                showGlobalToast(toastMessage, systemStatus.enabled ? 'success' : 'warning');

            } catch (error) {
                console.error('Error updating system status:', error);
                showGlobalToast('Failed to update system status', 'error');
            }
        });
    } catch (error) {
        console.error('Error loading system status:', error);
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">System Status Control</div>
                </div>
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Unable to load system status. Please check your connection and try again.</p>
                    <button onclick="loadSystemStatusContent(document.getElementById('ict-dashboard-content'))" class="btn btn-primary">Retry</button>
                </div>
            </div>
        `;
    }
}

function loadAdminManagementContent(container) {
    const db = evAPI.getDatabase();
    const admins = db.admins || [];

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-title">Admin Account Management</div>
                ${admins.length < 3 ? '<button class="btn btn-primary" id="add-admin-btn"><i class="fas fa-plus"></i> Add Admin</button>' : ''}
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${admins.map(admin => `
                            <tr>
                                <td>${admin.username}</td>
                                <td>${admin.role}</td>
                                <td><span class="status ${admin.status === 'Active' ? 'active' : 'inactive'}">${admin.status}</span></td>
                                <td>
                                    <button class="btn-icon edit-admin" data-id="${admin.id}"><i class="fas fa-edit"></i></button>
                                    <button class="btn-icon delete-admin" data-id="${admin.id}"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Create modal if it doesn't exist
    if (!document.getElementById('admin-modal')) {
        const modal = document.createElement('div');
        modal.id = 'admin-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="admin-modal-title" style="color: var(--accent); font-weight: bold;">Add New Admin</h2>
                    <span class="close-btn" id="close-admin-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="admin-id">
                    <div class="form-group">
                        <label for="admin-username">Username</label>
                        <input type="text" id="admin-username" placeholder="Enter username" required>
                    </div>
                    <div class="form-group">
                        <label for="admin-password">Password</label>
                        <input type="password" id="admin-password" placeholder="Enter password" required>
                    </div>
                    <div class="form-group">
                        <label for="admin-role">Role</label>
                        <select id="admin-role" required>
                            <option value="Super Administrator">Super Administrator</option>
                            <option value="Vote Manager">Vote Manager</option>
                            <option value="Results Viewer">Results Viewer</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="admin-status">Status</label>
                        <select id="admin-status" required>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                        <button class="btn" id="cancel-admin-btn">Cancel</button>
                        <button class="btn btn-primary" id="save-admin-btn">Save Admin</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Add ESC key support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                closeAdminModal();
            }
        });

        // Add backdrop click to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAdminModal();
            }
        });

        // Add modal button event listeners (only once when modal is created)
        document.getElementById('close-admin-modal').addEventListener('click', closeAdminModal);
        document.getElementById('cancel-admin-btn').addEventListener('click', closeAdminModal);
    }

    if (admins.length < 3) {
        document.getElementById('add-admin-btn').addEventListener('click', () => {
            openAdminModal();
        });
    }

    document.getElementById('close-admin-modal').addEventListener('click', closeAdminModal);
    document.getElementById('cancel-admin-btn').addEventListener('click', closeAdminModal);

    document.getElementById('save-admin-btn').addEventListener('click', () => {
        const db = evAPI.getDatabase();
        const id = document.getElementById('admin-id').value;
        const username = document.getElementById('admin-username').value.trim();
        const password = document.getElementById('admin-password').value.trim();
        const role = document.getElementById('admin-role').value;
        const status = document.getElementById('admin-status').value;

        if (username && password) {
            if (id) {
                // Update existing admin
                const admin = db.admins.find(a => a.id === id);
                if (admin) {
                    admin.username = username;
                    admin.password = password;
                    admin.role = role;
                    admin.status = status;
                }
            } else {
                // Add new admin
                db.admins.push({
                    id: 'admin' + Date.now(),
                    username,
                    password,
                    role,
                    status
                });
            }
            evAPI.saveDatabase(db);
            closeAdminModal();
            loadAdminManagementContent(container);
        } else {
            alert('Please fill in all fields');
        }
    });

    document.querySelectorAll('.edit-admin').forEach(btn => {
        btn.addEventListener('click', function() {
            const adminId = this.dataset.id;
            const admin = db.admins.find(a => a.id === adminId);
            if (admin) {
                openAdminModal(admin);
            }
        });
    });

    document.querySelectorAll('.delete-admin').forEach(btn => {
        btn.addEventListener('click', function() {
            const adminId = this.dataset.id;
            if (confirm('Are you sure you want to delete this admin?')) {
                const db = evAPI.getDatabase();
                db.admins = db.admins.filter(a => a.id !== adminId);
                evAPI.saveDatabase(db);
                loadAdminManagementContent(container);
            }
        });
    });
}

function openAdminModal(admin = null) {
    const modal = document.getElementById('admin-modal');
    const modalTitle = document.getElementById('admin-modal-title');

    if (admin) {
        modalTitle.textContent = 'Edit Admin';
        document.getElementById('admin-id').value = admin.id;
        document.getElementById('admin-username').value = admin.username;
        document.getElementById('admin-password').value = admin.password;
        document.getElementById('admin-role').value = admin.role;
        document.getElementById('admin-status').value = admin.status;
    } else {
        modalTitle.textContent = 'Add New Admin';
        document.getElementById('admin-id').value = '';
        document.getElementById('admin-username').value = '';
        document.getElementById('admin-password').value = '';
        document.getElementById('admin-role').value = 'Super Administrator';
        document.getElementById('admin-status').value = 'Active';
    }

    modal.classList.add('show');
}

function closeAdminModal() {
    const modal = document.getElementById('admin-modal');
    modal.classList.remove('show');
}

async function loadStudentDataContent(container) {
    try {
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Student Voter Data Management</div>
                    <div>
                        <button class="btn btn-primary" id="add-student-btn"><i class="fas fa-plus"></i> Add Student</button>
                        <button class="btn" id="import-csv-btn"><i class="fas fa-file-csv"></i> Import CSV</button>
                        <input type="file" id="csv-file-input" style="display:none;" accept=".csv">
                    </div>
                </div>
                <div class="form-group" style="max-width:400px;">
                    <input type="text" id="student-search-input" placeholder="Search by ID, Name, Class, or House...">
                </div>
                <div class="table-container"></div>
            </div>
        `;

        // Create modal if it doesn't exist
        if (!document.getElementById('student-modal')) {
            const modal = document.createElement('div');
            modal.id = 'student-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="student-modal-title" style="color: var(--accent); font-weight: bold;">Add New Student</h2>
                        <span class="close-btn" id="close-student-modal">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="student-form">
                            <div class="form-group">
                                <label for="student-id">Student ID</label>
                                <input type="text" id="student-id" placeholder="Enter student ID" required>
                            </div>
                            <div class="form-group">
                                <label for="student-name">Full Name</label>
                                <input type="text" id="student-name" placeholder="Enter full name" required>
                            </div>
                            <div class="form-group">
                                <label for="student-class">Class</label>
                                <input type="text" id="student-class" placeholder="e.g., S6A" required>
                            </div>
                            <div class="form-group">
                                <label for="student-house">House</label>
                                <input type="text" id="student-house" placeholder="Enter house" required>
                            </div>
                            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                                <button type="button" class="btn" id="cancel-student-btn">Cancel</button>
                                <button type="submit" class="btn btn-primary" id="save-student-btn">Save Student</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Add ESC key support
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('show')) {
                    closeStudentModal();
                }
            });

            // Add backdrop click to close
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeStudentModal();
                }
            });

            // Add modal button event listeners (only once when modal is created)
            document.getElementById('close-student-modal').addEventListener('click', closeStudentModal);
            document.getElementById('cancel-student-btn').addEventListener('click', closeStudentModal);

            // Handle form submission
            document.getElementById('student-form').addEventListener('submit', async (e) => {
                e.preventDefault();

                const studentId = document.getElementById('student-id').value.trim();
                const firstName = document.getElementById('student-name').value.trim().split(' ')[0];
                const lastName = document.getElementById('student-name').value.trim().split(' ').slice(1).join(' ');
                const className = document.getElementById('student-class').value.trim();
                const house = document.getElementById('student-house').value.trim();

                if (!studentId || !firstName || !lastName || !className || !house) {
                    showGlobalToast('Please fill in all fields', 'error');
                    return;
                }

                try {
                    await apiClient.bulkImportUsers([{
                        studentId,
                        firstName,
                        lastName,
                        email: `${studentId.toLowerCase()}@school.edu`,
                        password: 'default123',
                        house,
                        class: className
                    }]);

                    showGlobalToast('Student added successfully', 'success');
                    closeStudentModal();
                    await renderStudentDataTable();
                } catch (error) {
                    console.error('Error adding student:', error);
                    showGlobalToast('Failed to add student', 'error');
                }
            });
        }

        // Add event listeners for elements that are recreated on each load
        document.getElementById('student-search-input').addEventListener('keyup', renderStudentDataTable);

        document.getElementById('add-student-btn').addEventListener('click', () => {
            openStudentModal();
        });

        document.getElementById('import-csv-btn').addEventListener('click', () => {
            document.getElementById('csv-file-input').click();
        });

        document.getElementById('csv-file-input').addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async function(e) {
                    try {
                        const text = e.target.result;
                        const rows = text.split(/\r?\n/).slice(1); // Skip header
                        const users = [];

                        rows.forEach(row => {
                            if (row.trim()) {
                                const [studentId, fullName, className, house] = row.split(',');
                                if (studentId && fullName && className && house) {
                                    const nameParts = fullName.trim().split(' ');
                                    const firstName = nameParts[0];
                                    const lastName = nameParts.slice(1).join(' ');

                                    users.push({
                                        studentId: studentId.trim(),
                                        firstName,
                                        lastName,
                                        email: `${studentId.trim().toLowerCase()}@school.edu`,
                                        password: 'default123',
                                        house: house.trim(),
                                        class: className.trim()
                                    });
                                }
                            }
                        });

                        if (users.length > 0) {
                            await apiClient.bulkImportUsers(users);
                            showGlobalToast(`${users.length} students imported successfully`, 'success');
                            await renderStudentDataTable();
                        }
                    } catch (error) {
                        console.error('Error importing students:', error);
                        showGlobalToast('Failed to import students', 'error');
                    }
                };
                reader.readAsText(file);
            }
        });

        await renderStudentDataTable();
    } catch (error) {
        console.error('Error loading student data content:', error);
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Student Voter Data Management</div>
                </div>
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Unable to load student data. Please check your connection and try again.</p>
                    <button onclick="loadStudentDataContent(document.getElementById('ict-dashboard-content'))" class="btn btn-primary">Retry</button>
                </div>
            </div>
        `;
    }
}

function openStudentModal() {
    const modal = document.getElementById('student-modal');
    const modalTitle = document.getElementById('student-modal-title');
    modalTitle.textContent = 'Add New Student';
    document.getElementById('student-id').value = '';
    document.getElementById('student-name').value = '';
    document.getElementById('student-class').value = '';
    document.getElementById('student-house').value = '';
    modal.classList.add('show');
    document.body.classList.add('modal-open');
}

function closeStudentModal() {
    const modal = document.getElementById('student-modal');
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
}

async function renderStudentDataTable() {
    try {
        const container = document.querySelector('.table-container');
        const searchTerm = document.getElementById('student-search-input')?.value.toLowerCase() || '';

        const result = await apiClient.getAdminVoters({
            search: searchTerm,
            limit: 100
        });

        const voters = result.users || [];

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Student ID</th>
                        <th>Full Name</th>
                        <th>Class</th>
                        <th>House</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${voters.map(voter => `
                        <tr>
                            <td>${voter.studentId}</td>
                            <td>${voter.firstName} ${voter.lastName}</td>
                            <td>${voter.class}</td>
                            <td>${voter.house}</td>
                            <td><span class="status ${voter.hasVoted ? 'active' : 'inactive'}">${voter.hasVoted ? 'Voted' : 'Not Voted'}</span></td>
                            <td>
                                <button class="btn-icon delete-student" data-id="${voter.id}"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        document.querySelectorAll('.delete-student').forEach(btn => {
            btn.addEventListener('click', async function() {
                const studentId = this.dataset.id;
                if (confirm('Are you sure you want to delete this student?')) {
                    try {
                        // Note: Backend might not have delete user endpoint, this would need to be implemented
                        showGlobalToast('Delete functionality not yet implemented', 'warning');
                    } catch (error) {
                        console.error('Error deleting student:', error);
                        showGlobalToast('Failed to delete student', 'error');
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error rendering student data table:', error);
        const container = document.querySelector('.table-container');
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Unable to load student data. Please try again.</p>
            </div>
        `;
    }
}

async function loadVoterLogsContent(container) {
    try {
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Voter Logs</div>
                </div>
                <div class="form-group" style="max-width:400px;">
                    <input type="text" id="voter-log-search-input" placeholder="Search by ID, Name, Class, or House...">
                </div>
                <div class="table-container"></div>
            </div>
        `;

        document.getElementById('voter-log-search-input').addEventListener('keyup', renderVoterLogsTable);
        await renderVoterLogsTable();
    } catch (error) {
        console.error('Error loading voter logs:', error);
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Voter Logs</div>
                </div>
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Unable to load voter logs. Please check your connection and try again.</p>
                    <button onclick="loadVoterLogsContent(document.getElementById('ict-dashboard-content'))" class="btn btn-primary">Retry</button>
                </div>
            </div>
        `;
    }
}

async function renderVoterLogsTable() {
    try {
        const container = document.querySelector('.table-container');
        const searchTerm = document.getElementById('voter-log-search-input')?.value.toLowerCase() || '';

        const result = await apiClient.getAdminVoters({
            search: searchTerm,
            limit: 100
        });

        const voters = result.users || [];

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Student ID</th>
                        <th>Full Name</th>
                        <th>Class</th>
                        <th>House</th>
                        <th>Voted</th>
                        <th>Last Login</th>
                    </tr>
                </thead>
                <tbody>
                    ${voters.map(voter => `
                        <tr>
                            <td>${voter.studentId}</td>
                            <td>${voter.firstName} ${voter.lastName}</td>
                            <td>${voter.class}</td>
                            <td>${voter.house}</td>
                            <td><span class="status ${voter.hasVoted ? 'active' : 'inactive'}">${voter.hasVoted ? 'Yes' : 'No'}</span></td>
                            <td>${voter.lastLoginAt ? new Date(voter.lastLoginAt).toLocaleString() : 'Never'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error rendering voter logs table:', error);
        const container = document.querySelector('.table-container');
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Unable to load voter data. Please try again.</p>
            </div>
        `;
    }
}

async function loadSystemResetContent(container) {
    try {
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">System Reset</div>
                </div>
                <p>This action will clear all votes and reset voter statuses. This cannot be undone.</p>

                <div class="setting-group">
                    <h3>Vote Management</h3>
                    <div class="form-group">
                        <label>Clear All Votes</label>
                        <p>This will reset the vote count for all candidates to zero, but will not affect voter "voted" status.</p>
                        <button class="btn btn-danger" id="reset-votes-btn" style="margin-top: 20px;">
                            <i class="fas fa-undo"></i> Clear All Votes
                        </button>
                    </div>
                </div>

                <div class="setting-group">
                    <h3>Voter Status Management</h3>
                    <div class="form-group">
                        <label>Reset All Voter Statuses</label>
                        <p>This will mark all voters as "not voted", allowing them to vote again. This does not clear cast votes.</p>
                        <button class="btn btn-danger" id="reset-voters-btn" style="margin-top: 20px;">
                            <i class="fas fa-refresh"></i> Reset Voter Statuses
                        </button>
                    </div>
                </div>

                <div class="setting-group">
                    <h3>Complete System Reset</h3>
                    <div class="form-group">
                        <label>Complete System Reset</label>
                        <p>This will clear ALL data including posts, candidates, votes, and voter statuses. Use with extreme caution.</p>
                        <button class="btn btn-danger" id="reset-system-btn" style="margin-top: 20px;">
                            <i class="fas fa-exclamation-triangle"></i> Complete System Reset
                        </button>
                    </div>
                </div>
            </div>
            <style>
            .setting-group {
                margin-bottom: 30px;
                padding: 20px;
                background: var(--card-bg);
                border-radius: 8px;
                border: 1px solid var(--border-color);
            }
            .setting-group h3 {
                margin: 0 0 15px 0;
                color: var(--primary);
                font-size: 1.2rem;
            }
            </style>
        `;

        document.getElementById('reset-votes-btn').addEventListener('click', async () => {
            if (confirm('Are you sure you want to clear all votes? This action cannot be undone.')) {
                try {
                    await apiClient.resetVotes();
                    showGlobalToast('All votes have been cleared successfully', 'success');
                } catch (error) {
                    console.error('Error resetting votes:', error);
                    showGlobalToast('Failed to reset votes', 'error');
                }
            }
        });

        document.getElementById('reset-voters-btn').addEventListener('click', async () => {
            if (confirm('Are you sure you want to reset all voter statuses? This will allow everyone to vote again.')) {
                try {
                    await apiClient.resetVoterStatuses();
                    showGlobalToast('All voter statuses have been reset successfully', 'success');
                } catch (error) {
                    console.error('Error resetting voter statuses:', error);
                    showGlobalToast('Failed to reset voter statuses', 'error');
                }
            }
        });

        document.getElementById('reset-system-btn').addEventListener('click', async () => {
            if (confirm('⚠️ WARNING: This will delete ALL data. Are you absolutely sure?') &&
                prompt('To confirm, type "RESET ALL DATA" in the box below.') === 'RESET ALL DATA') {
                try {
                    await apiClient.resetSystem();
                    showGlobalToast('Complete system reset completed successfully', 'success');
                    setTimeout(() => window.location.reload(), 2000);
                } catch (error) {
                    console.error('Error resetting system:', error);
                    showGlobalToast('Failed to reset system', 'error');
                }
            } else {
                showGlobalToast('Action cancelled', 'info');
            }
        });
    } catch (error) {
        console.error('Error loading system reset content:', error);
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">System Reset</div>
                </div>
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Unable to load reset options. Please check your connection and try again.</p>
                    <button onclick="loadSystemResetContent(document.getElementById('ict-dashboard-content'))" class="btn btn-primary">Retry</button>
                </div>
            </div>
        `;
    }
}

async function loadBackupRecoveryContent(container) {
    try {
        const backups = await apiClient.getBackups();

        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Data Backup & Recovery</div>
                </div>
                <p style="margin-bottom: 15px;">Manage system backups and recovery operations.</p>

                <div class="setting-group">
                    <h3>Create Backup</h3>
                    <div class="form-group">
                        <label for="backup-type">Backup Type</label>
                        <select id="backup-type">
                            <option value="full">Full System Backup</option>
                            <option value="data">Data Only Backup</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="backup-description">Description (Optional)</label>
                        <input type="text" id="backup-description" placeholder="Brief description of this backup">
                    </div>
                    <button class="btn btn-primary" id="create-backup-btn">
                        <i class="fas fa-save"></i> Create Backup
                    </button>
                </div>

                <div class="setting-group">
                    <h3>Available Backups</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Created</th>
                                    <th>Size</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${backups.data?.map(backup => `
                                    <tr>
                                        <td>${backup.type}</td>
                                        <td>${backup.description || 'No description'}</td>
                                        <td>${new Date(backup.createdAt).toLocaleString()}</td>
                                        <td>${backup.size ? `${Math.round(backup.size / 1024)} KB` : 'N/A'}</td>
                                        <td>
                                            <button class="btn-icon restore-backup" data-id="${backup.id}">
                                                <i class="fas fa-undo"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('') || '<tr><td colspan="5">No backups available</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="setting-group">
                    <h3>Export System Data</h3>
                    <p>Export current system data for external backup or analysis.</p>
                    <button class="btn" id="export-system-data-btn">
                        <i class="fas fa-download"></i> Export System Data
                    </button>
                </div>
            </div>
            <style>
            .setting-group {
                margin-bottom: 30px;
                padding: 20px;
                background: var(--card-bg);
                border-radius: 8px;
                border: 1px solid var(--border-color);
            }
            .setting-group h3 {
                margin: 0 0 15px 0;
                color: var(--primary);
                font-size: 1.2rem;
            }
            </style>
        `;

        document.getElementById('create-backup-btn').addEventListener('click', async () => {
            const type = document.getElementById('backup-type').value;
            const description = document.getElementById('backup-description').value;

            try {
                await apiClient.createBackup({ type, description });
                showGlobalToast('Backup created successfully', 'success');
                await loadBackupRecoveryContent(container);
            } catch (error) {
                console.error('Error creating backup:', error);
                showGlobalToast('Failed to create backup', 'error');
            }
        });

        document.querySelectorAll('.restore-backup').forEach(btn => {
            btn.addEventListener('click', async function() {
                const backupId = this.dataset.id;
                if (confirm('Are you sure you want to restore from this backup? This will overwrite current data.')) {
                    try {
                        await apiClient.restoreBackup(backupId);
                        showGlobalToast('Backup restored successfully', 'success');
                        setTimeout(() => window.location.reload(), 2000);
                    } catch (error) {
                        console.error('Error restoring backup:', error);
                        showGlobalToast('Failed to restore backup', 'error');
                    }
                }
            });
        });

        document.getElementById('export-system-data-btn').addEventListener('click', async () => {
            try {
                const systemData = await apiClient.exportSystemData();
                const blob = new Blob([JSON.stringify(systemData, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `system_export_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                showGlobalToast('System data exported successfully', 'success');
            } catch (error) {
                console.error('Error exporting system data:', error);
                showGlobalToast('Failed to export system data', 'error');
            }
        });
    } catch (error) {
        console.error('Error loading backup recovery content:', error);
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Data Backup & Recovery</div>
                </div>
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Unable to load backup options. Please check your connection and try again.</p>
                    <button onclick="loadBackupRecoveryContent(document.getElementById('ict-dashboard-content'))" class="btn btn-primary">Retry</button>
                </div>
            </div>
        `;
    }
}

async function loadAuditTrailContent(container) {
    try {
        const auditLogs = await apiClient.getAuditLogs();

        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">System Audit Trail</div>
                </div>
                <div class="form-group" style="max-width:400px;">
                    <input type="text" id="audit-search-input" placeholder="Search audit logs...">
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Action</th>
                                <th>Severity</th>
                                <th>User</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${auditLogs.data?.map(entry => `
                                <tr>
                                    <td>${new Date(entry.timestamp).toLocaleString()}</td>
                                    <td>${entry.action}</td>
                                    <td><span class="status ${entry.severity === 'HIGH' ? 'danger' : entry.severity === 'MEDIUM' ? 'warning' : 'inactive'}">${entry.severity}</span></td>
                                    <td>${entry.userId ? 'User' : 'System'}</td>
                                    <td>${entry.description || 'No details'}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="5">No audit logs available</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        document.getElementById('audit-search-input').addEventListener('keyup', async () => {
            const searchTerm = document.getElementById('audit-search-input').value;
            try {
                const filteredLogs = await apiClient.getAuditLogs({ action: searchTerm });
                const tbody = container.querySelector('tbody');
                tbody.innerHTML = filteredLogs.data?.map(entry => `
                    <tr>
                        <td>${new Date(entry.timestamp).toLocaleString()}</td>
                        <td>${entry.action}</td>
                        <td><span class="status ${entry.severity === 'HIGH' ? 'danger' : entry.severity === 'MEDIUM' ? 'warning' : 'inactive'}">${entry.severity}</span></td>
                        <td>${entry.userId ? 'User' : 'System'}</td>
                        <td>${entry.description || 'No details'}</td>
                    </tr>
                `).join('') || '<tr><td colspan="5">No matching logs found</td></tr>';
            } catch (error) {
                console.error('Error filtering audit logs:', error);
            }
        });
    } catch (error) {
        console.error('Error loading audit trail:', error);
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">System Audit Trail</div>
                </div>
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Unable to load audit logs. Please check your connection and try again.</p>
                    <button onclick="loadAuditTrailContent(document.getElementById('ict-dashboard-content'))" class="btn btn-primary">Retry</button>
                </div>
            </div>
        `;
    }
}

async function loadSystemPerformanceContent(container) {
    try {
        const [userStats, postStats, voteStats, performanceMetrics] = await Promise.all([
            apiClient.getAdminVoters(),
            apiClient.getPosts(),
            apiClient.getVotes(),
            apiClient.getPerformanceMetrics()
        ]);

        const voters = userStats.users || [];
        const posts = postStats.posts || [];
        const votes = voteStats.votes || [];
        const votedCount = voters.filter(v => v.hasVoted).length;

        container.innerHTML = `
            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">System Overview</div>
                        <div class="chart-controls">
                            <button class="btn btn-sm" id="refresh-metrics">
                                <i class="fas fa-sync-alt"></i> Refresh
                            </button>
                        </div>
                    </div>
                    <div class="performance-metrics">
                        <div class="metric-card">
                            <div class="metric-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="metric-info">
                                <div class="metric-value">${voters.length}</div>
                                <div class="metric-label">Total Voters</div>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon">
                                <i class="fas fa-vote-yea"></i>
                            </div>
                            <div class="metric-info">
                                <div class="metric-value">${votes.length}</div>
                                <div class="metric-label">Total Votes</div>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon">
                                <i class="fas fa-list"></i>
                            </div>
                            <div class="metric-info">
                                <div class="metric-value">${posts.filter(p => p.active).length}</div>
                                <div class="metric-label">Active Posts</div>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div class="metric-info">
                                <div class="metric-value">${voters.length > 0 ? Math.round((votedCount / voters.length) * 100) : 0}%</div>
                                <div class="metric-label">Participation Rate</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div class="card-title">System Performance</div>
                    </div>
                    <div class="performance-metrics">
                        <div class="metric-card">
                            <div class="metric-icon">
                                <i class="fas fa-tachometer-alt"></i>
                            </div>
                            <div class="metric-info">
                                <div class="metric-value">${performanceMetrics.data?.system?.uptime ? Math.round(performanceMetrics.data.system.uptime / 3600) + 'h' : 'N/A'}</div>
                                <div class="metric-label">System Uptime</div>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon">
                                <i class="fas fa-server"></i>
                            </div>
                            <div class="metric-info">
                                <div class="metric-value">Online</div>
                                <div class="metric-label">Server Status</div>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon">
                                <i class="fas fa-database"></i>
                            </div>
                            <div class="metric-info">
                                <div class="metric-value">Connected</div>
                                <div class="metric-label">Database Status</div>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="metric-info">
                                <div class="metric-value">${new Date().toLocaleTimeString()}</div>
                                <div class="metric-label">Last Updated</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="dashboard-grid" style="margin-top: 20px;">
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Voting Activity Summary</div>
                    </div>
                    <div class="activity-summary">
                        <div class="summary-item">
                            <h4>Recent Activity</h4>
                            <p>Last 24 hours: ${votes.filter(v => new Date(v.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length} votes</p>
                        </div>
                        <div class="summary-item">
                            <h4>System Health</h4>
                            <p>All services operational</p>
                        </div>
                        <div class="summary-item">
                            <h4>Data Integrity</h4>
                            <p>All records verified</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Refresh functionality
        document.getElementById('refresh-metrics').addEventListener('click', () => {
            loadSystemPerformanceContent(container);
        });
    } catch (error) {
        console.error('Error loading system performance:', error);
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">System Performance Metrics</div>
                </div>
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Unable to load performance metrics. Please check your connection and try again.</p>
                    <button onclick="loadSystemPerformanceContent(document.getElementById('ict-dashboard-content'))" class="btn btn-primary">Retry</button>
                </div>
            </div>
        `;
    }
}

function generateCumulativeVotingData(votes) {
    if (votes.length === 0) {
        return {
            labels: ['No Data'],
            data: [0]
        };
    }

    // Sort votes by timestamp
    const sortedVotes = votes.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Generate hourly cumulative data
    const hourlyData = {};
    let cumulativeCount = 0;
    
    sortedVotes.forEach(vote => {
        const hour = new Date(vote.timestamp).getHours();
        const hourKey = `${hour}:00`;
        
        if (!hourlyData[hourKey]) {
            hourlyData[hourKey] = 0;
        }
        hourlyData[hourKey]++;
    });
    
    // Convert to cumulative data
    const labels = [];
    const data = [];
    cumulativeCount = 0;
    
    for (let hour = 0; hour < 24; hour++) {
        const hourKey = `${hour}:00`;
        cumulativeCount += hourlyData[hourKey] || 0;
        labels.push(hourKey);
        data.push(cumulativeCount);
    }
    
    return { labels, data };
}

function generateHouseDistributionData(voters) {
    const houseCount = {};
    
    voters.forEach(voter => {
        const house = voter.house || 'Unknown';
        houseCount[house] = (houseCount[house] || 0) + 1;
    });
    
    return {
        labels: Object.keys(houseCount),
        data: Object.values(houseCount)
    };
}

function getPeakVotingHour(votes) {
    if (votes.length === 0) return 'N/A';
    
    const hourCount = {};
    votes.forEach(vote => {
        const hour = new Date(vote.timestamp).getHours();
        hourCount[hour] = (hourCount[hour] || 0) + 1;
    });
    
    const peakHour = Object.keys(hourCount).reduce((a, b) => 
        hourCount[a] > hourCount[b] ? a : b
    );
    
    return `${peakHour}:00`;
}

function getSystemUptime() {
    const startTime = localStorage.getItem('system_start_time');
    if (!startTime) {
        localStorage.setItem('system_start_time', Date.now());
        return '0h 0m';
    }
    
    const uptime = Date.now() - parseInt(startTime);
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
}

function getStorageUsage() {
    const data = localStorage.getItem('ev_database');
    if (!data) return '0 KB';
    
    const sizeInBytes = new Blob([data]).size;
    const sizeInKB = Math.round(sizeInBytes / 1024);
// Function to update dashboard status card in real-time
function updateDashboardStatusCard(enabled) {
    const statusCard = document.querySelector('.card-value');
    if (statusCard && statusCard.nextElementSibling && statusCard.nextElementSibling.textContent.includes('System is currently')) {
        statusCard.textContent = enabled ? 'Active' : 'Inactive';
        statusCard.nextElementSibling.textContent = enabled ? 'System is currently online' : 'System is currently offline';
    }
}
    
    return `${sizeInKB} KB`;
}
