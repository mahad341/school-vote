// Import global toast function from ict-admin.js if available
if (typeof showGlobalToast === 'undefined') {
    window.showGlobalToast = function(message, type = 'info', duration = 4000) {
        // Try to access from ict-admin.js if loaded
        if (window.parent && window.parent.showGlobalToast) {
            return window.parent.showGlobalToast(message, type, duration);
        }
        // Otherwise, fallback: simple alert
        alert(message);
    };
}

// User profile modal logic for admin dashboard
const userInfo = document.querySelector('.user-info');
if (userInfo) {
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
            <div class="card profile-card" style="max-width:400px;margin:80px auto;position:relative;padding:2%;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
                <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10%;margin-top:5%;">
                    <div class="card-title" style="font-size:1.25rem;font-weight:700;letter-spacing:0.5px;">User Profile</div>
                    <button id="close-profile-modal" style="background:none;border:none;cursor:pointer;font-size:1.5rem;color:#888;line-height:1;margin-left:80%;margin-top:-10%">&times;</button>
                </div>
                <div style="display:flex;align-items:center;gap:20px;margin-bottom:16px;flex-wrap:wrap;">
                    <div class="user-avatar" style="width:64px;height:64px;border-radius:50%;background:var(--primary-light,#eee);display:flex;align-items:center;justify-content:center;font-size:2.2rem;color:var(--primary,#00529B);">
                        <i class="fas fa-user-shield"></i>
                    </div>
                    <div style="min-width:120px;">
                        <div style="font-size:1.1rem;font-weight:700;line-height:1.3;">Admin User</div>
                        <div style="color:var(--accent-light,#666);font-size:0.98rem;">Role: <span style="font-weight:600;">Administrator</span></div>
                        <div style="color:var(--accent-light,#666);font-size:0.98rem;">Username: <span style="font-weight:600;">admin</span></div>
                    </div>
                </div>
                <div class="card-body" style="font-size:1rem;line-height:1.7;margin-top:10%">
                    <div style="margin-bottom:6px;color: var(--accent-light);"><strong>Email:</strong> <span style="font-weight:500;color:white;">admin@school.edu</span></div>
                    <div style="margin-bottom:6px;color: var(--accent-light);"><strong>Last Login:</strong> <span style="font-weight:500; color:white;">${new Date().toLocaleString()}</span></div>
                    <div><strong style="color: var(--accent);">Account Status:</strong> <span class="status active" style="font-size:0.95rem;vertical-align:middle;">Active</span></div>
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
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('admin-module')) {
        // Check if using backend or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const useBackend = urlParams.get('backend') === 'true';

        if (useBackend) {
            // Initialize with backend integration
            initAdminModuleBackend();
        } else {
            // Fallback to localStorage
            const db = evAPI.getDatabase();
            if (db.system_status && !db.system_status.enabled) {
                showAdminSystemDisabledMessage();
                return;
            }
            initAdminModule();
        }
    }
});

// Function to show admin system disabled message
function showAdminSystemDisabledMessage() {
    // Trigger auto-backup when system is disabled
    performAutoBackup();

    document.body.innerHTML = `
        <div class="system-disabled-message">
            <h1><i class="fas fa-exclamation-triangle"></i> System is Currently Disabled</h1>
            <p>The voting system is currently offline. Only the ICT administrator can log in.</p>
            <div class="backup-status" id="backup-status">
                <i class="fas fa-shield-alt"></i> Auto-backup completed successfully
            </div>
            <div class="ict-login-form">
                  <div class="form-group">
                    <label for="ict-admin-username">ICT Admin Username</label>
                    <input type="text" id="ict-admin-username" placeholder="Enter ICT admin username">
                </div>
                <div class="form-group">
                    <label for="ict-admin-password">ICT Admin Password</label>
                    <input type="password" id="ict-admin-password" placeholder="Enter ICT admin password">
                </div>
                <button id="ict-admin-login-btn" class="btn btn-primary">Login</button>
            </div>
        </div>
    `;
    const ictAdminLoginBtn = document.getElementById('ict-admin-login-btn');
    if (ictAdminLoginBtn) {
        ictAdminLoginBtn.addEventListener('click', function() {
            const username = document.getElementById('ict-admin-username').value.trim();
            const password = document.getElementById('ict-admin-password').value.trim();
            if (username === 'ictadmin' && password === 'ictadmin123') {
                window.location.href = 'ICT-Admin.html';
            } else {
                alert('Invalid ICT admin credentials');
            }
        });
    }
}

// Listen for system status changes on admin page
window.addEventListener('systemStatusChanged', function(event) {
    const { enabled } = event.detail;
    if (!enabled && document.getElementById('admin-module')) {
        showAdminSystemDisabledMessage();
    } else if (enabled && document.querySelector('.system-disabled-message')) {
        // If system is re-enabled and we're on the disabled admin page, redirect to admin page
        window.location.reload();
    }
});



