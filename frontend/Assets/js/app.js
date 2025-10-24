// =============================================
// Legacy Database Simulation (Maintained for compatibility)
// =============================================

// Initialize the database if it doesn't exist (for backward compatibility)
function initDatabase() {
    if (!localStorage.getItem('ev_database')) {
        const database = {
            posts: [
                {
                    id: 'president',
                    title: 'School President',
                    description: 'Head of the student council',
                    order: 1,
                    active: true
                },
                {
                    id: 'vice-president',
                    title: 'Vice President',
                    description: 'Assists the president',
                    order: 2,
                    active: true
                },
                {
                    id: 'secretary',
                    title: 'General Secretary',
                    description: 'Manages council records',
                    order: 3,
                    active: true
                },
                {
                    id: 'treasurer',
                    title: 'Treasurer',
                    description: 'Manages student funds',
                    order: 4,
                    active: true
                },
                {
                    id: 'sports-prefect',
                    title: 'Sports Prefect',
                    description: 'Leads the sports department',
                    order: 5,
                    active: true
                },
                {
                    id: 'entertainment-prefect',
                    title: 'Entertainment Prefect',
                    description: 'Manages entertainment and events',
                    order: 6,
                    active: false
                }
            ],
            candidates: [
                {
                    id: 'c1',
                    name: 'Alice A. Thompson',
                    class: 'S6A',
                    stream: 'Science',
                    slogan: 'Leading with innovation and integrity',
                    photoUrl: '',
                    postId: 'president',
                    votes: 0
                },
                {
                    id: 'c2',
                    name: 'David B. Roberts',
                    class: 'S6B',
                    stream: 'Arts',
                    slogan: 'Your voice, our future',
                    photoUrl: '',
                    postId: 'president',
                    votes: 0
                },
                {
                    id: 'c3',
                    name: 'James D. Carter',
                    class: 'S5A',
                    stream: 'Science',
                    slogan: 'Together we achieve more',
                    photoUrl: '',
                    postId: 'vice-president',
                    votes: 0
                },
                {
                    id: 'c4',
                    name: 'Sophia E. Martinez',
                    class: 'S5B',
                    stream: 'Arts',
                    slogan: 'Empowering student voices',
                    photoUrl: '',
                    postId: 'vice-president',
                    votes: 0
                }
            ],
            voters: [
                { id: 'S12345', name: 'John K. Anderson', className: 'S6', house: 'Lion House', voted: false },
                { id: 'S23456', name: 'Sarah M. Johnson', className: 'S5', house: 'Eagle House', voted: false },
                { id: 'S34567', name: 'Michael T. Williams', className: 'S4', house: 'Panther House', voted: false }
            ],
            votes: [],
            guidelines: '<h2>School Election Guidelines</h2><p>Please read these guidelines carefully before casting your vote:</p><ol><li>Each student is entitled to one vote per position.</li><li>Votes are confidential and cannot be traced back to individual students.</li><li>Once you submit your vote, you cannot change your selections.</li><li>You must vote for one candidate in each category to complete the process.</li><li>Do not share your student ID with anyone during the voting process.</li><li>The voting system will automatically log you out after 15 minutes of inactivity.</li><li>Any attempt to manipulate the voting system will result in disciplinary action.</li></ol>',
            system_status: {
                enabled: true,
                history: [
                    { timestamp: new Date().toISOString(), action: 'System Initialized', user: 'ICT Admin' }
                ]
            },
            admins: [
                { id: 'admin1', username: 'admin', password: 'admin123', role: 'Super Administrator', status: 'Active' },
                { id: 'ictadmin1', username: 'ictadmin', password: 'ictadmin123', role: 'ICT Administrator', status: 'Active' }
            ],
            audit_log: []
        };
        localStorage.setItem('ev_database', JSON.stringify(database));
    }
    return JSON.parse(localStorage.getItem('ev_database'));
}

