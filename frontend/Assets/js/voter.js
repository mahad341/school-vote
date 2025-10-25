document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('voter-module')) {
        // Initialize with backend integration
        initVoterModuleBackend();
    }
});

// Function to show system disabled message
function showSystemDisabledMessage() {
    document.body.innerHTML = `
        <div class="system-disabled-message">
            <h1><i class="fas fa-exclamation-triangle"></i> Voting is Currently Closed</h1>
            <p>The voting system is currently offline. Please contact the ICT administrator for more information.</p>
            <div class="system-status-indicator">
                <div class="system-status-toggle disabled">
                    <div class="toggle-slider disabled"></div>
                </div>
                <div class="status-text disabled">System Disabled</div>
            </div>
        </div>
    `;
}

// Listen for system status changes
window.addEventListener('systemStatusChanged', function(event) {
    const isEnabled = event.detail.enabled;
    const wasEnabled = event.detail.wasEnabled;

    if (!isEnabled && document.getElementById('voter-module')) {
        showSystemDisabledMessage();
        // Show toast notification for status change
        if (typeof showGlobalToast === 'function') {
            showGlobalToast('Voting system has been disabled. Access is now restricted.', 'warning');
        }
    } else if (isEnabled && document.querySelector('.system-disabled-message')) {
        // If system is re-enabled and we're on voter page, reload to show voting interface
        window.location.reload();
        // Show toast notification for status change
        if (typeof showGlobalToast === 'function') {
            showGlobalToast('Voting system has been re-enabled. You can now continue voting.', 'success');
        }
    }
});

// Legacy localStorage function removed - now using backend exclusively

