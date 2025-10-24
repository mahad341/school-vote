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

function loadIctDashboardContent(container) {
    const db = evAPI.getDatabase();
    const voters = db.voters || [];
    const votes = db.votes || [];
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
                    <div class="card-title">Voting System Status</div>
                    <div class="card-icon posts">
                        <i class="fas fa-power-off"></i>
                    </div>
                </div>
                <div class="card-value">${(db.system_status && db.system_status.enabled) ? 'Active' : 'Inactive'}</div>
                <div class="card-label">System is currently online</div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Last System Reset</div>
                    <div class="card-icon candidates">
                        <i class="fas fa-bomb"></i>
                    </div>
                </div>
                <div class="card-value">${db.last_reset ? new Date(db.last_reset).toLocaleDateString() : 'Never'}</div>
                <div class="card-label">Last system-wide reset</div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Last Backup</div>
                    <div class="card-icon">
                        <i class="fas fa-database"></i>
                    </div>
                </div>
                <div class="card-value">${db.last_backup ? new Date(db.last_backup).toLocaleDateString() : 'Never'}</div>
                <div class="card-label">Last data backup performed</div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Admin Activity</div>
                    <div class="card-icon">
                        <i class="fas fa-history"></i>
                    </div>
                </div>
                <div class="card-value">${(db.audit_log || []).length}</div>
                <div class="card-label">Total admin actions logged</div>
            </div>
        </div>
    `;
}

function loadSystemStatusContent(container) {
    const db = evAPI.getDatabase();
    const systemStatus = db.system_status || { enabled: true, history: [] };

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
                <div class="card-title">Status Change History</div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Action</th>
                            <th>User</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${systemStatus.history.map(entry => `
                            <tr>
                                <td>${new Date(entry.timestamp).toLocaleString()}</td>
                                <td>${entry.action}</td>
                                <td>${entry.user}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const toggle = document.getElementById('system-status-toggle');
    const statusText = document.getElementById('current-status-text');

    toggle.addEventListener('click', () => {
        const db = evAPI.getDatabase();
        const wasEnabled = db.system_status.enabled;
        // Toggle the status
        db.system_status.enabled = !db.system_status.enabled;
        // Add to history
        db.system_status.history.push({
            timestamp: new Date().toISOString(),
            action: db.system_status.enabled ? 'System Enabled' : 'System Disabled',
            user: 'ICT Admin'
        });
        // Save to database
        evAPI.saveDatabase(db);
        // Dispatch custom event to notify other parts of the application
        window.dispatchEvent(new CustomEvent('systemStatusChanged', {
            detail: { enabled: db.system_status.enabled, wasEnabled: wasEnabled }
        }));
        // Auto-backup only when system is disabled (not when enabled)
        if (!db.system_status.enabled && typeof performAutoBackup === 'function') {
            performAutoBackup();
        }
        // Animate toggle slider
        toggle.classList.toggle('active');
        // Update status text with animation
        statusText.className = `status-text ${db.system_status.enabled ? 'enabled' : 'disabled'}`;
        statusText.textContent = db.system_status.enabled ? 'System Enabled' : 'System Disabled';
        // Show global toast notification
        const toastMessage = db.system_status.enabled ?
            'Voting system has been enabled. Users can now access the system.' :
            'Voting system has been disabled. Auto-backup completed.';
        showGlobalToast(toastMessage, db.system_status.enabled ? 'success' : 'warning');
        // Update dashboard status card immediately
        updateDashboardStatusCard(db.system_status.enabled);
        // Instead of reloading, update history table and info directly to maintain toggle state
        const historyTableBody = container.querySelector('.table-container tbody');
        if (historyTableBody) {
            const entry = db.system_status.history[db.system_status.history.length - 1];
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${new Date(entry.timestamp).toLocaleString()}</td>
                <td>${entry.action}</td>
                <td>${entry.user}</td>
            `;
            historyTableBody.insertBefore(newRow, historyTableBody.firstChild);
        }
        // Also update info paragraph
        const infoPara = container.querySelector('.system-status-indicator + p');
        if (infoPara) {
            infoPara.innerHTML = `<i class="fas fa-info-circle"></i> ${db.system_status.enabled ? 'The voting system is currently online and accepting votes.' : 'The voting system is offline. Only ICT administrators can access the system.'}`;
        }
    });
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

function loadStudentDataContent(container) {
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
        document.getElementById('student-form').addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent default form submission

            const id = document.getElementById('student-id').value.trim();
            const name = document.getElementById('student-name').value.trim();
            const className = document.getElementById('student-class').value.trim();
            const house = document.getElementById('student-house').value.trim();

            // Basic form validation
            if (!id || !name || !className || !house) {
                alert('Please fill in all fields');
                return;
            }

            // Log data to console as requested
            console.log('Student Data:', { id, name, className, house });

            // Save to database
            evAPI.saveVoter({ id, name, className, house, voted: false });
            closeStudentModal();
            renderStudentDataTable();
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

    document.getElementById('csv-file-input').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const text = e.target.result;
                const rows = text.split(/\r?\n/).slice(1); // Skip header, handle both LF and CRLF
                let importedCount = 0;
                const db = evAPI.getDatabase();

                rows.forEach(row => {
                    if (row.trim()) { // Skip empty rows
                        const [id, name, className, house] = row.split(',');
                        if (id && name && className && house) {
                            const voter = {
                                id: id.trim(),
                                name: name.trim(),
                                className: className.trim(),
                                house: house.trim(),
                                voted: false
                            };
                            if (!db.voters.find(v => v.id === voter.id)) {
                                db.voters.push(voter);
                                importedCount++;
                            }
                        }
                    }
                });

                evAPI.saveDatabase(db);
                alert(`${importedCount} new voters imported successfully.`);
                renderStudentDataTable();
            };
            reader.readAsText(file);
        }
    });

    renderStudentDataTable();
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

function renderStudentDataTable() {
    const container = document.querySelector('.table-container');
    let voters = evAPI.getVoters();
    const searchTerm = document.getElementById('student-search-input')?.value.toLowerCase() || '';

    if (searchTerm) {
        voters = voters.filter(voter =>
            voter.id.toLowerCase().includes(searchTerm) ||
            voter.name.toLowerCase().includes(searchTerm) ||
            voter.className.toLowerCase().includes(searchTerm) ||
            voter.house.toLowerCase().includes(searchTerm)
        );
    }

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Student ID</th>
                    <th>Full Name</th>
                    <th>Class</th>
                    <th>House</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${voters.map(voter => `
                    <tr>
                        <td>${voter.id}</td>
                        <td>${voter.name}</td>
                        <td>${voter.className}</td>
                        <td>${voter.house}</td>
                        <td>
                            <button class="btn-icon delete-student" data-id="${voter.id}"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    document.querySelectorAll('.delete-student').forEach(btn => {
        btn.addEventListener('click', function() {
            const studentId = this.dataset.id;
            if (confirm('Are you sure you want to delete this student?')) {
                const db = evAPI.getDatabase();
                db.voters = db.voters.filter(v => v.id !== studentId);
                evAPI.saveDatabase(db);
                renderStudentDataTable();
            }
        });
    });
}

function loadVoterLogsContent(container) {
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
    renderVoterLogsTable();
}

function renderVoterLogsTable() {
    const container = document.querySelector('.table-container');
    let voters = evAPI.getVoters();
    const searchTerm = document.getElementById('voter-log-search-input')?.value.toLowerCase() || '';

    if (searchTerm) {
        voters = voters.filter(voter =>
            voter.id.toLowerCase().includes(searchTerm) ||
            voter.name.toLowerCase().includes(searchTerm) ||
            voter.className.toLowerCase().includes(searchTerm) ||
            voter.house.toLowerCase().includes(searchTerm)
        );
    }

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Student ID</th>
                    <th>Full Name</th>
                    <th>Class</th>
                    <th>House</th>
                    <th>Voted</th>
                </tr>
            </thead>
            <tbody>
                ${voters.map(voter => `
                    <tr>
                        <td>${voter.id}</td>
                        <td>${voter.name}</td>
                        <td>${voter.className}</td>
                        <td>${voter.house}</td>
                        <td><span class="status ${voter.voted ? 'active' : 'inactive'}">${voter.voted ? 'Yes' : 'No'}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function loadSystemResetContent(container) {
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-title">System Reset</div>
            </div>
            <p>This action will clear all votes, flags, and logs. This cannot be undone.</p>
            <div class="form-group">
                <label for="reset-passcode">Enter Security Passcode</label>
                <input type="password" id="reset-passcode" placeholder="Enter passcode">
            </div>
            <button class="btn btn-danger" id="reset-system-btn">Reset System</button>
        </div>
    `;

    document.getElementById('reset-system-btn').addEventListener('click', () => {
        const passcode = document.getElementById('reset-passcode').value;
        const password = prompt('Enter your password to confirm system reset:');
        const db = evAPI.getDatabase();
        // NOTE: In a real app, passwords should be hashed.
        if (password === 'ictadmin123' && passcode === 'ICT-ADMIN-RESET') {
            if (confirm('Are you absolutely sure you want to reset the entire system?')) {
                db.votes = [];
                db.voters.forEach(v => v.voted = false);
                db.audit_log.push({
                    timestamp: new Date().toISOString(),
                    action: 'System Reset',
                    user: 'ICT Admin'
                });
                db.last_reset = new Date().toISOString();
                evAPI.saveDatabase(db);
                // Auto-backup after system reset
                if (typeof performAutoBackup === 'function') {
                    performAutoBackup();
                }
                alert('System has been reset.');
                loadIctSection('dashboard');
            }
        } else {
            alert('Incorrect password or passcode.');
        }
    });
}

function loadBackupRecoveryContent(container) {
    const db = evAPI.getDatabase();

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-title">Data Backup & Recovery</div>
            </div>
            <p style="margin-bottom: 15px;">Last backup: ${db.last_backup ? new Date(db.last_backup).toLocaleString() : 'Never'}</p>
            <button class="btn btn-primary" id="backup-now-btn">Backup Now</button>
            <button class="btn" id="restore-backup-btn">Restore from Backup</button>
            <input type="file" id="restore-file-input" style="display:none;" accept=".json">
        </div>
    `;

    document.getElementById('backup-now-btn').addEventListener('click', () => {
        const db = evAPI.getDatabase();
        const dataStr = JSON.stringify(db);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'evote-backup.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        db.last_backup = new Date().toISOString();
        evAPI.saveDatabase(db);
        loadBackupRecoveryContent(container);
    });

    document.getElementById('restore-backup-btn').addEventListener('click', () => {
        document.getElementById('restore-file-input').click();
    });

    document.getElementById('restore-file-input').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const db = JSON.parse(e.target.result);
                    evAPI.saveDatabase(db);
                    alert('Backup restored successfully.');
                    loadIctSection('dashboard');
                } catch (error) {
                    alert('Invalid backup file.');
                }
            };
            reader.readAsText(file);
        }
    });
}

function loadAuditTrailContent(container) {
    const auditLog = (evAPI.getDatabase().audit_log || []).reverse();

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-title">System Audit Trail</div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Action</th>
                            <th>User</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${auditLog.map(entry => `
                            <tr>
                                <td>${new Date(entry.timestamp).toLocaleString()}</td>
                                <td>${entry.action}</td>
                                <td>${entry.user}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function loadSystemPerformanceContent(container) {
    const db = evAPI.getDatabase();
    const votes = db.votes || [];
    const voters = db.voters || [];
    const votedCount = voters.filter(v => v.voted).length;

    container.innerHTML = `
        <div class="dashboard-grid">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Cumulative Voting Activity</div>
                    <div class="chart-controls">
                        <button class="btn btn-sm" id="refresh-chart">
                            <i class="fas fa-sync-alt"></i> Refresh
                        </button>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="votingActivityChart"></canvas>
                </div>
                <div class="chart-stats">
                    <div class="stat-item">
                        <span class="stat-label">Total Votes:</span>
                        <span class="stat-value">${votes.length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Participation Rate:</span>
                        <span class="stat-value">${voters.length > 0 ? Math.round((votedCount / voters.length) * 100) : 0}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Peak Hour:</span>
                        <span class="stat-value">${getPeakVotingHour(votes)}</span>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Voting Distribution by House</div>
                </div>
                <div class="chart-container">
                    <canvas id="houseDistributionChart"></canvas>
                </div>
            </div>
        </div>
        
        <div class="dashboard-grid" style="margin-top: 20px;">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">System Performance Metrics</div>
                </div>
                <div class="performance-metrics">
                    <div class="metric-card">
                        <div class="metric-icon">
                            <i class="fas fa-tachometer-alt"></i>
                        </div>
                        <div class="metric-info">
                            <div class="metric-value">${getSystemUptime()}</div>
                            <div class="metric-label">System Uptime</div>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">
                            <i class="fas fa-database"></i>
                        </div>
                        <div class="metric-info">
                            <div class="metric-value">${getStorageUsage()}</div>
                            <div class="metric-label">Storage Used</div>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="metric-info">
                            <div class="metric-value">${voters.length}</div>
                            <div class="metric-label">Registered Voters</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Cumulative Voting Activity Chart
    const votingCtx = document.getElementById('votingActivityChart').getContext('2d');
    const cumulativeData = generateCumulativeVotingData(votes);
    
    new Chart(votingCtx, {
        type: 'line',
        data: {
            labels: cumulativeData.labels,
            datasets: [{
                label: 'Cumulative Votes',
                data: cumulativeData.data,
                backgroundColor: 'rgba(0, 82, 155, 0.1)',
                borderColor: '#00529B',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#00529B',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#00529B',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Votes'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });

    // House Distribution Chart
    const houseCtx = document.getElementById('houseDistributionChart').getContext('2d');
    const houseData = generateHouseDistributionData(voters);
    
    new Chart(houseCtx, {
        type: 'doughnut',
        data: {
            labels: houseData.labels,
            datasets: [{
                data: houseData.data,
                backgroundColor: [
                    '#00529B',
                    '#F2A900', 
                    '#4CAF50',
                    '#FF9800',
                    '#9C27B0',
                    '#2196F3'
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((context.parsed / total) * 100);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // Refresh chart functionality
    document.getElementById('refresh-chart').addEventListener('click', () => {
        loadSystemPerformanceContent(container);
    });
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
