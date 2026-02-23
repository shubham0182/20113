const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const chatViewport = document.getElementById('chat-viewport');

// 1. AUTO-RESIZE TEXTAREA
userInput.addEventListener('input', function() {
    this.style.height = 'auto'; 
    this.style.height = (this.scrollHeight) + 'px';
});

// 2. CORE SEND LOGIC
async function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;

    // UI Cleanup: Remove greeting and add User Message
    const greeting = document.getElementById('greeting');
    if (greeting) greeting.remove();
    
    appendMessage(text, 'user-message');
    
    // Clear input field immediately
    userInput.value = '';
    userInput.style.height = 'auto';

    // Show AI "Thinking" state
    const aiDiv = createAIPlaceholder();
    chatViewport.appendChild(aiDiv);
    scrollChat();

    try {
        // --- CONNECTING TO FLASK SERVER ---
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ message: text }) // Key must match "message" in Python
        });

        const data = await response.json();

        if (response.ok) {
            // Remove shimmer and add real text with formatting
            const aiContent = aiDiv.querySelector('.ai-content');
            aiContent.innerHTML = ""; // Clear shimmer
            
            // Format response (Handle bold/newlines)
            const formattedText = formatAIResponse(data.reply);
            typeWriter(aiContent, formattedText);
        } else {
            throw new Error(data.reply || "Server connection failed.");
        }
    } catch (error) {
        const aiContent = aiDiv.querySelector('.ai-content');
        aiContent.innerHTML = `<span style="color: #ff6b6b;">⚠️ ${error.message}</span>`;
    }

    scrollChat();
}

/**
 * HELPER FUNCTIONS
 */

function appendMessage(text, type) {
    const div = document.createElement('div');
    div.className = `message ${type}`;
    // User messages are wrapped in a 'content' bubble based on your CSS
    div.innerHTML = `<div class="content">${text}</div>`;
    chatViewport.appendChild(div);
}

function createAIPlaceholder() {
    const div = document.createElement('div');
    div.className = 'message ai-message';
    div.innerHTML = `
        <div class="ai-icon"></div>
        <div class="ai-content" style="flex: 1;">
            <div class="shimmer" style="width: 80%"></div>
            <div class="shimmer" style="width: 50%"></div>
        </div>`;
    return div;
}

function scrollChat() {
    chatViewport.scrollTo({ top: chatViewport.scrollHeight, behavior: 'smooth' });
}

// Simple Typewriter Effect
function typeWriter(element, html) {
    element.innerHTML = html; // In a production app, you'd use a more complex char-by-char loop
    scrollChat();
}

// Basic Formatter for Gemini's Markdown
function formatAIResponse(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
        .replace(/\n/g, '<br>'); // Line breaks
}

// LISTENERS
sendBtn.addEventListener('click', handleSend);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});