// Auto-backup functionality
function performAutoBackup() {
    try {
        const db = evAPI.getDatabase();
        const timestamp = new Date().toISOString();
        
        // Create comprehensive backup data
        const backupData = {
            timestamp: timestamp,
            system_configurations: {
                system_status: db.system_status,
                settings: db.settings || {},
                theme_preferences: localStorage.getItem('theme') || 'light'
            },
            voting_data: {
                posts: db.posts || [],
                candidates: db.candidates || [],
                votes: db.votes || [],
                guidelines: db.guidelines || ''
            },
            voter_data: {
                voters: db.voters || [],
                admin_users: db.admin_users || []
            },
            audit_data: {
                audit_log: db.audit_log || [],
                system_logs: db.system_logs || []
            },
            statistics: {
                total_voters: db.voters ? db.voters.length : 0,
                total_votes: db.votes ? db.votes.length : 0,
                total_candidates: db.candidates ? db.candidates.length : 0,
                voter_turnout: db.voters && db.votes ? 
                    Math.round((db.votes.length / db.voters.length) * 100) : 0
            }
        };

        // Store backup in localStorage with timestamp
        const backupKey = `ev_backup_${timestamp.split('T')[0]}_${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(backupData));
        
        // Keep only last 5 backups to prevent storage overflow
        const allBackups = Object.keys(localStorage).filter(key => key.startsWith('ev_backup_'));
        if (allBackups.length > 5) {
            allBackups.sort().slice(0, -5).forEach(key => localStorage.removeItem(key));
        }

        // Add backup entry to audit log
        if (!db.audit_log) db.audit_log = [];
        db.audit_log.push({
            timestamp: timestamp,
            action: 'System auto-backup completed',
            user: 'System',
            details: `Backup created: ${backupKey}`
        });
        
        evAPI.saveDatabase(db);
        
        console.log('Auto-backup completed successfully:', backupKey);
        return true;
    } catch (error) {
        console.error('Auto-backup failed:', error);
        return false;
    }
}

// Function to restore from backup
function restoreFromBackup(backupKey) {
    try {
        const backupData = JSON.parse(localStorage.getItem(backupKey));
        if (!backupData) {
            throw new Error('Backup data not found');
        }

        const db = evAPI.getDatabase();
        
        // Restore system configurations
        db.system_status = backupData.system_configurations.system_status;
        db.settings = backupData.system_configurations.settings;
        
        // Restore voting data
        db.posts = backupData.voting_data.posts;
        db.candidates = backupData.voting_data.candidates;
        db.votes = backupData.voting_data.votes;
        db.guidelines = backupData.voting_data.guidelines;
        
        // Restore voter data
        db.voters = backupData.voter_data.voters;
        db.admin_users = backupData.voter_data.admin_users;
        
        // Restore audit data
        db.audit_log = backupData.audit_data.audit_log;
        db.system_logs = backupData.audit_data.system_logs;
        
        // Add restore entry to audit log
        db.audit_log.push({
            timestamp: new Date().toISOString(),
            action: 'System restored from backup',
            user: 'ICT Admin',
            details: `Restored from: ${backupKey}`
        });
        
        evAPI.saveDatabase(db);
        
        // Restore theme preference
        if (backupData.system_configurations.theme_preferences) {
            localStorage.setItem('theme', backupData.system_configurations.theme_preferences);
        }
        
        return true;
    } catch (error) {
        console.error('Restore failed:', error);
        return false;
    }
}

// Function to get available backups
function getAvailableBackups() {
    const backups = [];
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('ev_backup_')) {
            try {
                const backupData = JSON.parse(localStorage.getItem(key));
                backups.push({
                    key: key,
                    timestamp: backupData.timestamp,
                    statistics: backupData.statistics
                });
            } catch (error) {
                console.error('Invalid backup data:', key);
            }
        }
    });
    return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function createAdminModals() {
    // Create post modal if it doesn't exist
    if (!document.getElementById('post-modal')) {
        const postModal = document.createElement('div');
        postModal.id = 'post-modal';
        postModal.className = 'modal';
        postModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="post-modal-title" style="color: var(--accent); font-weight: bold;">Add New Election Post</h2>
                    <span class="close-btn" id="close-post-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="post-form">
                        <input type="hidden" id="post-id-input">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="post-title-input">Post Title</label>
                                <input type="text" id="post-title-input" placeholder="e.g., School President" required>
                            </div>
                            <div class="form-group">
                                <label for="post-order">Voting Order</label>
                                <input type="number" id="post-order" min="1" value="1" required>
                            </div>
                            <div class="form-group">
                                <label for="post-status">Status</label>
                                <select id="post-status" required>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="post-description">Description</label>
                            <textarea id="post-description" rows="3" placeholder="Describe the responsibilities of this position" required></textarea>
                        </div>
                        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                            <button type="button" class="btn" id="cancel-post-btn">Cancel</button>
                            <button type="submit" class="btn btn-primary" id="save-post-btn">Save Post</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(postModal);

        // Add ESC key support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && postModal.classList.contains('show')) {
                closePostModal();
            }
        });

        // Add backdrop click to close
        postModal.addEventListener('click', (e) => {
            if (e.target === postModal) {
                closePostModal();
            }
        });

        // Add modal button event listeners
        document.getElementById('close-post-modal').addEventListener('click', closePostModal);
        document.getElementById('cancel-post-btn').addEventListener('click', closePostModal);

        // Handle form submission
        document.getElementById('post-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('post-id-input').value;
            const title = document.getElementById('post-title-input').value.trim();
            const description = document.getElementById('post-description').value.trim();
            const order = parseInt(document.getElementById('post-order').value);
            const status = document.getElementById('post-status').value;

            if (!title || !description) {
                alert('Please fill in all required fields');
                return;
            }

            console.log('Post Data:', { id, title, description, order, status });

            const postData = {
                id: id || title.toLowerCase().replace(/\s+/g, '-'),
                title: title,
                description: description,
                order: order,
                active: status === 'active'
            };

            // Check if backend mode
            const urlParams = new URLSearchParams(window.location.search);
            const useBackend = urlParams.get('backend') === 'true';

            if (useBackend) {
                try {
                    if (id) {
                        await apiClient.updatePost(id, postData);
                    } else {
                        await apiClient.createPost(postData);
                    }
                    await loadPostsContentBackend(document.getElementById('dashboard-content'));
                } catch (error) {
                    console.error('Error saving post:', error);
                    alert('Failed to save post. Please try again.');
                    return;
                }
            } else {
                evAPI.savePost(postData);
                loadPostsContent(document.getElementById('dashboard-content'));
            }

            closePostModal();
            alert('Post saved successfully!');
        });
    }

    // Create special post modal if it doesn't exist
    if (!document.getElementById('special-post-modal')) {
        const specialPostModal = document.createElement('div');
        specialPostModal.id = 'special-post-modal';
        specialPostModal.className = 'modal';
        specialPostModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="special-post-modal-title" style="color: var(--accent); font-weight: bold;">Add Special Post - House Prefect</h2>
                    <span class="close-btn" id="close-special-post-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="special-post-form">
                        <input type="hidden" id="special-post-id-input">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="special-post-title-input">Post Title</label>
                                <input type="text" id="special-post-title-input" placeholder="e.g., Kakungulu House Prefect" required>
                            </div>
                            <div class="form-group">
                                <label for="special-post-order">Voting Order</label>
                                <input type="number" id="special-post-order" min="1" readonly required title="This field is auto-calculated and cannot be edited manually">
                            </div>
                            <div class="form-group">
                                <label for="special-post-house">House</label>
                                <select id="special-post-house" required>
                                    <option value="">Select House</option>
                                    <option value="Kakungulu">Kakungulu</option>
                                    <option value="Africa">Africa</option>
                                    <option value="Agakhan">Agakhan</option>
                                    <option value="Luwangula">Luwangula</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="special-post-gender">Gender</label>
                                <select id="special-post-gender" required>
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="special-post-level">Level</label>
                                <select id="special-post-level" required>
                                    <option value="">Select Level</option>
                                    <option value="O' Level">O' Level</option>
                                    <option value="A' Level">A' Level</option>
                                    
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="special-post-status">Status</label>
                                <select id="special-post-status" required>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="special-post-description">Description</label>
                            <textarea id="special-post-description" rows="3" placeholder="Describe the responsibilities of this house prefect position" required></textarea>
                        </div>
                        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                            <button type="button" class="btn" id="cancel-special-post-btn">Cancel</button>
                            <button type="submit" class="btn btn-primary" id="save-special-post-btn">Save Special Post</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(specialPostModal);

        // Add ESC key support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && specialPostModal.classList.contains('show')) {
                closeSpecialPostModal();
            }
        });

        // Add backdrop click to close
        specialPostModal.addEventListener('click', (e) => {
            if (e.target === specialPostModal) {
                closeSpecialPostModal();
            }
        });

        // Add modal button event listeners
        document.getElementById('close-special-post-modal').addEventListener('click', closeSpecialPostModal);
        document.getElementById('cancel-special-post-btn').addEventListener('click', closeSpecialPostModal);

        // Handle form submission
        document.getElementById('special-post-form').addEventListener('submit', (e) => {
            e.preventDefault();

            const id = document.getElementById('special-post-id-input').value;
            const title = document.getElementById('special-post-title-input').value.trim();
            const description = document.getElementById('special-post-description').value.trim();
            const order = parseInt(document.getElementById('special-post-order').value);
            const house = document.getElementById('special-post-house').value;
            const gender = document.getElementById('special-post-gender').value;
            const level = document.getElementById('special-post-level').value;
            const status = document.getElementById('special-post-status').value;

            if (!title || !description || !house || !gender || !level) {
                alert('Please fill in all required fields');
                return;
            }

            console.log('Special Post Data:', { id, title, description, order, house, gender, level, status });

            const specialPostData = {
                id: id || title.toLowerCase().replace(/\s+/g, '-'),
                title: title,
                description: description,
                order: order,
                house: house,
                gender: gender,
                level: level,
                active: status === 'active',
                type: 'special'
            };

            evAPI.savePost(specialPostData);

            // Renumber all posts to ensure continuous sequential ordering
            renumberPosts();

            loadPostsContent(document.getElementById('dashboard-content'));
            closeSpecialPostModal();
            alert('Special post saved successfully!');
        });
    }

    // Create candidate modal if it doesn't exist
    if (!document.getElementById('candidate-modal')) {
        const candidateModal = document.createElement('div');
        candidateModal.id = 'candidate-modal';
        candidateModal.className = 'modal';
        candidateModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="candidate-modal-title" style="color: var(--accent); font-weight: bold;">Add New Candidate</h2>
                    <span class="close-btn" id="close-candidate-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="candidate-form">
                        <input type="hidden" id="candidate-id-input">
                        <div class="form-grid">
                              <div class="form-group">
                                  <label for="candidate-name-input">Full Name</label>
                                  <input type="text" id="candidate-name-input" placeholder="e.g., John Doe" required>
                              </div>
                              <div class="form-group">
                                  <label for="candidate-class-input">Class</label>
                                  <select id="candidate-class-input" required>
                                      <option value="">Select Class</option>
                                      <option value="S.1">S.1</option>
                                      <option value="S.2">S.2</option>
                                      <option value="S.3">S.3</option>
                                      <option value="S.6">S.6</option>
                                  </select>
                              </div>
                              <div class="form-group">
                                  <label for="candidate-stream">Stream</label>
                                  <select id="candidate-stream" required>
                                      <option value="">Select Stream</option>
                                      <option value="West">West</option>
                                      <option value="East">East</option>
                                      <option value="North">North</option>
                                      <option value="South">South</option>
                                      <option value="Central">Central</option>
                                      <option value="Sciences">Sciences</option>
                                      <option value="Arts">Arts</option>
                                  </select>
                              </div>
                              <div class="form-group">
                                  <label for="candidate-gender">Gender</label>
                                  <select id="candidate-gender" required>
                                      <option value="">Select Gender</option>
                                      <option value="Male">Male</option>
                                      <option value="Female">Female</option>
                                      <option value="Other">Other</option>
                                  </select>
                              </div>
                              <div class="form-group">
                                  <label for="candidate-post-select">Post</label>
                                  <select id="candidate-post-select" required>
                                      ${evAPI.getPosts().filter(p => p.active).map(post =>
                                          `<option value="${post.id}">${post.title}</option>`
                                      ).join('')}
                                  </select>
                              </div>
                              <div class="form-group" id="house-field" style="display: none;">
                                  <label for="candidate-house">House</label>
                                  <select id="candidate-house">
                                      <option value="">Select House</option>
                                      <option value="Kakungulu">Kakungulu</option>
                                      <option value="Africa">Africa</option>
                                      <option value="Agakhan">Agakhan</option>
                                      <option value="Luwangula">Luwangula</option>
                                  </select>
                              </div>
                          </div>
                        <div class="form-group">
                            <label for="candidate-slogan">Slogan</label>
                            <textarea id="candidate-slogan" rows="2" placeholder="Candidate slogan or motto"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="candidate-photo-input">Photo</label>
                            <input type="file" id="candidate-photo-input" accept="image/*">
                        </div>
                        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                            <button type="button" class="btn" id="cancel-candidate-btn">Cancel</button>
                            <button type="submit" class="btn btn-primary" id="save-candidate-btn">Save Candidate</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(candidateModal);

        // Add ESC key support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && candidateModal.classList.contains('show')) {
                closeCandidateModal();
            }
        });

        // Add backdrop click to close
        candidateModal.addEventListener('click', (e) => {
            if (e.target === candidateModal) {
                closeCandidateModal();
            }
        });

        // Add modal button event listeners
        document.getElementById('close-candidate-modal').addEventListener('click', closeCandidateModal);
        document.getElementById('cancel-candidate-btn').addEventListener('click', closeCandidateModal);

        // Handle form submission
        document.getElementById('candidate-form').addEventListener('submit', function(e) {
            e.preventDefault();

            const id = document.getElementById('candidate-id-input').value;
            const name = document.getElementById('candidate-name-input').value.trim();
            const className = document.getElementById('candidate-class-input').value.trim();
            const stream = document.getElementById('candidate-stream').value.trim();
            const postId = document.getElementById('candidate-post-select').value;
            const slogan = document.getElementById('candidate-slogan').value.trim();
            const photoFile = document.getElementById('candidate-photo-input').files[0];

            if (!name || !className || !stream || !postId) {
                alert('Please fill in all required fields');
                return;
            }

            console.log('Candidate Data:', { id, name, className, stream, postId, slogan });

            const processCandidate = (photoUrl) => {
                const candidateData = {
                    id: id || 'c' + Date.now(),
                    name,
                    class: className,
                    stream,
                    slogan,
                    photoUrl,
                    postId,
                    votes: id ? evAPI.getCandidate(id).votes : 0
                };
                evAPI.saveCandidate(candidateData);
                renderCandidatesGrid();
                closeCandidateModal();
                alert('Candidate saved successfully!');
            };

            if (photoFile) {
                const reader = new FileReader();
                reader.onload = (e) => processCandidate(e.target.result);
                reader.readAsDataURL(photoFile);
            } else {
                const existingCandidate = id ? evAPI.getCandidate(id) : null;
                processCandidate(existingCandidate ? existingCandidate.photoUrl : '');
            }
        });
    }
}

function openPostModal(post = null) {
    const modal = document.getElementById('post-modal');
    const title = document.getElementById('post-modal-title');
    const idInput = document.getElementById('post-id-input');
    const titleInput = document.getElementById('post-title-input');
    const descriptionInput = document.getElementById('post-description');
    const orderInput = document.getElementById('post-order');
    const statusInput = document.getElementById('post-status');

    if (post) {
        title.textContent = 'Edit Election Post';
        idInput.value = post.id;
        titleInput.value = post.title;
        descriptionInput.value = post.description;
        orderInput.value = post.order;
        statusInput.value = post.active ? 'active' : 'inactive';
    } else {
        title.textContent = 'Add New Election Post';
        idInput.value = '';
        titleInput.value = '';
        descriptionInput.value = '';
        // Auto-calculate the next sequential order number
        orderInput.value = getNextPostOrder();
        statusInput.value = 'active';
    }

    modal.classList.add('show');
    document.body.classList.add('modal-open');
}

function closePostModal() {
    const modal = document.getElementById('post-modal');
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
}

function openCandidateModal(candidate = null) {
    const modal = document.getElementById('candidate-modal');
    const title = document.getElementById('candidate-modal-title');
    const idInput = document.getElementById('candidate-id-input');
    const nameInput = document.getElementById('candidate-name-input');
    const classInput = document.getElementById('candidate-class-input');
    const streamInput = document.getElementById('candidate-stream');
    const genderInput = document.getElementById('candidate-gender');
    const postSelect = document.getElementById('candidate-post-select');
    const houseInput = document.getElementById('candidate-house');
    const houseField = document.getElementById('house-field');
    const sloganInput = document.getElementById('candidate-slogan');
    const photoInput = document.getElementById('candidate-photo-input');

    if (candidate) {
        title.textContent = 'Edit Candidate';
        idInput.value = candidate.id;
        nameInput.value = candidate.name;
        classInput.value = candidate.class;
        streamInput.value = candidate.stream;
        genderInput.value = candidate.gender || '';
        postSelect.value = candidate.postId;
        houseInput.value = candidate.house || '';
        sloganInput.value = candidate.slogan;
    } else {
        title.textContent = 'Add New Candidate';
        idInput.value = '';
        nameInput.value = '';
        classInput.value = '';
        streamInput.value = '';
        genderInput.value = '';
        postSelect.value = evAPI.getPosts().length > 0 ? evAPI.getPosts()[0].id : '';
        houseInput.value = '';
        sloganInput.value = '';
        photoInput.value = '';
    }

    // Show/hide house field based on selected post
    const selectedPostId = postSelect.value;
    const post = evAPI.getPosts().find(p => p.id === selectedPostId);
    if (post && post.title.toLowerCase().includes('house-prefect')) {
        houseField.style.display = 'block';
        houseInput.required = true;
    } else {
        houseField.style.display = 'none';
        houseInput.required = false;
        houseInput.value = '';
    }

    modal.classList.add('show');
    document.body.classList.add('modal-open');
}

function closeCandidateModal() {
    const modal = document.getElementById('candidate-modal');
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
}

function openSpecialPostModal(post = null) {
    const modal = document.getElementById('special-post-modal');
    const title = document.getElementById('special-post-modal-title');
    const idInput = document.getElementById('special-post-id-input');
    const titleInput = document.getElementById('special-post-title-input');
    const descriptionInput = document.getElementById('special-post-description');
    const orderInput = document.getElementById('special-post-order');
    const houseInput = document.getElementById('special-post-house');
    const genderInput = document.getElementById('special-post-gender');
    const levelInput = document.getElementById('special-post-level');
    const statusInput = document.getElementById('special-post-status');

    if (post) {
        title.textContent = 'Edit Special Post - House Prefect';
        idInput.value = post.id;
        titleInput.value = post.title;
        descriptionInput.value = post.description;
        orderInput.value = post.order;
        houseInput.value = post.house || '';
        genderInput.value = post.gender || '';
        levelInput.value = post.level || '';
        statusInput.value = post.active ? 'active' : 'inactive';
    } else {
        title.textContent = 'Add Special Post - House Prefect';
        idInput.value = '';
        titleInput.value = '';
        descriptionInput.value = '';
        // Auto-calculate the next sequential order number
        orderInput.value = getNextPostOrder();
        houseInput.value = '';
        genderInput.value = '';
        levelInput.value = '';
        statusInput.value = 'active';
    }

    modal.classList.add('show');
    document.body.classList.add('modal-open');
}

function closeSpecialPostModal() {
    const modal = document.getElementById('special-post-modal');
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
}

function initAdminModule() {
    const adminUser = JSON.parse(sessionStorage.getItem('ev_admin_user'));
    if (!adminUser) {
        window.location.href = 'index.html';
        return;
    }

    // Theme toggle
    const themeToggle = document.getElementById('admin-theme-toggle');
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

    const userRole = adminUser.role;
    const roles = {
        'Super Administrator': ['dashboard', 'posts', 'candidates', 'guidelines', 'voters', 'results', 'settings', 'reset'],
        'Vote Manager': ['dashboard', 'posts', 'candidates', 'guidelines', 'voters'],
        'Results Viewer': ['dashboard', 'results']
    };

    menuItems.forEach(item => {
        const target = item.getAttribute('data-target');
        if (roles[userRole] && roles[userRole].includes(target)) {
            item.style.display = 'flex';
            item.addEventListener('click', function() {
                const target = this.getAttribute('data-target');

                // Update active menu item
                menuItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');

                // Load content for the section
                loadAdminSection(target);
                if (window.innerWidth <= 768) {
                    document.querySelector('.sidebar').classList.remove('active');
                }
            });
        } else {
            item.style.display = 'none';
        }
    });

    // Create modals once when the page loads
    createAdminModals();

    // Load the dashboard by default
    loadAdminDashboard();

    window.addEventListener('databaseUpdated', () => {
        const activeMenu = document.querySelector('.menu-item.active');
        if (activeMenu) {
            const target = activeMenu.getAttribute('data-target');
            loadAdminSection(target);
        }
    });

    document.getElementById('hamburger-menu').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('active');
    });
}

// Backend-integrated admin module
async function initAdminModuleBackend() {
    // State management
    const state = {
        currentSection: 'dashboard',
        socket: null
    };

    // Check authentication
    try {
        const user = await apiClient.getCurrentUser();
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
    } catch (error) {
        console.error('Authentication failed:', error);
        window.location.href = 'index.html';
        return;
    }

    // Theme toggle
    const themeToggle = document.getElementById('admin-theme-toggle');
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

    // For backend mode, assume full access (can be modified based on user roles from backend)
    const allowedSections = ['dashboard', 'posts', 'candidates', 'guidelines', 'voters', 'results', 'settings', 'reset'];

    menuItems.forEach(item => {
        const target = item.getAttribute('data-target');
        if (allowedSections.includes(target)) {
            item.style.display = 'flex';
            item.addEventListener('click', function() {
                const target = this.getAttribute('data-target');

                // Update active menu item
                menuItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');

                // Load content for the section
                state.currentSection = target;
                loadAdminSectionBackend(target);
                if (window.innerWidth <= 768) {
                    document.querySelector('.sidebar').classList.remove('active');
                }
            });
        } else {
            item.style.display = 'none';
        }
    });

    // Create modals once when the page loads
    createAdminModals();

    // Initialize Socket.io for real-time updates
    initSocket();

    // Load the dashboard by default
    await loadAdminDashboardBackend();

    document.getElementById('hamburger-menu').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('active');
    });

    // Socket event listeners for real-time updates
    function initSocket() {
        apiClient.connectSocket();

        // Listen for real-time updates
        apiClient.onVoteUpdate((data) => {
            console.log('Vote update received:', data);
            // Refresh current section if needed
            if (state.currentSection === 'dashboard' || state.currentSection === 'results') {
                loadAdminSectionBackend(state.currentSection);
            }
        });

        apiClient.onResultsUpdate((data) => {
            console.log('Results update received:', data);
            if (state.currentSection === 'results') {
                loadAdminSectionBackend(state.currentSection);
            }
        });

        apiClient.onSystemStatusChange((data) => {
            console.log('System status change:', data);
            if (!data.status) {
                showAdminSystemDisabledMessage();
            }
        });

        apiClient.onAdminNotification((data) => {
            console.log('Admin notification:', data);
            // Handle admin notifications (e.g., show toast)
            if (typeof showGlobalToast === 'function') {
                showGlobalToast(data.message, data.type || 'info');
            }
        });
    }
}

function loadAdminDashboard() {
    const contentDiv = document.getElementById('dashboard-content');

    const posts = evAPI.getPosts();
    const candidates = evAPI.getCandidates();
    const voters = evAPI.getVoters();
    const votes = evAPI.getVotes();

    const votedCount = voters.filter(v => v.voted).length;
    const turnoutPercentage = voters.length > 0 ? Math.round((votedCount / voters.length) * 100) : 0;

    contentDiv.innerHTML = `
        <div class="dashboard-grid">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Registered Voters</div>
                    <div class="card-icon voters">
                        <i class="fas fa-user-graduate"></i>
                    </div>
                </div>
                <div class="card-value">${voters.length}</div>
                <div class="card-label">Total eligible voters</div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Votes Cast</div>
                    <div class="card-icon votes">
                        <i class="fas fa-vote-yea"></i>
                    </div>
                </div>
                <div class="card-value">${votedCount}</div>
                <div class="card-label">${turnoutPercentage}% Turnout</div>
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
                    <div class="card-title">Candidates</div>
                    <div class="card-icon candidates">
                        <i class="fas fa-users"></i>
                    </div>
                </div>
                <div class="card-value">${candidates.length}</div>
                <div class="card-label">Total candidates</div>
            </div>
        </div>

        <div class="card" style="margin-bottom: 30px;">
            <div class="card-header">
                <div class="card-title">Cumulative Voting Activity</div>
            </div>
            <div class="chart-container">
                <canvas id="activityChart"></canvas>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">Recent Activity</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Activity</th>
                        <th>User</th>
                    </tr>
                </thead>
                <tbody>
                    ${votes.slice(-5).reverse().map(vote => `
                        <tr>
                            <td>${new Date(vote.timestamp).toLocaleTimeString()}</td>
                            <td>Student ${vote.studentId} cast their vote</td>
                            <td>Voter</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    // Initialize chart
    const ctx = document.getElementById('activityChart').getContext('2d');
    const votesByHour = {};
    votes.forEach(vote => {
        const hour = new Date(vote.timestamp).getHours();
        votesByHour[hour] = (votesByHour[hour] || 0) + 1;
    });

    const chartLabels = [];
    const chartData = [];
    // Display hours from 8 AM to 5 PM
    for (let i = 8; i <= 17; i++) {
        chartLabels.push(`${i}:00`);
        let cumulativeVotes = chartData.length > 0 ? chartData[chartData.length - 1] : 0;
        cumulativeVotes += (votesByHour[i] || 0);
        chartData.push(cumulativeVotes);
    }

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Cumulative Votes Cast',
                data: chartData,
                borderColor: 'var(--primary)',
                backgroundColor: 'rgba(0, 82, 155, 0.7)',
                borderRadius: 5,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function loadAdminSection(section) {
    const contentDiv = document.getElementById('dashboard-content');

    switch(section) {
        case 'dashboard':
            loadDashboardContent(contentDiv);
            break;
        case 'posts':
            loadPostsContent(contentDiv);
            break;
        case 'candidates':
            loadCandidatesContent(contentDiv);
            break;
        case 'guidelines':
            loadGuidelinesContent(contentDiv);
            break;
        case 'voters':
            loadVotersContent(contentDiv);
            break;
        case 'results':
            loadResultsContent(contentDiv);
            break;
        case 'settings':
            loadSettingsContent(contentDiv);
            break;
        case 'reset':
            loadResetContent(contentDiv);
            break;
    }
}

// Backend version of loadAdminSection
async function loadAdminSectionBackend(section) {
    const contentDiv = document.getElementById('dashboard-content');

    switch(section) {
        case 'dashboard':
            await loadDashboardContentBackend(contentDiv);
            break;
        case 'posts':
            await loadPostsContentBackend(contentDiv);
            break;
        case 'candidates':
            await loadCandidatesContentBackend(contentDiv);
            break;
        case 'guidelines':
            await loadGuidelinesContentBackend(contentDiv);
            break;
        case 'voters':
            await loadVotersContentBackend(contentDiv);
            break;
        case 'results':
            await loadResultsContentBackend(contentDiv);
            break;
        case 'settings':
            loadSettingsContentBackend(contentDiv);
            break;
        case 'reset':
            loadResetContentBackend(contentDiv);
            break;
    }
}

// Backend version of loadDashboardContent
async function loadDashboardContentBackend(container) {
    try {
        const [postsResponse, candidatesResponse, votersResponse, votesResponse] = await Promise.all([
            apiClient.getPosts(),
            apiClient.getCandidates(),
            apiClient.getAdminVoters(),
            apiClient.getVotes()
        ]);

        const posts = postsResponse || [];
        const candidates = candidatesResponse || [];
        const voters = votersResponse || [];
        const votes = votesResponse || [];

        const votedCount = voters.filter(v => v.voted).length;
        const turnoutPercentage = voters.length > 0 ? Math.round((votedCount / voters.length) * 100) : 0;

        container.innerHTML = `
            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Registered Voters</div>
                        <div class="card-icon voters">
                            <i class="fas fa-user-graduate"></i>
                        </div>
                    </div>
                    <div class="card-value">${voters.length}</div>
                    <div class="card-label">Total eligible voters</div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Votes Cast</div>
                        <div class="card-icon votes">
                            <i class="fas fa-vote-yea"></i>
                        </div>
                    </div>
                    <div class="card-value">${votedCount}</div>
                    <div class="card-label">${turnoutPercentage}% Turnout</div>
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
                        <div class="card-title">Candidates</div>
                        <div class="card-icon candidates">
                            <i class="fas fa-users"></i>
                        </div>
                    </div>
                    <div class="card-value">${candidates.length}</div>
                    <div class="card-label">Total candidates</div>
                </div>
            </div>

            <div class="card" style="margin-bottom: 30px;">
                <div class="card-header">
                    <div class="card-title">Cumulative Voting Activity</div>
                </div>
                <div class="chart-container">
                    <canvas id="activityChart"></canvas>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Recent Activity</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Activity</th>
                            <th>User</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${votes.slice(-5).reverse().map(vote => `
                            <tr>
                                <td>${new Date(vote.timestamp).toLocaleTimeString()}</td>
                                <td>Student ${vote.studentId} cast their vote</td>
                                <td>Voter</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // Initialize chart
        const ctx = document.getElementById('activityChart').getContext('2d');
        const votesByHour = {};
        votes.forEach(vote => {
            const hour = new Date(vote.timestamp).getHours();
            votesByHour[hour] = (votesByHour[hour] || 0) + 1;
        });

        const chartLabels = [];
        const chartData = [];
        // Display hours from 8 AM to 5 PM
        for (let i = 8; i <= 17; i++) {
            chartLabels.push(`${i}:00`);
            let cumulativeVotes = chartData.length > 0 ? chartData[chartData.length - 1] : 0;
            cumulativeVotes += (votesByHour[i] || 0);
            chartData.push(cumulativeVotes);
        }

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Cumulative Votes Cast',
                    data: chartData,
                    borderColor: 'var(--primary)',
                    backgroundColor: 'rgba(0, 82, 155, 0.7)',
                    borderRadius: 5,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Dashboard</div>
                </div>
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Unable to load dashboard data. Please check your connection and try again.</p>
                    <button onclick="loadAdminSectionBackend('dashboard')" class="btn btn-primary">Retry</button>
                </div>
            </div>
        `;
    }
}

// Backend version of loadPostsContent
async function loadPostsContentBackend(container) {
    try {
        const posts = await apiClient.getPosts() || [];
        const candidates = await apiClient.getCandidates() || [];

        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Manage Election Posts</div>
                    <div>
                        <button class="btn btn-primary" id="add-post-btn">
                            <i class="fas fa-plus"></i> Add New Post
                        </button>
                        <button class="btn btn-success" id="add-special-post-btn">
                            <i class="fas fa-star"></i> Add Special Post
                        </button>
                        <button class="btn btn-danger" id="reset-posts-btn">
                            <i class="fas fa-undo"></i> Reset All Posts
                        </button>
                    </div>
                </div>

                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Post Title</th>
                                <th>Description</th>
                                <th>Candidates</th>
                                <th>Voting Order</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${posts.map(post => {
                                const candidateCount = candidates.filter(c => c.postId === post.id).length;
                                return `
                                    <tr>
                                        <td>${post.title}</td>
                                        <td>${post.description}</td>
                                        <td>${candidateCount}</td>
                                        <td>${post.order}</td>
                                        <td><span class="status ${post.active ? 'active' : 'inactive'}">${post.active ? 'Active' : 'Inactive'}</span></td>
                                        <td>
                                            <button style="margin-bottom: 5px;" class="btn-icon edit-post" data-id="${post.id}">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn-icon delete-post" data-id="${post.id}">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading posts:', error);
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Manage Election Posts</div>
                </div>
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Unable to load posts data. Please check your connection and try again.</p>
                    <button onclick="loadPostsContentBackend(document.getElementById('dashboard-content'))" class="btn btn-primary">Retry</button>
                </div>
            </div>
        `;
    }
}

    // Create modal if it doesn't exist
    if (!document.getElementById('post-modal')) {
        const modal = document.createElement('div');
        modal.id = 'post-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="post-modal-title" style="color: var(--accent); font-weight: bold;">Add New Election Post</h2>
                    <span class="close-btn" id="close-post-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="post-form">
                        <input type="hidden" id="post-id-input">
                        <div class="form-grid">
                             <div class="form-group">
                                 <label for="post-title-input">Post Title</label>
                                 <input type="text" id="post-title-input" placeholder="e.g., School President" required>
                             </div>
                             <div class="form-group">
                                 <label for="post-order">Voting Order</label>
                                 <input type="number" id="post-order" min="1" readonly required title="This field is auto-calculated and cannot be edited manually">
                             </div>
                             <div class="form-group">
                                 <label for="post-status">Status</label>
                                 <select id="post-status" required>
                                     <option value="active">Active</option>
                                     <option value="inactive">Inactive</option>
                                 </select>
                             </div>
                         </div>
                        <div class="form-group">
                            <label for="post-description">Description</label>
                            <textarea id="post-description" rows="3" placeholder="Describe the responsibilities of this position" required></textarea>
                        </div>
                        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                            <button type="button" class="btn" id="cancel-post-btn">Cancel</button>
                            <button type="submit" class="btn btn-primary" id="save-post-btn">Save Post</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Add ESC key support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                closePostModal();
            }
        });

        // Add backdrop click to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closePostModal();
            }
        });

        // Add modal button event listeners (only once when modal is created)
        document.getElementById('close-post-modal').addEventListener('click', closePostModal);
        document.getElementById('cancel-post-btn').addEventListener('click', closePostModal);

        // Handle form submission
        document.getElementById('post-form').addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent default form submission

            const id = document.getElementById('post-id-input').value;
            const title = document.getElementById('post-title-input').value.trim();
            const description = document.getElementById('post-description').value.trim();
            const order = parseInt(document.getElementById('post-order').value);
            const status = document.getElementById('post-status').value;

            // Basic form validation
            if (!title || !description) {
                alert('Please fill in all required fields');
                return;
            }

            // Log data to console as requested
            console.log('Post Data:', { id, title, description, order, status });

            // Save to database
            const postData = {
                id: id || title.toLowerCase().replace(/\s+/g, '-'),
                title: title,
                description: description,
                order: order,
                active: status === 'active'
            };

            evAPI.savePost(postData);

            // Renumber all posts to ensure continuous sequential ordering
            renumberPosts();

            loadPostsContent(container);
            closePostModal();
            alert('Post saved successfully!');
        });
    }

    // Add event listeners for elements that are recreated on each load
    document.addEventListener('click', async function(e) {
        if (e.target && e.target.id === 'add-post-btn') {
            openPostModal();
        }
        if (e.target && e.target.id === 'add-special-post-btn') {
            openSpecialPostModal();
        }
        if (e.target && e.target.id === 'reset-posts-btn') {
            // Check if backend mode
            const urlParams = new URLSearchParams(window.location.search);
            const useBackend = urlParams.get('backend') === 'true';

            if (confirm('Are you sure you want to delete all posts? This will also delete all associated candidates and votes.')) {
                if (prompt('To confirm, type "DELETE POSTS" in the box below.') === 'DELETE POSTS') {
                    if (useBackend) {
                        try {
                            await apiClient.resetSystem();
                            await loadPostsContentBackend(container);
                            alert('All posts have been deleted.');
                        } catch (error) {
                            console.error('Error resetting system:', error);
                            alert('Failed to reset system. Please try again.');
                        }
                    } else {
                        const db = evAPI.getDatabase();
                        db.posts = [];
                        db.candidates = [];
                        db.votes = [];
                        evAPI.saveDatabase(db);
                        loadPostsContent(container);
                        alert('All posts have been deleted.');
                    }
                } else {
                    alert('Action cancelled.');
                }
            }
        }
        if (e.target && e.target.classList.contains('edit-post')) {
            const postId = e.target.dataset.id;

            // Check if backend mode
            const urlParams = new URLSearchParams(window.location.search);
            const useBackend = urlParams.get('backend') === 'true';

            let post = null;
            if (useBackend) {
                try {
                    post = await apiClient.getPost(postId);
                } catch (error) {
                    console.error('Error fetching post:', error);
                }
            } else {
                post = evAPI.getPost(postId);
            }

            if (post) {
                openPostModal(post);
            }
        }
        if (e.target && e.target.classList.contains('delete-post')) {
            const postId = e.target.dataset.id;

            // Check if backend mode
            const urlParams = new URLSearchParams(window.location.search);
            const useBackend = urlParams.get('backend') === 'true';

            let postTitle = '';
            if (useBackend) {
                // For backend mode, we need to get the post title differently
                // Since we don't have a direct getPost method, we'll use the posts list
                try {
                    const posts = await apiClient.getPosts();
                    const post = posts.find(p => p.id === postId);
                    postTitle = post ? post.title : 'Unknown Post';
                } catch (error) {
                    console.error('Error fetching post:', error);
                    postTitle = 'Unknown Post';
                }
            } else {
                postTitle = evAPI.getPost(postId).title;
            }

            if (confirm(`Are you sure you want to delete the post "${postTitle}"?`)) {
                if (useBackend) {
                    try {
                        await apiClient.deletePost(postId);
                        await loadPostsContentBackend(container);
                    } catch (error) {
                        console.error('Error deleting post:', error);
                        alert('Failed to delete post. Please try again.');
                    }
                } else {
                    evAPI.deletePost(postId);
                    // Renumber all remaining posts to ensure continuous sequential ordering
                    renumberPosts();
                    loadPostsContent(container);
                }
            }
        }
    });


