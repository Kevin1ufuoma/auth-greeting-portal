// ==========================================
// 1. CHOOSE GENDER MESSAGES
// ==========================================
const MALE_GREETINGS = [
    "Welcome aboard, sir! Hope your day is going exceptionally well.",
    "Hello King! Great to see you. Thanks for taking the time to check out my project.",
    "Greetings gentleman! You are looking sharp today. Let me know what you think of this app."
];

const FEMALE_GREETINGS = [
    "Welcome, ma'am! It is an absolute pleasure to have you here.",
    "Hello Queen! Thank you for stepping into my project space today. Hope you love it!",
    "Greetings! Your presence makes this app look even better. Have an amazing experience!"
];

// Backend API Endpoint
const BACKEND_URL = 'https://auth-greeting-backend.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 2. CHECK SECURITY AUTHENTICATION STATE
    // ==========================================
    const token = localStorage.getItem('access_token');
    const username = localStorage.getItem('username');
    const gender = localStorage.getItem('gender');

    // Security Guard: If no token exists, boot them back to the login screen
    if (!token || !username || !gender) {
        alert("Access Denied! Please log in first.");
        window.location.href = 'index.html';
        return;
    }

    // ==========================================
    // 3. RENDER DYNAMIC GENDER-BASED GREETING
    // ==========================================
    const titleElement = document.getElementById('greeting-title');
    const messageElement = document.getElementById('greeting-message');

    titleElement.innerText = `Welcome, ${username}!`;

    // Pick a random nice message based on selected registration gender
    if (gender.toLowerCase() === 'male') {
        const randomMaleMsg = MALE_GREETINGS[Math.floor(Math.random() * MALE_GREETINGS.length)];
        messageElement.innerText = randomMaleMsg;
        titleElement.style.color = '#3b82f6'; // Clean portfolio blue accent for gentlemen
    } else {
        const randomFemaleMsg = FEMALE_GREETINGS[Math.floor(Math.random() * FEMALE_GREETINGS.length)];
        messageElement.innerText = randomFemaleMsg;
        titleElement.style.color = '#ec4899'; // Clean portfolio pink accent for ladies
    }

    // Fetch comment history instantly on load
    loadCommentHistory();

    // ==========================================
    // 4. FEEDBACK LOOP (FORMSPREE + SUPABASE)
    // ==========================================
    const feedbackForm = document.getElementById('feedback-form');
    
    feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Stop standard redirect to let Formspree submit silently via AJAX
        
        const feedbackText = document.getElementById('feedback-text').value;
        const submitBtn = feedbackForm.querySelector('.btn');
        
        submitBtn.innerText = 'Sending...';
        submitBtn.disabled = true;

        try {
            // A. Send email notification via Formspree using fetch
            const formspreeResponse = await fetch(feedbackForm.action, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: username, email: localStorage.getItem('email'), message: feedbackText })
            });

            // B. Simultaneously log the comment inside Supabase via your secure Python backend
            const supabaseResponse = await fetch(`${BACKEND_URL}/api/feedback`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ username, message: feedbackText })
            });

            if (formspreeResponse.ok && supabaseResponse.ok) {
                alert('Thank you! Your feedback has been sent to my email and saved to the comment history.');
                feedbackForm.reset();
                loadCommentHistory(); // Reload history section instantly
            } else {
                alert('Feedback logged, but some systems failed to respond.');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            alert('Failed to submit feedback. Check your console lines.');
        } finally {
            submitBtn.innerText = 'Save & Send';
            submitBtn.disabled = false;
        }
    });

    // ==========================================
    // 5. LOGOUT LOGIC
    // ==========================================
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear(); // Wipe credentials cache completely
        window.location.href = 'index.html';
    });
});

// ==========================================
// 6. RENDER SUPABASE COMMENT HISTORY VIEW
// ==========================================
async function loadCommentHistory() {
    const wrapper = document.getElementById('comments-wrapper');
    try {
        const response = await fetch(`${BACKEND_URL}/api/feedback`, {
            method: 'GET'
        });
        const comments = await response.json();

        if (comments.length === 0) {
            wrapper.innerHTML = '<div style="color: #94a3b8; font-style: italic;">No feedback yet. Be the first to leave a comment!</div>';
            return;
        }

        // Render each comment cleanly
        wrapper.innerHTML = comments.map(c => `
            <div class="comment-item">
                <strong style="color: #162938;">${c.username}:</strong> <span>${c.message}</span>
            </div>
        `).join('');
    } catch (error) {
        wrapper.innerHTML = '<div style="color: #ef4444;">Failed to fetch history wrapper.</div>';
    }
}

// ==========================================
// 7. CHATBOX CONTROLLER LOGIC (RESTORED TO ORIGINAL WORKING STATE)
// ==========================================
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');
const chatBox = document.getElementById('chat-box');

async function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return; 

    // Append the User's typed message directly to the UI screen window
    chatBox.innerHTML += `<div style="margin-bottom: 10px; color: #fff;"><strong>You:</strong> ${message}</div>`;
    chatInput.value = ''; 
    chatBox.scrollTop = chatBox.scrollHeight; 

    // Visual placeholder indicator
    const loadingId = 'ai-loading-' + Date.now();
    chatBox.innerHTML += `<div id="${loadingId}" style="margin-bottom: 10px; color: #94a3b8; font-style: italic;">AI is thinking...</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch(`${BACKEND_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message }) // RESTORED: Sends a clean single text key
        });
        const data = await response.json();

        document.getElementById(loadingId).remove();

        if (response.ok) {
            chatBox.innerHTML += `<div style="margin-bottom: 10px; color: #60a5fa;"><strong>Qwen AI:</strong> ${data.reply}</div>`;
        } else {
            chatBox.innerHTML += `<div style="margin-bottom: 10px; color: #ef4444;"><strong>Error:</strong> ${data.error}</div>`;
        }
    } catch (error) {
        document.getElementById(loadingId).remove();
        chatBox.innerHTML += `<div style="margin-bottom: 10px; color: #ef4444;"><strong>Error:</strong> Cannot link to AI engine right now.</div>`;
    }
    chatBox.scrollTop = chatBox.scrollHeight;
}

chatSendBtn.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
});