// Legacy API functions (maintained for backward compatibility)
const evAPI = {
    // Get all data
    getDatabase: () => {
        return JSON.parse(localStorage.getItem('ev_database') || '{}');
    },

    // Save the entire database
    saveDatabase: (db) => {
        localStorage.setItem('ev_database', JSON.stringify(db));
    },

    // Posts
    getPosts: () => {
        const db = evAPI.getDatabase();
        return db.posts || [];
    },

    getPost: (id) => {
        const db = evAPI.getDatabase();
        return db.posts.find(post => post.id === id);
    },

    savePost: (post) => {
        const db = evAPI.getDatabase();
        const index = db.posts.findIndex(p => p.id === post.id);
        if (index !== -1) {
            // Update existing post
            db.posts[index] = post;
        } else {
            // Add new post
            db.posts.push(post);
        }
        evAPI.saveDatabase(db);
        return post;
    },

    deletePost: (id) => {
        const db = evAPI.getDatabase();
        db.posts = db.posts.filter(post => post.id !== id);
        evAPI.saveDatabase(db);
        return true;
    },

    // Candidates
    getCandidates: () => {
        const db = evAPI.getDatabase();
        return db.candidates || [];
    },

    getCandidate: (id) => {
        const db = evAPI.getDatabase();
        return db.candidates.find(candidate => candidate.id === id);
    },

    saveCandidate: (candidate) => {
        const db = evAPI.getDatabase();
        const index = db.candidates.findIndex(c => c.id === candidate.id);
        if (index !== -1) {
            // Update existing candidate
            db.candidates[index] = candidate;
        } else {
            // Add new candidate
            db.candidates.push(candidate);
        }
        evAPI.saveDatabase(db);
        return candidate;
    },

    deleteCandidate: (id) => {
        const db = evAPI.getDatabase();
        db.candidates = db.candidates.filter(candidate => candidate.id !== id);
        evAPI.saveDatabase(db);
        return true;
    },

    // Voters
    getVoters: () => {
        const db = evAPI.getDatabase();
        return db.voters || [];
    },

    getVoter: (id) => {
        const db = evAPI.getDatabase();
        return db.voters.find(voter => voter.id === id);
    },

    saveVoter: (voter) => {
        const db = evAPI.getDatabase();
        const index = db.voters.findIndex(v => v.id === voter.id);
        if (index !== -1) {
            // Update existing voter
            db.voters[index] = voter;
        } else {
            // Add new voter
            db.voters.push(voter);
        }
        evAPI.saveDatabase(db);
        return voter;
    },

    // Votes
    getVotes: () => {
        const db = evAPI.getDatabase();
        return db.votes || [];
    },

    saveVote: (vote) => {
        const db = evAPI.getDatabase();
        db.votes.push(vote);

        // Update candidate vote counts
        vote.selections.forEach(selection => {
            const candidate = db.candidates.find(c => c.id === selection.candidateId);
            if (candidate) {
                candidate.votes = (candidate.votes || 0) + 1;
            }
        });

        // Mark voter as voted
        const voter = db.voters.find(v => v.id === vote.studentId);
        if (voter) {
            voter.voted = true;
        }

        evAPI.saveDatabase(db);

        // Dispatch a custom event to notify other modules of the update
        window.dispatchEvent(new CustomEvent('databaseUpdated'));

        return vote;
    },

    // Guidelines
    getGuidelines: () => {
        const db = evAPI.getDatabase();
        return db.guidelines || '';
    },

    saveGuidelines: (content) => {
        const db = evAPI.getDatabase();
        db.guidelines = content;
        evAPI.saveDatabase(db);
        return content;
    }
};

// =============================================
// Application Initialization
// =============================================

// Initialize the database
initDatabase();

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
                // Try backend authentication first
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
                // Fallback to localStorage for backward compatibility
                console.log('Backend not available, using localStorage fallback');
                const db = evAPI.getDatabase();
                const voter = db.voters.find(v => v.id === studentId);

                if (voter) {
                    localStorage.setItem('user_role', 'student');
                    localStorage.setItem('student_id', studentId);
                    window.location.href = `Voter-module.html?studentId=${studentId}`;
                } else {
                    alert('Student ID not found. Please contact your administrator.');
                }
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
                // Try backend authentication first
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
                // Fallback to localStorage for backward compatibility
                console.log('Backend not available, using localStorage fallback');
                const db = evAPI.getDatabase();
                const admin = db.admins.find(a => a.username === username && a.password === password && a.status === 'Active');

                if (admin) {
                    sessionStorage.setItem('ev_admin_user', JSON.stringify(admin));
                    localStorage.setItem('user_role', 'admin');
                    window.location.href = 'Admin-module.html';
                } else {
                    alert('Invalid admin credentials');
                }
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
                // Try backend authentication first
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
                // Fallback to localStorage for backward compatibility
                console.log('Backend not available, using localStorage fallback');
                const db = evAPI.getDatabase();
                const ictAdmin = db.admins.find(a => a.username === username && a.password === password && a.role === 'ICT Administrator' && a.status === 'Active');

                if (ictAdmin) {
                    sessionStorage.setItem('ev_ict_admin_user', JSON.stringify(ictAdmin));
                    localStorage.setItem('user_role', 'ict_admin');
                    window.location.href = 'ICT-Admin.html';
                } else {
                    alert('Invalid ICT admin credentials');
                }
            }
        });
    }
});