function loadCandidatesContent(container) {
    const posts = evAPI.getPosts();

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-title">Manage Candidates</div>
                <div>
                    <button class="btn btn-primary" id="add-candidate-btn">
                        <i class="fas fa-plus"></i> Add Candidate
                    </button>
                    <button class="btn btn-danger" id="reset-candidates-btn">
                        <i class="fas fa-undo"></i> Reset All Candidates
                    </button>
                </div>
            </div>

            <div class="form-group" style="max-width:400px;">
                <input type="text" id="candidate-search-input" placeholder="Search candidates by name, class or post...">
            </div>

            <div id="candidates-by-post"></div>
        </div>
    `;

    // Create modal if it doesn't exist
    if (!document.getElementById('candidate-modal')) {
        const modal = document.createElement('div');
        modal.id = 'candidate-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="candidate-modal-title" style="color: var(--accent); font-weight: bold;">Add New Candidate</h2>
                    <span class="close-btn" id="close-candidate-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="candidate-form">
                        <input type="hidden" id="candidate-id-input">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="candidate-name-input">Full Name</label>
                                <input type="text" id="candidate-name-input" placeholder="e.g., John Doe" required>
                            </div>
                            <div class="form-group">
                                <label for="candidate-class-input">Class</label>
                                <input type="text" id="candidate-class-input" placeholder="e.g., S6A" required>
                            </div>
                            <div class="form-group">
                                <label for="candidate-stream">Stream</label>
                                <input type="text" id="candidate-stream" placeholder="e.g., Science" required>
                            </div>
                            <div class="form-group">
                                <label for="candidate-post-select">Post</label>
                                <select id="candidate-post-select" required>
                                    ${posts.filter(p => p.active).map(post =>
                                        `<option value="${post.id}">${post.title}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="candidate-slogan">Slogan</label>
                            <textarea id="candidate-slogan" rows="2" placeholder="Candidate slogan or motto"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="candidate-photo-input">Photo</label>
                            <input type="file" id="candidate-photo-input" accept="image/*">
                        </div>
                        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                            <button type="button" class="btn" id="cancel-candidate-btn">Cancel</button>
                            <button type="submit" class="btn btn-primary" id="save-candidate-btn">Save Candidate</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Add ESC key support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                closeCandidateModal();
            }
        });

        // Add backdrop click to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCandidateModal();
            }
        });

        // Add modal button event listeners (only once when modal is created)
        document.getElementById('close-candidate-modal').addEventListener('click', closeCandidateModal);
        document.getElementById('cancel-candidate-btn').addEventListener('click', closeCandidateModal);
    
        // Add event listener for post selection to show/hide house field
        document.getElementById('candidate-post-select').addEventListener('change', function() {
            const selectedPostId = this.value;
            const post = evAPI.getPosts().find(p => p.id === selectedPostId);
            const houseField = document.getElementById('house-field');
            const houseSelect = document.getElementById('candidate-house');
            if (post && post.title.toLowerCase().includes('house-prefect')) {
                houseField.style.display = 'block';
                houseSelect.required = true;
            } else {
                houseField.style.display = 'none';
                houseSelect.required = false;
                houseSelect.value = '';
            }
        });

        // Handle form submission
        document.getElementById('candidate-form').addEventListener('submit', function(e) {
            e.preventDefault(); // Prevent default form submission

            const id = document.getElementById('candidate-id-input').value;
            const name = document.getElementById('candidate-name-input').value.trim();
            const className = document.getElementById('candidate-class-input').value;
            const stream = document.getElementById('candidate-stream').value;
            const gender = document.getElementById('candidate-gender').value;
            const postId = document.getElementById('candidate-post-select').value;
            const house = document.getElementById('candidate-house').value;
            const slogan = document.getElementById('candidate-slogan').value.trim();
            const photoFile = document.getElementById('candidate-photo-input').files[0];

            // Basic form validation
            if (!name || !className || !stream || !gender || !postId) {
                alert('Please fill in all required fields');
                return;
            }

            // Check if house is required for house-prefect
            const post = evAPI.getPosts().find(p => p.id === postId);
            if (post && post.title.toLowerCase().includes('house-prefect') && !house) {
                alert('House is required for house-prefect candidates');
                return;
            }

            // Validate class selection
            if (className === "") {
                alert('Please select a valid class');
                return;
            }

            // Validate stream selection
            if (stream === "") {
                alert('Please select a valid stream');
                return;
            }

            // Validate gender selection
            if (gender === "") {
                alert('Please select a gender');
                return;
            }

            // Validate post selection
            if (postId === "") {
                alert('Please select a post');
                return;
            }


            // Log data to console as requested
            console.log('Candidate Data:', { id, name, className, stream, gender, postId, house, slogan });

            const processCandidate = (photoUrl) => {
                const candidateData = {
                    id: id || 'c' + Date.now(),
                    name,
                    class: className,
                    stream,
                    gender,
                    house: house || null,
                    slogan,
                    photoUrl,
                    postId,
                    votes: id ? evAPI.getCandidate(id).votes : 0
                };
                evAPI.saveCandidate(candidateData);
                renderCandidatesByPost();
                closeCandidateModal();
                alert('Candidate saved successfully!');
            };

            if (photoFile) {
                const reader = new FileReader();
                reader.onload = (e) => processCandidate(e.target.result);
                reader.readAsDataURL(photoFile);
            } else {
                const existingCandidate = id ? evAPI.getCandidate(id) : null;
                processCandidate(existingCandidate ? existingCandidate.photoUrl : '');
            }
        });
    }

    document.getElementById('candidate-search-input').addEventListener('keyup', renderCandidatesByPost);

    renderCandidatesByPost();

    // Add event listeners for elements that are recreated on each load
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'add-candidate-btn') {
        openCandidateModal();
    }
    if (e.target && e.target.id === 'reset-candidates-btn') {
        if (confirm('Are you sure you want to delete all candidates? This will also delete all associated votes.')) {
            if (prompt('To confirm, type "DELETE CANDIDATES" in the box below.') === 'DELETE CANDIDATES') {
                const db = evAPI.getDatabase();
                db.candidates = [];
                db.votes = [];
                evAPI.saveDatabase(db);
                renderCandidatesByPost();
                alert('All candidates have been deleted.');
            } else {
                alert('Action cancelled.');
            }
        }
    }
    if (e.target && e.target.classList.contains('edit-candidate')) {
        const candidateId = e.target.dataset.id;
        const candidate = evAPI.getCandidate(candidateId);
        if (candidate) {
            openCandidateModal(candidate);
        }
    }
    if (e.target && e.target.classList.contains('delete-candidate')) {
        const candidateId = e.target.dataset.id;
        const candidate = evAPI.getCandidate(candidateId);
        if (candidate && confirm(`Are you sure you want to delete the candidate "${candidate.name}"?`)) {
            evAPI.deleteCandidate(candidateId);
            renderCandidatesByPost();
        }
    }
});