// Backend-integrated voter module
async function initVoterModuleBackend() {
    // State management
    const state = {
        currentScreen: 'auth',
        studentId: '',
        studentInfo: null,
        posts: [],
        currentPostIndex: 0,
        selections: {},
        socket: null
    };

    // DOM Elements
    const screens = {
        auth: document.getElementById('auth-screen'),
        guidelines: document.getElementById('guidelines-screen'),
        ballot: document.getElementById('ballot-screen'),
        review: document.getElementById('review-screen'),
        confirmation: document.getElementById('confirmation-screen')
    };

    // Authentication elements
    const studentIdInput = document.getElementById('voter-student-id');
    const studentNameInput = document.getElementById('voter-name');
    const studentClassInput = document.getElementById('voter-class');
    const studentHouseInput = document.getElementById('voter-house');
    const authContinueBtn = document.getElementById('auth-continue');

    // Guidelines elements
    const guidelinesAgree = document.getElementById('guidelines-agree');
    const guidelinesContinueBtn = document.getElementById('guidelines-continue');
    const guidelinesContent = document.getElementById('guidelines-content');

    // Ballot elements
    const postTitle = document.getElementById('post-title');
    const currentStep = document.getElementById('current-step');
    const totalSteps = document.getElementById('total-steps');
    const candidatesContainer = document.getElementById('candidates-container');
    const confirmSelection = document.getElementById('confirm-selection');
    const ballotContinueBtn = document.getElementById('ballot-continue');

    // Review elements
    const reviewSummary = document.getElementById('review-summary');
    const editBallotBtn = document.getElementById('edit-ballot');
    const submitVoteBtn = document.getElementById('submit-vote');

    // Confirmation elements
    const returnToAuthBtn = document.getElementById('return-to-auth');

    // Theme toggle
    const themeToggle = document.getElementById('voter-theme-toggle');
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });

    // Load saved theme
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }

    // Initialize Socket.io for real-time updates
    function initSocket() {
        apiClient.connectSocket();

        // Listen for real-time updates
        apiClient.onVoteUpdate((data) => {
            console.log('Vote update received:', data);
            // Refresh current ballot if needed
            if (state.currentScreen === 'ballot') {
                renderBallot();
            }
        });

        apiClient.onResultsUpdate((data) => {
            console.log('Results update received:', data);
            // Update results display if on review screen
            if (state.currentScreen === 'review') {
                renderReviewSummary();
            }
        });

        apiClient.onSystemStatusChange((data) => {
            console.log('System status change:', data);
            if (!data.status) {
                showSystemDisabledMessage();
            }
        });
    }

    // Get student ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const studentIdFromUrl = urlParams.get('studentId');
    if (studentIdFromUrl) {
        studentIdInput.value = studentIdFromUrl;
        await verifyStudentId();
    }

    // Verify student ID with backend
    async function verifyStudentId() {
        const id = studentIdInput.value.trim();
        if (!id) return;

        try {
            const response = await apiClient.getCurrentUser();

            if (response && response.studentId === id) {
                // User is authenticated
                studentNameInput.value = response.firstName + ' ' + response.lastName;
                studentClassInput.value = response.class || 'N/A';
                studentHouseInput.value = response.house || 'N/A';
                state.studentId = id;
                state.studentInfo = response;
                authContinueBtn.disabled = false;
            } else {
                alert('Authentication failed. Please try logging in again.');
                resetAuthForm();
            }
        } catch (error) {
            console.error('Error verifying student:', error);
            alert('Unable to verify student ID. Please check your connection and try again.');
            resetAuthForm();
        }
    }

    // Reset authentication form
    function resetAuthForm() {
        studentIdInput.value = '';
        studentNameInput.value = '';
        studentClassInput.value = '';
        studentHouseInput.value = '';
        authContinueBtn.disabled = true;
        state.studentId = '';
        state.studentInfo = null;
    }

    // Toggle guidelines continue button
    function toggleGuidelinesContinue() {
        guidelinesContinueBtn.disabled = !guidelinesAgree.checked;
    }

    // Start the voting process
    async function startVotingProcess() {
        try {
            const response = await apiClient.getVoterPosts();
            state.posts = response || [];
            state.currentPostIndex = 0;
            state.selections = {};
            totalSteps.textContent = state.posts.length;
            showScreen('ballot');
            await renderBallot();
        } catch (error) {
            console.error('Error loading posts:', error);
            alert('Unable to load voting posts. Please try again.');
        }
    }

    // Render the ballot for the current post
    async function renderBallot() {
        const post = state.posts[state.currentPostIndex];
        if (!post) return;

        // Dynamically update post title based on house for house-prefect posts
        let displayTitle = post.title;
        if ((post.title.toLowerCase().includes('house-prefect') || post.title.toLowerCase().includes('house prefect')) && state.studentInfo && state.studentInfo.house) {
            displayTitle = `${state.studentInfo.house} House Prefect`;
        } else if (post.title.toLowerCase().includes('house-prefect') || post.title.toLowerCase().includes('house prefect')) {
            displayTitle = 'House Prefect';
        }

        postTitle.textContent = displayTitle;
        currentStep.textContent = state.currentPostIndex + 1;

        const stepElements = document.querySelectorAll('.progress-steps .step');
        stepElements.forEach((step, index) => {
            if (index < state.posts.length) {
                step.style.display = 'block';
                step.classList.toggle('active', index <= state.currentPostIndex);
            } else {
                step.style.display = 'none';
            }
        });

        candidatesContainer.innerHTML = '';

        try {
            const response = await apiClient.getVoterCandidates(post.id);
            let candidates = response || [];

            // Apply house-based filtering for house-prefect posts
            if (post.title.toLowerCase().includes('house-prefect') || post.title.toLowerCase().includes('house prefect')) {
                const voterHouse = state.studentInfo ? state.studentInfo.house : '';
                if (voterHouse) {
                    candidates = candidates.filter(c => c.house && c.house.toLowerCase() === voterHouse.toLowerCase());

                    // Add notice about house filtering
                    const notice = document.createElement('div');
                    notice.className = 'house-filter-notice';
                    notice.innerHTML = `<i class="fas fa-info-circle"></i> You are only seeing candidates from your house (${voterHouse}).`;
                    candidatesContainer.appendChild(notice);
                } else {
                    candidates = [];
                }
            }

            if (candidates.length === 0) {
                const isHousePrefect = post.title.toLowerCase().includes('house-prefect') || post.title.toLowerCase().includes('house prefect');
                const noCandidatesMsg = document.createElement('div');
                noCandidatesMsg.className = 'no-candidates-message';

                if (isHousePrefect) {
                    const voterHouse = state.studentInfo ? state.studentInfo.house : 'your';
                    noCandidatesMsg.innerHTML = `
                        <i class="fas fa-home"></i>
                        <p>No candidates available for ${voterHouse} House Prefect position.</p>
                        <small>Please contact the election administrator if you believe this is an error.</small>
                    `;
                } else {
                    noCandidatesMsg.innerHTML = `
                        <i class="fas fa-info-circle"></i>
                        <p>No candidates available for this position at the moment.</p>
                    `;
                }
                candidatesContainer.appendChild(noCandidatesMsg);
            } else {
                // Render candidate cards
                candidates.forEach(candidate => {
                    const isSelected = state.selections[post.id] === candidate.id;

                    const card = document.createElement('div');
                    card.className = `candidate-card ${isSelected ? 'selected' : ''}`;
                    card.dataset.candidateId = candidate.id;
                    card.innerHTML = `
                        <div class="candidate-photo" style="background-image: url('${candidate.photoUrl || ''}')">
                            ${!candidate.photoUrl ? '<i class="fas fa-user"></i>' : ''}
                        </div>
                        <div class="candidate-info">
                            <div class="candidate-name">${candidate.firstName} ${candidate.lastName}</div>
                            <div class="candidate-class">${candidate.class || 'N/A'}</div>
                            ${candidate.house ? `<div class="candidate-house">House: ${candidate.house}</div>` : ''}
                            <div class="candidate-slogan">"${candidate.manifesto || 'No manifesto provided'}"</div>
                        </div>
                    `;

                    card.addEventListener('click', () => selectCandidate(post.id, candidate.id));
                    candidatesContainer.appendChild(card);
                });
            }
        } catch (error) {
            console.error('Error loading candidates:', error);
            candidatesContainer.innerHTML = '<div class="error-message">Unable to load candidates. Please try again.</div>';
        }

        confirmSelection.checked = false;
        ballotContinueBtn.disabled = true;
    }

    // Select a candidate
    function selectCandidate(postId, candidateId) {
        state.selections[postId] = candidateId;
        renderBallot();
    }

    // Toggle ballot continue button
    function toggleBallotContinue() {
        ballotContinueBtn.disabled = !confirmSelection.checked;
    }

    // Go to the next post
    function goToNextPost() {
        const currentPostId = state.posts[state.currentPostIndex].id;

        if (!state.selections[currentPostId]) {
            alert('Please select a candidate before continuing.');
            return;
        }

        state.currentPostIndex++;

        if (state.currentPostIndex < state.posts.length) {
            renderBallot();
        } else {
            showScreen('review');
            renderReviewSummary();
        }
    }

    // Render review summary
    function renderReviewSummary() {
        reviewSummary.innerHTML = '';

        state.posts.forEach(post => {
            const candidateId = state.selections[post.id];
            if (candidateId) {
                // In a real implementation, you'd fetch candidate details from backend
                const item = document.createElement('div');
                item.className = 'review-item';
                item.innerHTML = `
                    <div class="review-post">${post.title}:</div>
                    <div class="review-candidate">Candidate selected</div>
                `;
                reviewSummary.appendChild(item);
            }
        });
    }

    // Submit vote
    async function submitVote() {
        try {
            // Submit votes for each post individually
            for (let i = 0; i < state.posts.length; i++) {
                const post = state.posts[i];
                const candidateId = state.selections[post.id];

                if (candidateId) {
                    await apiClient.castVote({
                        postId: post.id,
                        candidateId: candidateId
                    });
                }
            }

            showScreen('confirmation');
        } catch (error) {
            console.error('Error submitting vote:', error);
            alert('Failed to submit vote. Please try again.');
        }
    }

    // Reset the system
    function resetSystem() {
        apiClient.logout();
        window.location.href = 'index.html';
    }

    // Show a specific screen
    function showScreen(screenName) {
        Object.values(screens).forEach(screen => {
            if(screen) screen.style.display = 'none';
        });

        if(screens[screenName]) screens[screenName].style.display = 'block';
        state.currentScreen = screenName;

        if (screenName === 'guidelines') {
            loadGuidelines();
        }
    }

    // Load guidelines from backend
    async function loadGuidelines() {
        try {
            const response = await apiClient.getVotingGuidelines();
            guidelinesContent.innerHTML = response || 'Guidelines not available.';
        } catch (error) {
            console.error('Error loading guidelines:', error);
            guidelinesContent.innerHTML = 'Unable to load guidelines. Please contact administrator.';
        }
    }

    // Initialize socket connection
    initSocket();

    // Event listeners
    studentIdInput.addEventListener('blur', verifyStudentId);
    authContinueBtn.addEventListener('click', function() {
        showScreen('guidelines');
    });

    guidelinesAgree.addEventListener('change', toggleGuidelinesContinue);
    guidelinesContinueBtn.addEventListener('click', startVotingProcess);

    confirmSelection.addEventListener('change', toggleBallotContinue);
    ballotContinueBtn.addEventListener('click', goToNextPost);

    editBallotBtn.addEventListener('click', function() {
        state.currentPostIndex = 0;
        showScreen('ballot');
        renderBallot();
    });

    submitVoteBtn.addEventListener('click', submitVote);

    returnToAuthBtn.addEventListener('click', resetSystem);

    showScreen('auth');
}