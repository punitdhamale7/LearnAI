class Chatbot {
    constructor() {
        this.isOpen = false;
        this.isTyping = false;
        this.userId = null;
        this.conversationHistory = [];
        this.init();
    }

    init() {
        const session = JSON.parse(localStorage.getItem('session'));
        if (session?.user) this.userId = session.user.id;

        this.injectStyles();
        this.createHTML();
        this.bindEvents();

        setTimeout(() => {
            this.addBotMessage(
                `Hey there! 👋 I'm **Aria**, your AI learning assistant powered by Llama 3.3.\n\nI can help you with courses, answer tech questions, guide your learning path, and much more. What's on your mind?`,
                ['Browse Courses', 'My Progress', 'Recommend me a course', 'What can you do?']
            );
        }, 600);
    }

    injectStyles() {
        if (document.getElementById('chatbot-styles')) return;
        const style = document.createElement('style');
        style.id = 'chatbot-styles';
        style.textContent = `
            /* ===== CHATBOT WIDGET ===== */
            #learnai-chatbot { position: fixed; bottom: 28px; right: 28px; z-index: 99999; font-family: 'Inter', sans-serif; }

            /* Toggle Button */
            #chatbot-toggle {
                width: 62px; height: 62px; border-radius: 50%;
                background: linear-gradient(145deg, #6b7280, #374151);
                border: none; cursor: pointer;
                box-shadow: 0 8px 25px rgba(0,0,0,0.35);
                display: flex; align-items: center; justify-content: center;
                transition: all 0.3s ease; position: relative;
            }
            #chatbot-toggle:hover { transform: scale(1.08); box-shadow: 0 12px 30px rgba(0,0,0,0.45); }
            #chatbot-toggle svg { width: 28px; height: 28px; color: white; transition: all 0.4s ease; }
            #chatbot-toggle:hover svg.icon-bot { transform: rotate(45deg) scale(1.1); }
            #chatbot-toggle .icon-close { display: none; }
            #chatbot-toggle.open .icon-bot { display: none; }
            #chatbot-toggle.open .icon-close { display: block; }

            /* Pulse ring */
            #chatbot-toggle::before {
                content: ''; position: absolute; inset: -4px; border-radius: 50%;
                border: 2px solid rgba(107,114,128,0.5);
                animation: pulse-ring 2s ease-out infinite;
            }
            @keyframes pulse-ring {
                0% { transform: scale(1); opacity: 1; }
                100% { transform: scale(1.35); opacity: 0; }
            }

            /* Notification dot */
            #chatbot-dot {
                position: absolute; top: 2px; right: 2px;
                width: 14px; height: 14px; background: #22c55e;
                border-radius: 50%; border: 2px solid white;
                animation: blink 2s ease-in-out infinite;
            }
            @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }

            /* Chat Window */
            #chatbot-window {
                position: absolute; bottom: 78px; right: 0;
                width: 390px; height: 580px;
                background: #ffffff; border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06);
                display: flex; flex-direction: column; overflow: hidden;
                opacity: 0; visibility: hidden; transform: translateY(16px) scale(0.97);
                transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
                transform-origin: bottom right;
            }
            #chatbot-window.open {
                opacity: 1; visibility: visible; transform: translateY(0) scale(1);
            }

            /* Header */
            #chatbot-header {
                background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
                padding: 18px 20px; display: flex; align-items: center; gap: 12px;
                flex-shrink: 0;
            }
            #chatbot-avatar {
                width: 44px; height: 44px; border-radius: 50%;
                background: rgba(255,255,255,0.2);
                display: flex; align-items: center; justify-content: center;
                font-size: 22px; flex-shrink: 0;
                border: 2px solid rgba(255,255,255,0.3);
            }
            #chatbot-header-info { flex: 1; }
            #chatbot-header-info h3 { color: white; font-size: 15px; font-weight: 700; margin: 0 0 2px; }
            #chatbot-header-info p { color: rgba(255,255,255,0.8); font-size: 12px; margin: 0; display: flex; align-items: center; gap: 5px; }
            #chatbot-header-info p::before { content:''; width:7px; height:7px; background:#22c55e; border-radius:50%; display:inline-block; }
            #chatbot-close-btn {
                background: rgba(255,255,255,0.15); border: none; color: white;
                width: 32px; height: 32px; border-radius: 50%; cursor: pointer;
                font-size: 18px; display: flex; align-items: center; justify-content: center;
                transition: background 0.2s; flex-shrink: 0;
            }
            #chatbot-close-btn:hover { background: rgba(255,255,255,0.25); }

            /* Quick Actions */
            #chatbot-quick {
                display: flex; gap: 7px; padding: 12px 16px;
                background: #f8fafc; border-bottom: 1px solid #f1f5f9;
                overflow-x: auto; flex-shrink: 0;
            }
            #chatbot-quick::-webkit-scrollbar { display: none; }
            .quick-chip {
                padding: 6px 13px; background: white; border: 1.5px solid #e2e8f0;
                border-radius: 20px; font-size: 12px; font-weight: 500; color: #475569;
                cursor: pointer; white-space: nowrap; transition: all 0.2s; flex-shrink: 0;
            }
            .quick-chip:hover { background: #4b5563; color: white; border-color: #4b5563; }

            /* Messages */
            #chatbot-messages {
                flex: 1; overflow-y: auto; padding: 20px 16px;
                display: flex; flex-direction: column; gap: 16px;
                background: #f8fafc;
            }
            #chatbot-messages::-webkit-scrollbar { width: 4px; }
            #chatbot-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

            /* Message rows */
            .msg-row { display: flex; gap: 10px; animation: msgIn 0.3s ease; }
            .msg-row.user { flex-direction: row-reverse; }
            @keyframes msgIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

            .msg-avatar {
                width: 34px; height: 34px; border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                font-size: 16px; flex-shrink: 0; align-self: flex-end;
            }
            .msg-avatar.bot { background: linear-gradient(135deg,#6b7280,#374151); }
            .msg-avatar.user { background: linear-gradient(135deg,#9ca3af,#6b7280); }

            .msg-body { max-width: 78%; display: flex; flex-direction: column; gap: 6px; }
            .msg-row.user .msg-body { align-items: flex-end; }

            .msg-bubble {
                padding: 12px 16px; border-radius: 18px;
                font-size: 14px; line-height: 1.6; word-break: break-word;
            }
            .msg-row.bot .msg-bubble {
                background: white; color: #1e293b;
                border-bottom-left-radius: 5px;
                box-shadow: 0 1px 4px rgba(0,0,0,0.08);
            }
            .msg-row.user .msg-bubble {
                background: linear-gradient(135deg,#4b5563,#374151);
                color: white; border-bottom-right-radius: 5px;
            }
            .msg-bubble strong { font-weight: 700; }
            .msg-bubble br { display: block; margin: 2px 0; }

            .msg-time { font-size: 11px; color: #94a3b8; padding: 0 4px; }

            /* Suggestions */
            .msg-suggestions { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 4px; }
            .suggestion-btn {
                padding: 6px 13px; background: white; border: 1.5px solid #e2e8f0;
                border-radius: 20px; font-size: 12px; font-weight: 500; color: #4b5563;
                cursor: pointer; transition: all 0.2s;
            }
            .suggestion-btn:hover { background: #4b5563; color: white; border-color: #4b5563; }

            /* Typing indicator */
            #typing-indicator { display: flex; gap: 10px; align-items: flex-end; }
            .typing-bubble {
                background: white; padding: 14px 18px; border-radius: 18px;
                border-bottom-left-radius: 5px; display: flex; gap: 5px; align-items: center;
                box-shadow: 0 1px 4px rgba(0,0,0,0.08);
            }
            .typing-dot {
                width: 7px; height: 7px; background: #94a3b8; border-radius: 50%;
                animation: typingBounce 1.2s ease-in-out infinite;
            }
            .typing-dot:nth-child(2) { animation-delay: 0.2s; }
            .typing-dot:nth-child(3) { animation-delay: 0.4s; }
            @keyframes typingBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-8px)} }

            /* Input area */
            #chatbot-input-area {
                padding: 14px 16px; background: white;
                border-top: 1px solid #f1f5f9; flex-shrink: 0;
            }
            #chatbot-input-row {
                display: flex; gap: 10px; align-items: center;
                background: #f8fafc; border: 1.5px solid #e2e8f0;
                border-radius: 14px; padding: 8px 8px 8px 16px;
                transition: border-color 0.2s;
            }
            #chatbot-input-row:focus-within { border-color: #6b7280; }
            #chatbot-input {
                flex: 1; border: none; background: transparent;
                font-size: 14px; color: #1e293b; outline: none;
                font-family: 'Inter', sans-serif;
            }
            #chatbot-input::placeholder { color: #94a3b8; }
            #chatbot-send {
                width: 36px; height: 36px; border-radius: 10px;
                background: linear-gradient(135deg,#4b5563,#374151);
                border: none; cursor: pointer; display: flex;
                align-items: center; justify-content: center;
                transition: all 0.2s; flex-shrink: 0;
            }
            #chatbot-send:hover { transform: scale(1.08); }
            #chatbot-send:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
            #chatbot-send svg { width: 16px; height: 16px; color: white; }

            /* Footer */
            #chatbot-footer {
                text-align: center; padding: 8px;
                font-size: 11px; color: #94a3b8; background: white;
                border-top: 1px solid #f1f5f9; flex-shrink: 0;
            }
            #chatbot-footer span { color: #4b5563; font-weight: 600; }

            /* Mobile */
            @media (max-width: 480px) {
                #chatbot-window { width: calc(100vw - 24px); right: -4px; height: 520px; }
                #learnai-chatbot { bottom: 16px; right: 16px; }
            }

            /* Dark mode support */
            [data-theme="dark"] #chatbot-window { background: #1e293b; }
            [data-theme="dark"] #chatbot-messages { background: #0f172a; }
            [data-theme="dark"] .msg-row.bot .msg-bubble { background: #1e293b; color: #f1f5f9; }
            [data-theme="dark"] #chatbot-input-area { background: #1e293b; border-color: #334155; }
            [data-theme="dark"] #chatbot-input-row { background: #0f172a; border-color: #334155; }
            [data-theme="dark"] #chatbot-input { color: #f1f5f9; }
            [data-theme="dark"] #chatbot-quick { background: #1e293b; border-color: #334155; }
            [data-theme="dark"] .quick-chip { background: #0f172a; border-color: #334155; color: #94a3b8; }
            [data-theme="dark"] .suggestion-btn { background: #0f172a; border-color: #334155; }
            [data-theme="dark"] .typing-bubble { background: #1e293b; }
            [data-theme="dark"] #chatbot-footer { background: #1e293b; border-color: #334155; }
        `;
        document.head.appendChild(style);
    }

    createHTML() {
        const html = `
        <div id="learnai-chatbot">
            <button id="chatbot-toggle" aria-label="Open AI Assistant">
                <div id="chatbot-dot"></div>
                <!-- AI Spark / Neural icon -->
                <svg class="icon-bot" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="3" fill="white"/>
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="white" stroke-width="2" stroke-linecap="round"/>
                    <path d="M5.636 5.636l2.121 2.121M16.243 16.243l2.121 2.121M5.636 18.364l2.121-2.121M16.243 7.757l2.121-2.121" stroke="white" stroke-width="2" stroke-linecap="round"/>
                    <circle cx="12" cy="12" r="6" stroke="white" stroke-width="1.5" stroke-dasharray="3 2"/>
                </svg>
                <svg class="icon-close" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>

            <div id="chatbot-window">
                <div id="chatbot-header">
                    <div id="chatbot-avatar">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:26px;height:26px;">
                            <circle cx="12" cy="12" r="3" fill="white"/>
                            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="white" stroke-width="2" stroke-linecap="round"/>
                            <path d="M5.636 5.636l2.121 2.121M16.243 16.243l2.121 2.121M5.636 18.364l2.121-2.121M16.243 7.757l2.121-2.121" stroke="white" stroke-width="2" stroke-linecap="round"/>
                            <circle cx="12" cy="12" r="6" stroke="white" stroke-width="1.5" stroke-dasharray="3 2"/>
                        </svg>
                    </div>
                    <div id="chatbot-header-info">
                        <h3>Aria — AI Assistant</h3>
                        <p>Online · Powered by Llama 3.3</p>
                    </div>
                    <button id="chatbot-close-btn" aria-label="Close">✕</button>
                </div>

                <div id="chatbot-quick">
                    <button class="quick-chip" data-msg="What courses do you offer?">📚 Courses</button>
                    <button class="quick-chip" data-msg="Show my progress">📊 Progress</button>
                    <button class="quick-chip" data-msg="Recommend me a course">✨ Recommend</button>
                    <button class="quick-chip" data-msg="How do I get a certificate?">🎓 Certificate</button>
                    <button class="quick-chip" data-msg="What can you help me with?">💡 Help</button>
                </div>

                <div id="chatbot-messages"></div>

                <div id="chatbot-input-area">
                    <div id="chatbot-input-row">
                        <input id="chatbot-input" type="text" placeholder="Ask me anything..." autocomplete="off" maxlength="500"/>
                        <button id="chatbot-send" aria-label="Send">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div id="chatbot-footer">Powered by <span>Groq × Llama 3.3</span> · LearnAI</div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
    }

    bindEvents() {
        document.getElementById('chatbot-toggle').addEventListener('click', () => this.toggle());
        document.getElementById('chatbot-close-btn').addEventListener('click', () => this.close());
        document.getElementById('chatbot-send').addEventListener('click', () => this.send());
        document.getElementById('chatbot-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
        });
        document.querySelectorAll('.quick-chip').forEach(btn => {
            btn.addEventListener('click', () => this.send(btn.dataset.msg));
        });
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        this.isOpen = true;
        document.getElementById('chatbot-window').classList.add('open');
        document.getElementById('chatbot-toggle').classList.add('open');
        document.getElementById('chatbot-dot').style.display = 'none';
        setTimeout(() => document.getElementById('chatbot-input').focus(), 300);
        this.scrollBottom();
    }

    close() {
        this.isOpen = false;
        document.getElementById('chatbot-window').classList.remove('open');
        document.getElementById('chatbot-toggle').classList.remove('open');
    }

    async send(text = null) {
        const input = document.getElementById('chatbot-input');
        const message = (text || input.value).trim();
        if (!message || this.isTyping) return;

        input.value = '';
        this.addUserMessage(message);
        this.showTyping();
        this.isTyping = true;
        document.getElementById('chatbot-send').disabled = true;

        
        this.conversationHistory.push({ role: 'user', content: message });

        try {
            const res = await fetch('https://learnai-backend-yf50.onrender.com/api/chatbot/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    userId: this.userId,
                    history: this.conversationHistory.slice(-8)
                })
            });

            const data = await res.json();
            this.hideTyping();

            if (data.success) {
                this.conversationHistory.push({ role: 'assistant', content: data.reply });
                this.addBotMessage(data.reply, data.suggestions);
            } else {
                this.addBotMessage("Sorry, something went wrong. Please try again! 🙏", ['Try again', 'Browse courses']);
            }
        } catch (err) {
            this.hideTyping();
            this.addBotMessage("I'm having trouble connecting right now. Make sure the server is running! 🔌", ['Retry', 'Browse courses']);
        }

        this.isTyping = false;
        document.getElementById('chatbot-send').disabled = false;
        document.getElementById('chatbot-input').focus();
    }

    addUserMessage(text) {
        const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const html = `
            <div class="msg-row user">
                <div class="msg-body">
                    <div class="msg-bubble">${this.escape(text)}</div>
                    <div class="msg-time">${time}</div>
                </div>
                <div class="msg-avatar user">
                    <svg viewBox="0 0 24 24" fill="none" style="width:18px;height:18px;">
                        <circle cx="12" cy="8" r="4" fill="white"/>
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="white" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </div>
            </div>`;
        document.getElementById('chatbot-messages').insertAdjacentHTML('beforeend', html);
        this.scrollBottom();
    }

    addBotMessage(text, suggestions = []) {
        const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const formatted = this.format(text);
        const botIcon = `<svg viewBox="0 0 24 24" fill="none" style="width:18px;height:18px;">
            <circle cx="12" cy="12" r="3" fill="white"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M5.636 5.636l2.121 2.121M16.243 16.243l2.121 2.121M5.636 18.364l2.121-2.121M16.243 7.757l2.121-2.121" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="6" stroke="white" stroke-width="1.2" stroke-dasharray="3 2"/>
        </svg>`;

        let suggestionsHTML = '';
        if (suggestions?.length) {
            suggestionsHTML = `<div class="msg-suggestions">
                ${suggestions.map(s => `<button class="suggestion-btn" onclick="window._chatbot.send('${this.escape(s)}')">${this.escape(s)}</button>`).join('')}
            </div>`;
        }

        const html = `
            <div class="msg-row bot">
                <div class="msg-avatar bot">${botIcon}</div>
                <div class="msg-body">
                    <div class="msg-bubble">${formatted}</div>
                    ${suggestionsHTML}
                    <div class="msg-time">${time}</div>
                </div>
            </div>`;
        document.getElementById('chatbot-messages').insertAdjacentHTML('beforeend', html);
        this.scrollBottom();
    }

    showTyping() {
        const botIcon = `<svg viewBox="0 0 24 24" fill="none" style="width:18px;height:18px;">
            <circle cx="12" cy="12" r="3" fill="white"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M5.636 5.636l2.121 2.121M16.243 16.243l2.121 2.121M5.636 18.364l2.121-2.121M16.243 7.757l2.121-2.121" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="6" stroke="white" stroke-width="1.2" stroke-dasharray="3 2"/>
        </svg>`;
        const html = `
            <div id="typing-indicator" class="msg-row bot">
                <div class="msg-avatar bot">${botIcon}</div>
                <div class="typing-bubble">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>`;
        document.getElementById('chatbot-messages').insertAdjacentHTML('beforeend', html);
        this.scrollBottom();
    }

    hideTyping() {
        document.getElementById('typing-indicator')?.remove();
    }

    scrollBottom() {
        const el = document.getElementById('chatbot-messages');
        setTimeout(() => { if (el) el.scrollTop = el.scrollHeight; }, 80);
    }

    format(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    escape(text) {
        const d = document.createElement('div');
        d.textContent = text;
        return d.innerHTML;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    window._chatbot = new Chatbot();
});