// Ensure modal is properly initialized
if (document.getElementById('candidate-modal')) {
    // Force update of post options in case they were added dynamically
    const postSelect = document.getElementById('candidate-post-select');
    if (postSelect) {
        const posts = evAPI.getPosts().filter(p => p.active);
        const currentValue = postSelect.value;
        postSelect.innerHTML = posts.map(post =>
            `<option value="${post.id}">${post.title}</option>`
        ).join('');
        postSelect.value = currentValue;
    }

    // Ensure house field visibility is set correctly on modal load
    const houseField = document.getElementById('house-field');
    const houseSelect = document.getElementById('candidate-house');
    if (houseField && houseSelect) {
        const selectedPostId = postSelect.value;
        const post = evAPI.getPosts().find(p => p.id === selectedPostId);
        if (post && post.title.toLowerCase().includes('house-prefect')) {
            houseField.style.display = 'block';
            houseSelect.required = true;
        } else {
            houseField.style.display = 'none';
            houseSelect.required = false;
            houseSelect.value = '';
        }
    }
}
}

// Function to get the next voting order for posts
function getNextPostOrder() {
    const posts = evAPI.getPosts();
    if (posts.length === 0) {
        return 1;
    }

    // Find the highest order and increment by 1
    const maxOrder = Math.max(...posts.map(p => p.order || 0));
    return maxOrder + 1;
}

// Function to renumber all posts sequentially to ensure continuous ordering without gaps
function renumberPosts() {
    const db = evAPI.getDatabase();
    const posts = db.posts.sort((a, b) => (a.order || 0) - (b.order || 0)); // Sort by current order

    // Reassign sequential orders starting from 1
    posts.forEach((post, index) => {
        post.order = index + 1;
    });

    // Save the updated database
    evAPI.saveDatabase(db);
}

function renderCandidatesByPost() {
    const container = document.getElementById('candidates-by-post');
    const posts = evAPI.getPosts().filter(p => p.active);
    const searchTerm = document.getElementById('candidate-search-input')?.value.toLowerCase() || '';

    container.innerHTML = posts.map(post => {
        let candidates = evAPI.getCandidates().filter(c => c.postId === post.id);

        if (searchTerm) {
            candidates = candidates.filter(candidate =>
                candidate.name.toLowerCase().includes(searchTerm) ||
                candidate.class.toLowerCase().includes(searchTerm) ||
                post.title.toLowerCase().includes(searchTerm)
            );
        }

        return `
            <div class="post-section">
                <div class="post-header">
                    <h3>${post.title}</h3>
                    <span class="candidate-count">${candidates.length} candidate${candidates.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="candidates-grid">
                    ${candidates.map(candidate => `
                        <div class="candidate-card">
                            <div class="candidate-photo" style="background-image: url('${candidate.photoUrl || ''}')">
                                ${!candidate.photoUrl ? '<i class="fas fa-user"></i>' : ''}
                            </div>
                            <div class="candidate-info">
                                <div class="candidate-name">${candidate.name}</div>
                                <div class="candidate-class">${candidate.class} - ${candidate.stream}</div>
                                ${candidate.house ? `<div class="candidate-house">House: ${candidate.house}</div>` : ''}
                                <div class="candidate-slogan">"${candidate.slogan}"</div>
                            </div>
                            <div class="card-actions">
                                <button style="margin-right: 10px;" class="btn-icon edit-candidate" data-id="${candidate.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-icon delete-candidate" data-id="${candidate.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                    ${candidates.length === 0 ? '<div class="no-candidates">No candidates for this post</div>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

function loadGuidelinesContent(container) {
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-title">Voting Guidelines Editor</div>
            </div>
            
            <div class="editor-container">
                <div class="editor-toolbar">
                    <button class="editor-button" data-command="bold"><i class="fas fa-bold" style="color: var(--accent);"></i></button>
                    <button class="editor-button" data-command="italic"><i class="fas fa-italic" style="color: var(--accent);"></i></button>
                    <button class="editor-button" data-command="underline"><i class="fas fa-underline" style="color: var(--accent);"></i></button>
                    <button class="editor-button" data-command="insertUnorderedList"><i class="fas fa-list-ul" style="color: var(--accent);"></i></button>
                    <button class="editor-button" data-command="insertOrderedList"><i class="fas fa-list-ol" style="color: var(--accent);"></i></button>
                </div>
                <div id="guidelines-editor" class="editor-content" contenteditable="true">
                    ${evAPI.getGuidelines()}
                </div>
            </div>
            
            <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
                <button id="save-guidelines-btn" class="btn btn-primary">
                    <i class="fas fa-save"></i> Save Guidelines
                </button>
            </div>
        </div>
    `;

    document.getElementById('save-guidelines-btn').addEventListener('click', () => {
        const content = document.getElementById('guidelines-editor').innerHTML;
        evAPI.saveGuidelines(content);
        alert('Guidelines saved successfully!');
    });

    document.querySelectorAll('.editor-button').forEach(button => {
        button.addEventListener('click', () => {
            const command = button.dataset.command;
            document.execCommand(command, false, null);
        });
    });
}

function loadVotersContent(container) {
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-title">Voter Registry</div>
            </div>
            <div class="form-group" style="max-width:400px;">
                <input type="text" id="voter-search-input" placeholder="Search by ID, Name, Class, or House...">
            </div>
            <div class="table-container">
            </div>
        </div>
    `;

    const searchInput = document.getElementById('voter-search-input');
    if (searchInput) {
        searchInput.addEventListener('keyup', () => {
            renderVotersTable(container);
        });
    }
    renderVotersTable(container);
}

function renderVotersTable(container) {
    let voters = evAPI.getVoters();
    const searchTerm = document.getElementById('voter-search-input')?.value.toLowerCase() || '';

    if (searchTerm) {
        voters = voters.filter(voter =>
            voter.id.toLowerCase().includes(searchTerm) ||
            voter.name.toLowerCase().includes(searchTerm) ||
            voter.className.toLowerCase().includes(searchTerm) ||
            voter.house.toLowerCase().includes(searchTerm)
        );
    }

    const tableContainer = container.querySelector('.table-container');
    tableContainer.innerHTML = `
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
                        <td>${voter.voted ? '<span class="status active">Yes</span>' : '<span class="status inactive">No</span>'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function loadResultsContent(container) {
    const posts = evAPI.getPosts().filter(p => p.active);
    const candidates = evAPI.getCandidates();
    const voters = evAPI.getVoters();
    const totalVotes = evAPI.getVotes().length;
    const votedCount = voters.filter(v => v.voted).length;
    const turnoutPercentage = voters.length > 0 ? Math.round((votedCount / voters.length) * 100) : 0;

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-title">
                    <i class="fas fa-chart-line"></i> Live Election Results
                    <span class="live-indicator">
                        <i class="fas fa-circle"></i> LIVE
                    </span>
                </div>
                <div class="results-controls-row">
                    <button class="btn btn-primary results-btn" id="refresh-results-btn">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                    <button class="btn btn-success results-btn" id="export-results-btn">
                        <i class="fas fa-download"></i> Export
                    </button>
                    <button class="btn btn-warning results-btn" id="fullscreen-results-btn">
                        <i class="fas fa-expand"></i> Fullscreen
                    </button>
                </div>
                <div class="auto-refresh-toggle-row">
                    <label>
                        <input type="checkbox" id="auto-refresh-checkbox" checked> Auto-refresh (15s)
                    </label>
                </div>
            </div>
            <div class="results-summary responsive-results-summary">
                <div class="summary-card votes-card">
                    <div class="summary-icon"><i class="fas fa-vote-yea"></i></div>
                    <div class="summary-content">
                        <div class="summary-value">${totalVotes}</div>
                        <div class="summary-label">Total Votes Cast</div>
                        <div class="summary-trend">
                            <i class="fas fa-arrow-up"></i> +${Math.floor(Math.random() * 5)} in last hour
                        </div>
                    </div>
                </div>
                <div class="summary-card participation-card">
                    <div class="summary-icon"><i class="fas fa-users"></i></div>
                    <div class="summary-content">
                        <div class="summary-value">${votedCount}</div>
                        <div class="summary-label">Voters Participated</div>
                        <div class="summary-trend">
                            <i class="fas fa-percentage"></i> ${turnoutPercentage}% turnout
                        </div>
                    </div>
                </div>
                <div class="summary-card turnout-card">
                    <div class="summary-icon"><i class="fas fa-chart-pie"></i></div>
                    <div class="summary-content">
                        <div class="summary-value">${turnoutPercentage}%</div>
                        <div class="summary-label">Voter Turnout</div>
                        <div class="summary-trend">
                            <i class="fas fa-target"></i> Target: 80%
                        </div>
                    </div>
                </div>
                <div class="summary-card time-card">
                    <div class="summary-icon"><i class="fas fa-clock"></i></div>
                    <div class="summary-content">
                        <div class="summary-value" id="last-updated-time">${new Date().toLocaleTimeString()}</div>
                        <div class="summary-label">Last Updated</div>
                        <div class="summary-trend">
                            <i class="fas fa-sync"></i> Auto-updating
                        </div>
                    </div>
                </div>
            </div>
            <!-- Responsive post tabs: dropdown for mobile -->
            <div class="tabs-container">
                <div class="tabs" id="results-tabs">
                    ${posts.map((post, index) => {
                        const postCandidates = candidates.filter(c => c.postId === post.id);
                        const postVotes = postCandidates.reduce((sum, c) => sum + c.votes, 0);
                        return `<div class="tab ${index === 0 ? 'active' : ''}" data-post-id="${post.id}">
                            ${post.title}
                            <span class="tab-vote-count">${postVotes}</span>
                        </div>`;
                    }).join('')}
                </div>
                <select id="results-tabs-dropdown" style="display:none;width:100%;margin:10px 0;padding:8px;font-size:1rem;"></select>
            </div>
            <div id="results-content">
                <div id="results-chart-container" class="responsive-charts">
                    <div class="chart-section" id="vote-distribution-section-card">
                        <div class="card">
                            <div class="card-header">
                                <div class="card-title">Vote Distribution</div>
                            </div>
                            <div class="chart-container">
                                <canvas id="resultsBarChart"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="chart-section" id="vote-share-section-card">
                        <div class="card">
                            <div class="card-header">
                                <div class="card-title">Vote Share</div>
                            </div>
                            <div class="chart-container">
                                <canvas id="resultsPieChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="candidates-table-container">
                    <h3>Detailed Results</h3>
                    <div class="table-container">
                        <table id="results-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Candidate</th>
                                    <th>Class</th>
                                    <th>Votes</th>
                                    <th>Percentage</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="results-table-body">
                            </tbody>
                        </table>
                    </div>
                </div>
                <div id="leading-candidate" class="leading-candidate-banner"></div>
            </div>
        </div>
        <style>
        .results-controls-row {
            display: flex;
            flex-direction: row;
            gap: 8px;
            align-items: center;
            justify-content: flex-start;
            flex-wrap: wrap;
            margin-bottom: 8px;
        }
        .results-btn {
            flex: 1 1 120px;
            min-width: 110px;
            max-width: 180px;
            font-size: 0.98rem;
            padding: 10px 8px;
        }
        .auto-refresh-toggle-row {
            margin-top: 0;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: flex-start;
        }
        #results-chart-container {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            width: 100%;
        }
        @media (max-width: 900px) {
            #results-chart-container {
                flex-direction: column;
                gap: 15px;
            }
            .results-btn {
                min-width: 90px;
                max-width: 100vw;
                font-size: 0.95rem;
                padding: 8px 4px;
            }
        }
        .chart-section {
            flex: 1 1 400px;
            min-width: 300px;
            max-width: 100%;
        }
        .chart-section .card {
            margin-bottom: 0;
        }
        </style>
    `;
    // Responsive tabs: populate dropdown for mobile
    const tabsDropdown = container.querySelector('#results-tabs-dropdown');
    const tabsDiv = container.querySelector('#results-tabs');
    if (tabsDropdown && tabsDiv) {
        tabsDropdown.innerHTML = '';
        Array.from(tabsDiv.children).forEach((tab, idx) => {
            const postId = tab.getAttribute('data-post-id');
            const title = tab.textContent.trim();
            const option = document.createElement('option');
            option.value = postId;
            option.textContent = title;
            if (tab.classList.contains('active')) option.selected = true;
            tabsDropdown.appendChild(option);
        });
        // Style dropdown to match tabs
        tabsDropdown.style.background = 'var(--card-bg)';
        tabsDropdown.style.color = 'var(--primary)';
        tabsDropdown.style.border = '1px solid var(--primary)';
        tabsDropdown.style.borderRadius = '6px';
        tabsDropdown.style.fontWeight = '600';
        tabsDropdown.style.boxShadow = 'var(--box-shadow)';
        tabsDropdown.style.padding = '10px 18px';
        tabsDropdown.style.marginBottom = '18px';
        tabsDropdown.style.outline = 'none';
        tabsDropdown.style.appearance = 'none';
        tabsDropdown.style.cursor = 'pointer';
        tabsDropdown.addEventListener('change', function() {
            const selectedId = this.value;
            Array.from(tabsDiv.children).forEach(tab => {
                tab.classList.toggle('active', tab.getAttribute('data-post-id') === selectedId);
            });
            // Trigger tab click to update content
            const activeTab = tabsDiv.querySelector('.tab.active');
            if (activeTab) {
                activeTab.click();
            }
        });
        // Sync tab click with dropdown
        tabsDiv.addEventListener('tabchange', () => {
            const activeTab = tabsDiv.querySelector('.tab.active');
            if (activeTab) {
                tabsDropdown.value = activeTab.getAttribute('data-post-id');
            }
        });
    }

    let autoRefreshInterval;
    let currentCharts = { bar: null, pie: null };

    const renderChart = (postId) => {
        const postCandidates = candidates.filter(c => c.postId === postId).sort((a, b) => b.votes - a.votes);
        const totalPostVotes = postCandidates.reduce((sum, c) => sum + c.votes, 0);
        
        // Destroy existing charts
        if (currentCharts.bar) currentCharts.bar.destroy();
        if (currentCharts.pie) currentCharts.pie.destroy();
        
        // Bar Chart
        const barCtx = document.getElementById('resultsBarChart').getContext('2d');
        currentCharts.bar = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: postCandidates.map(c => c.name),
                datasets: [{
                    label: 'Votes',
                    data: postCandidates.map(c => c.votes),
                    backgroundColor: postCandidates.map((c, index) => {
                        if (index === 0 && c.votes > 0) return '#28a745'; // Winner - Green
                        if (index === 1 && c.votes > 0) return '#ffc107'; // Second - Yellow
                        if (index === 2 && c.votes > 0) return '#fd7e14'; // Third - Orange
                        return 'rgba(0, 82, 155, 0.7)'; // Others - Blue
                    }),
                    borderColor: 'rgba(0, 82, 155, 1)',
                    borderWidth: 1,
                    borderRadius: 5
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const percentage = totalPostVotes > 0 ? ((context.raw / totalPostVotes) * 100).toFixed(1) : 0;
                                return `${context.raw} votes (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });

        // Pie Chart
        const pieCtx = document.getElementById('resultsPieChart').getContext('2d');
        currentCharts.pie = new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: postCandidates.map(c => c.name),
                datasets: [{
                    data: postCandidates.map(c => c.votes),
                    backgroundColor: [
                        '#28a745', '#ffc107', '#fd7e14', '#dc3545', 
                        '#6f42c1', '#20c997', '#6c757d', '#e83e8c'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const percentage = totalPostVotes > 0 ? ((context.raw / totalPostVotes) * 100).toFixed(1) : 0;
                                return `${context.label}: ${context.raw} votes (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    
        
        // Update results table
        const tableBody = document.getElementById('results-table-body');
        tableBody.innerHTML = postCandidates.map((candidate, index) => {
            const percentage = totalPostVotes > 0 ? ((candidate.votes / totalPostVotes) * 100).toFixed(1) : 0;
            let status = '';
            if (index === 0 && candidate.votes > 0) status = '<span class="status winner">Leading</span>';
            else if (candidate.votes > 0) status = '<span class="status active">In Race</span>';
            else status = '<span class="status inactive">No Votes</span>';
            
            return `
                <tr class="${index === 0 && candidate.votes > 0 ? 'winner-row' : ''}">
                    <td>${index + 1}</td>
                    <td>
                        <div class="candidate-info">
                            <strong>${candidate.name}</strong>
                            ${candidate.slogan ? `<br><small>"${candidate.slogan}"</small>` : ''}
                        </div>
                    </td>
                    <td>${candidate.class} - ${candidate.stream}</td>
                    <td><strong>${candidate.votes}</strong></td>
                    <td>${percentage}%</td>
                    <td>${status}</td>
                </tr>
            `;
        }).join('');
        
        // Leading Candidate Banner
        const leadingCandidate = postCandidates[0];
        const leadingBanner = document.getElementById('leading-candidate');
        if (leadingCandidate && leadingCandidate.votes > 0) {
            const post = posts.find(p => p.id === postId);
            leadingBanner.innerHTML = `
                <div class="leading-banner">
                    <i class="fas fa-crown"></i>
                    <span>Currently Leading for ${post.title}: <strong>${leadingCandidate.name}</strong> with ${leadingCandidate.votes} votes</span>
                </div>
            `;
        } else {
            leadingBanner.innerHTML = '<div class="no-votes-banner">No votes cast yet for this position</div>';
        }
    };

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            renderChart(e.target.dataset.postId);
        });
    });

    // Refresh functionality
    document.getElementById('refresh-results-btn').addEventListener('click', () => {
        loadResultsContent(container);
    });

    // Export functionality
    const exportBtn = document.getElementById('export-results-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            try {
                exportResults();
                // Show success message
                if (typeof showGlobalToast === 'function') {
                    showGlobalToast('Election results exported successfully!', 'success');
                } else {
                    alert('Election results exported successfully!');
                }
            } catch (error) {
                console.error('Export failed:', error);
                if (typeof showGlobalToast === 'function') {
                    showGlobalToast('Export failed. Please try again.', 'error');
                } else {
                    alert('Export failed. Please try again.');
                }
            }
        });
    }

    // Auto-refresh toggle with enhanced functionality
    document.getElementById('auto-refresh-checkbox').addEventListener('change', (e) => {
        if (e.target.checked) {
            autoRefreshInterval = setInterval(() => {
                const activeTab = document.querySelector('.tab.active');
                if (activeTab) {
                    // Refresh data from database
                    const updatedCandidates = evAPI.getCandidates();
                    const updatedVoters = evAPI.getVoters();
                    const updatedVotes = evAPI.getVotes();
                    
                    // Update summary cards
                    const totalVotes = updatedVotes.length;
                    const votedCount = updatedVoters.filter(v => v.voted).length;
                    const turnoutPercentage = updatedVoters.length > 0 ? Math.round((votedCount / updatedVoters.length) * 100) : 0;
                    
                    document.querySelector('.votes-card .summary-value').textContent = totalVotes;
                    document.querySelector('.participation-card .summary-value').textContent = votedCount;
                    document.querySelector('.turnout-card .summary-value').textContent = turnoutPercentage + '%';
                    document.querySelector('#last-updated-time').textContent = new Date().toLocaleTimeString();
                    
                    // Update tab vote counts
                    document.querySelectorAll('.tab').forEach(tab => {
                        const postId = tab.dataset.postId;
                        const postCandidates = updatedCandidates.filter(c => c.postId === postId);
                        const postVotes = postCandidates.reduce((sum, c) => sum + c.votes, 0);
                        tab.querySelector('.tab-vote-count').textContent = postVotes;
                    });
                    
                    renderChart(activeTab.dataset.postId);
                }
            }, 15000); // 15 seconds
        } else {
            clearInterval(autoRefreshInterval);
        }
    });

    // Fullscreen toggle functionality
    document.getElementById('fullscreen-results-btn').addEventListener('click', () => {
        const resultsCard = container.querySelector('.card');
        if (!document.fullscreenElement) {
            resultsCard.requestFullscreen().catch(err => {
                console.log('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    });

    // Start auto-refresh by default
    document.getElementById('auto-refresh-checkbox').checked = true;
    document.getElementById('auto-refresh-checkbox').dispatchEvent(new Event('change'));

    // Initial render
    if (posts.length > 0) {
        renderChart(posts[0].id);
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    });
}

function exportResults() {
    const posts = evAPI.getPosts().filter(p => p.active);
    const candidates = evAPI.getCandidates();
    const voters = evAPI.getVoters();
    const votes = evAPI.getVotes();
    const exportDate = new Date().toLocaleString();

    // Create unique ASCII art header with school theme
    let csvContent = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                           🎓 KIBULI SECONDARY SCHOOL 🎓                          ║
║                              ELECTION RESULTS EXPORT                             ║
║                                                                              ║
║  Generated: ${exportDate.padEnd(64)} ║
║  Total Registered Voters: ${voters.length.toString().padEnd(47)} ║
║  Total Votes Cast: ${votes.length.toString().padEnd(54)} ║
║  Voter Turnout: ${(voters.length > 0 ? Math.round((votes.length / voters.length) * 100) : 0) + '%'.padEnd(56)} ║
╚══════════════════════════════════════════════════════════════════════════════╝

`;

    posts.forEach((post, postIndex) => {
        const postCandidates = candidates.filter(c => c.postId === post.id).sort((a, b) => b.votes - a.votes);
        const totalPostVotes = postCandidates.reduce((sum, c) => sum + c.votes, 0);

        // Post header with decorative elements
        csvContent += `┌─────────────────────────────────────────────────────────────────────────────┐\n`;
        csvContent += `│ ${String(postIndex + 1).padStart(2)}. ${post.title.toUpperCase().padEnd(68)} │\n`;
        csvContent += `├─────┬─────────────────────────────────────┬─────────┬─────────┬──────┬────────────┤\n`;
        csvContent += `│ Rank│ Candidate Name                      │ Class   │ Stream  │ Votes│ Percentage │\n`;
        csvContent += `├─────┼─────────────────────────────────────┼─────────┼─────────┼──────┼────────────┤\n`;

        postCandidates.forEach((candidate, index) => {
            const percentage = totalPostVotes > 0 ? ((candidate.votes / totalPostVotes) * 100).toFixed(1) : 0;
            const rank = index + 1;
            const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '  ';
            const name = candidate.name.length > 35 ? candidate.name.substring(0, 32) + '...' : candidate.name;

            csvContent += `│ ${rankIcon} ${rank.toString().padStart(2)}│ ${name.padEnd(35)} │ ${candidate.class.padEnd(7)} │ ${candidate.stream.padEnd(7)} │ ${candidate.votes.toString().padStart(4)} │ ${percentage.padStart(9)}% │\n`;
        });

        csvContent += `└─────┴─────────────────────────────────────┴─────────┴─────────┴──────┴────────────┘\n\n`;

        // Add fun facts for each post
        if (postCandidates.length > 0) {
            const winner = postCandidates[0];
            const winnerPercentage = totalPostVotes > 0 ? ((winner.votes / totalPostVotes) * 100).toFixed(1) : 0;
            csvContent += `💡 Fun Fact: ${winner.name} won with ${winner.votes} votes (${winnerPercentage}%)\n\n`;
        }
    });

    // Add footer with school motto
    csvContent += `╔══════════════════════════════════════════════════════════════════════════════╗\n`;
    csvContent += `║                           "EXCELLENCE THROUGH DISCIPLINE"                     ║\n`;
    csvContent += `║                              Kibuli Secondary School                          ║\n`;
    csvContent += `║                              Election System v2.0                             ║\n`;
    csvContent += `╚══════════════════════════════════════════════════════════════════════════════╝\n`;

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kibuli_election_results_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Backend version of loadSettingsContent
function loadSettingsContentBackend(container) {
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-title">System Settings</div>
            </div>
            <div class="settings-content">
                <div class="setting-group">
                    <h3>System Configuration</h3>
                    <div class="setting-item">
                        <label for="system-status-toggle">System Status</label>
                        <div class="toggle-container">
                            <input type="checkbox" id="system-status-toggle" checked>
                            <label for="system-status-toggle" class="toggle-slider"></label>
                            <span class="toggle-text">Voting System Active</span>
                        </div>
                    </div>
                    <div class="setting-item">
                        <label for="maintenance-mode-toggle">Maintenance Mode</label>
                        <div class="toggle-container">
                            <input type="checkbox" id="maintenance-mode-toggle">
                            <label for="maintenance-mode-toggle" class="toggle-slider"></label>
                            <span class="toggle-text">Maintenance Mode Off</span>
                        </div>
                    </div>
                </div>

                <div class="setting-group">
                    <h3>Real-time Updates</h3>
                    <div class="setting-item">
                        <label for="socket-enabled-toggle">Socket.io Connection</label>
                        <div class="toggle-container">
                            <input type="checkbox" id="socket-enabled-toggle" checked>
                            <label for="socket-enabled-toggle" class="toggle-slider"></label>
                            <span class="toggle-text">Real-time Updates Enabled</span>
                        </div>
                    </div>
                </div>

                <div class="setting-group">
                    <h3>Data Management</h3>
                    <button class="btn btn-warning" id="clear-cache-btn">
                        <i class="fas fa-broom"></i> Clear System Cache
                    </button>
                    <button class="btn btn-info" id="export-system-data-btn">
                        <i class="fas fa-download"></i> Export System Data
                    </button>
                </div>

                <div class="setting-group">
                    <h3>System Information</h3>
                    <div class="info-item">
                        <strong>Version:</strong> <span id="system-version">2.0.0</span>
                    </div>
                    <div class="info-item">
                        <strong>Last Updated:</strong> <span id="last-updated">${new Date().toLocaleString()}</span>
                    </div>
                    <div class="info-item">
                        <strong>Database:</strong> <span id="db-status">Connected</span>
                    </div>
                </div>
            </div>
        </div>
        <style>
        .settings-content {
            padding: 20px;
        }
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
        .setting-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid var(--border-color);
        }
        .setting-item:last-child {
            border-bottom: none;
        }
        .toggle-container {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .toggle-slider {
            position: relative;
            display: inline-block;
            width: 50px;
            height: 24px;
            background-color: #ccc;
            border-radius: 24px;
            transition: 0.4s;
            cursor: pointer;
        }
        .toggle-slider:before {
            content: "";
            position: absolute;
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            border-radius: 50%;
            transition: 0.4s;
        }
        input[type="checkbox"]:checked + .toggle-slider {
            background-color: var(--primary);
        }
        input[type="checkbox"]:checked + .toggle-slider:before {
            transform: translateX(26px);
        }
        .toggle-text {
            font-size: 0.9rem;
            color: var(--text-secondary);
        }
        .info-item {
            padding: 8px 0;
            display: flex;
            justify-content: space-between;
        }
        </style>
    `;

    // Add event listeners for settings
    document.getElementById('system-status-toggle').addEventListener('change', async (e) => {
        try {
            await apiClient.updateSystemStatus({ enabled: e.target.checked });
            const toggleText = e.target.parentElement.querySelector('.toggle-text');
            toggleText.textContent = e.target.checked ? 'Voting System Active' : 'Voting System Disabled';
            if (typeof showGlobalToast === 'function') {
                showGlobalToast(`System ${e.target.checked ? 'enabled' : 'disabled'} successfully`, 'success');
            }
        } catch (error) {
            console.error('Error updating system status:', error);
            e.target.checked = !e.target.checked; // Revert on error
            if (typeof showGlobalToast === 'function') {
                showGlobalToast('Failed to update system status', 'error');
            }
        }
    });

    document.getElementById('maintenance-mode-toggle').addEventListener('change', async (e) => {
        try {
            await apiClient.updateSystemSettings({ maintenanceMode: e.target.checked });
            const toggleText = e.target.parentElement.querySelector('.toggle-text');
            toggleText.textContent = e.target.checked ? 'Maintenance Mode On' : 'Maintenance Mode Off';
            if (typeof showGlobalToast === 'function') {
                showGlobalToast(`Maintenance mode ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
            }
        } catch (error) {
            console.error('Error updating maintenance mode:', error);
            e.target.checked = !e.target.checked; // Revert on error
            if (typeof showGlobalToast === 'function') {
                showGlobalToast('Failed to update maintenance mode', 'error');
            }
        }
    });

    document.getElementById('clear-cache-btn').addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear the system cache? This will refresh all cached data.')) {
            try {
                await apiClient.clearCache();
                if (typeof showGlobalToast === 'function') {
                    showGlobalToast('System cache cleared successfully', 'success');
                }
            } catch (error) {
                console.error('Error clearing cache:', error);
                if (typeof showGlobalToast === 'function') {
                    showGlobalToast('Failed to clear cache', 'error');
                }
            }
        }
    });

    document.getElementById('export-system-data-btn').addEventListener('click', async () => {
        try {
            const systemData = await apiClient.exportSystemData();
            const blob = new Blob([JSON.stringify(systemData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `system_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            if (typeof showGlobalToast === 'function') {
                showGlobalToast('System data exported successfully', 'success');
            }
        } catch (error) {
            console.error('Error exporting system data:', error);
            if (typeof showGlobalToast === 'function') {
                showGlobalToast('Failed to export system data', 'error');
            }
        }
    });
}

// Backend version of loadResetContent
async function loadResetContentBackend(container) {
    try {
        const systemStatus = await apiClient.getSystemStatus() || { enabled: true };

        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Admin Data Reset</div>
                </div>
                <p style="margin-bottom: 20px;">These actions will clear specific sets of data. This cannot be undone.</p>

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
                    <h3>System Reset</h3>
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
            const password = prompt('Enter your password to confirm clearing all votes:');
            if (password === 'admin123') {
                if (confirm('Are you sure you want to clear all votes? This action cannot be undone.')) {
                    try {
                        await apiClient.resetVotes();
                        if (typeof showGlobalToast === 'function') {
                            showGlobalToast('All votes have been cleared successfully', 'success');
                        }
                    } catch (error) {
                        console.error('Error resetting votes:', error);
                        if (typeof showGlobalToast === 'function') {
                            showGlobalToast('Failed to reset votes', 'error');
                        }
                    }
                }
            } else {
                alert('Incorrect password.');
            }
        });

        document.getElementById('reset-voters-btn').addEventListener('click', async () => {
            const password = prompt('Enter your password to confirm resetting all voter statuses:');
            if (password === 'admin123') {
                if (confirm('Are you sure you want to reset all voter statuses? This will allow everyone to vote again.')) {
                    try {
                        await apiClient.resetVoterStatuses();
                        if (typeof showGlobalToast === 'function') {
                            showGlobalToast('All voter statuses have been reset successfully', 'success');
                        }
                    } catch (error) {
                        console.error('Error resetting voter statuses:', error);
                        if (typeof showGlobalToast === 'function') {
                            showGlobalToast('Failed to reset voter statuses', 'error');
                        }
                    }
                }
            } else {
                alert('Incorrect password.');
            }
        });

        document.getElementById('reset-system-btn').addEventListener('click', async () => {
            const password = prompt('Enter your password to confirm complete system reset:');
            if (password === 'admin123') {
                if (confirm('⚠️ WARNING: This will delete ALL data. Are you absolutely sure?') &&
                    prompt('To confirm, type "RESET ALL DATA" in the box below.') === 'RESET ALL DATA') {
                    try {
                        await apiClient.resetSystem();
                        if (typeof showGlobalToast === 'function') {
                            showGlobalToast('Complete system reset completed successfully', 'success');
                        }
                        // Reload the page to reflect the reset
                        setTimeout(() => window.location.reload(), 2000);
                    } catch (error) {
                        console.error('Error resetting system:', error);
                        if (typeof showGlobalToast === 'function') {
                            showGlobalToast('Failed to reset system', 'error');
                        }
                    }
                } else {
                    alert('Action cancelled.');
                }
            } else {
                alert('Incorrect password.');
            }
        });
    } catch (error) {
        console.error('Error loading reset content:', error);
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Admin Data Reset</div>
                </div>
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Unable to load reset options. Please check your connection and try again.</p>
                    <button onclick="loadResetContentBackend(document.getElementById('dashboard-content'))" class="btn btn-primary">Retry</button>
                </div>
            </div>
        `;
    }
}

function loadSettingsContent(container) {
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-title">Settings</div>
            </div>
            <p>Settings page is under construction.</p>
        </div>
    `;
}

function loadResetContent(container) {
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-title">Admin Data Reset</div>
            </div>
            <p style="margin-bottom: 20px;">These actions will clear specific sets of data. This cannot be undone.</p>
            
            <div class="form-group">
                <label>Clear All Votes</label>
                <p>This will reset the vote count for all candidates to zero, but will not affect voter "voted" status.</p>
                <button class="btn btn-danger" id="reset-votes-btn" style="margin-top: 20px;">Clear All Votes</button>
            </div>
            <br/>
            <hr style="margin-bottom: 20px;">

            <div class="form-group">
                <label>Reset All Voter Statuses</label>
                <p>This will mark all voters as "not voted", allowing them to vote again. This does not clear cast votes.</p>
                <button class="btn btn-danger" id="reset-voters-btn" style="margin-top: 20px;">Reset Voter Statuses</button>
            </div>
        </div>
    `;

    document.getElementById('reset-votes-btn').addEventListener('click', () => {
        const password = prompt('Enter your password to confirm clearing all votes:');
        if (password === 'admin123') {
            if (confirm('Are you sure you want to clear all votes? This action cannot be undone.')) {
                const db = evAPI.getDatabase();
                db.votes = [];
                db.candidates.forEach(c => c.votes = 0);
                db.audit_log.push({
                    timestamp: new Date().toISOString(),
                    action: 'Admin cleared all votes',
                    user: 'Admin User'
                });
                evAPI.saveDatabase(db);
                alert('All votes have been cleared.');
            }
        } else {
            alert('Incorrect password.');
        }
    });

    document.getElementById('reset-voters-btn').addEventListener('click', () => {
        const password = prompt('Enter your password to confirm resetting all voter statuses:');
        if (password === 'admin123') {
            if (confirm('Are you sure you want to reset all voter statuses? This will allow everyone to vote again.')) {
                const db = evAPI.getDatabase();
                db.voters.forEach(v => v.voted = false);
                db.audit_log.push({
                    timestamp: new Date().toISOString(),
                    action: 'Admin reset all voter statuses',
                    user: 'Admin User'
                });
                evAPI.saveDatabase(db);
                alert('All voter statuses have been reset.');
            }
        } else {
            alert('Incorrect password.');
        }
    });
}

// Render filtered list
function renderList(filtered) {
    const listDiv = document.getElementById('filtered-list');
    if (!listDiv) return;
    listDiv.innerHTML = filtered.length
        ? filtered.map(item => `<div class="list-item">${item.name} <span class="item-type">${item.type}</span></div>`).join('')
        : '<div class="no-results">No results found.</div>';
}

// Filter function
function filterItems() {
    const search = document.getElementById('filter-search').value.toLowerCase();
    const type = document.getElementById('filter-type').value;

    const allItems = [
        ...evAPI.getVoters().map(v => ({ ...v, type: 'voter', name: v.name })),
        ...evAPI.getCandidates().map(c => ({ ...c, type: 'candidate', name: c.name })),
        ...evAPI.getPosts().map(p => ({ ...p, type: 'post', name: p.title }))
    ];

    let filtered = allItems.filter(item => {
        const matchesType = type ? item.type === type : true;
        const matchesSearch = item.name.toLowerCase().includes(search);
        return matchesType && matchesSearch;
    });
renderList(filtered);

// Clear filter
function clearFilter() {
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-type').value = '';
    filterItems();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('admin-module')) {
        // Initial render on dashboard
        if (document.querySelector('.menu-item.active[data-target="dashboard"]')) {
            filterItems();
        }
    }
});
    renderList(filtered);
}

// Clear filter
function clearFilter() {
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-type').value = '';
    filterItems();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('admin-module')) {
        // Initial render on dashboard
        if (document.querySelector('.menu-item.active[data-target="dashboard"]')) {
            filterItems();
        }
    }
});
