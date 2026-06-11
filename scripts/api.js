(function () {
    const API_BASE_URL = window.LEARNAI_API_URL || 'http://localhost:3001/api/';
    const TOKEN_KEY = 'learnai_tokens';
    const SESSION_KEY = 'learnai_session';

    const TokenManager = {
        getTokens() {
            try {
                const tokensStr = localStorage.getItem(TOKEN_KEY);
                return tokensStr ? JSON.parse(tokensStr) : null;
            } catch (e) { return null; }
        },
        saveTokens(tokens) {
            localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
        },
        clearTokens() {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(SESSION_KEY);
        },
        getAccessToken() {
            const tokens = this.getTokens();
            return tokens ? tokens.accessToken : null;
        },
        isTokenExpired(token) {
            if (!token) return true;
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.exp * 1000 < Date.now();
            } catch (e) { return true; }
        },
        async refreshAccessToken() {
            const tokens = this.getTokens();
            if (!tokens || !tokens.refreshToken) return null;
            try {
                const response = await fetch(`${API_BASE_URL}auth/refresh-token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken: tokens.refreshToken })
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.accessToken) {
                        this.saveTokens({ ...tokens, accessToken: data.accessToken });
                        return data.accessToken;
                    }
                }
            } catch (e) {}
            this.clearTokens();
            return null;
        }
    };

    const SessionManager = {
        saveSession(session) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        },
        getSession() {
            try {
                const s = localStorage.getItem(SESSION_KEY);
                return s ? JSON.parse(s) : null;
            } catch (e) { return null; }
        },
        clearSession() {
            localStorage.removeItem(SESSION_KEY);
        }
    };

    window.TokenManager = TokenManager;
    window.SessionManager = SessionManager;

    const _nativeGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function(key) {
        if (key === 'session') {
            const newSession = _nativeGetItem.call(this, SESSION_KEY);
            if (newSession) {
                try {
                    const user = JSON.parse(newSession);
                    return JSON.stringify({ user, loggedIn: true });
                } catch(e) {}
            }
            return _nativeGetItem.call(this, 'session');
        }
        return _nativeGetItem.call(this, key);
    };

    const _nativeSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
        if (key === 'session') {
            try {
                const parsed = JSON.parse(value);
                if (parsed && parsed.user) {
                    _nativeSetItem.call(this, SESSION_KEY, JSON.stringify(parsed.user));
                }
            } catch(e) {}
        }
        _nativeSetItem.call(this, key, value);
    };

    const _nativeRemoveItem = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function(key) {
        if (key === 'session') {
            _nativeRemoveItem.call(this, TOKEN_KEY);
            _nativeRemoveItem.call(this, SESSION_KEY);
        }
        _nativeRemoveItem.call(this, key);
    };

    const originalFetch = window.fetch;
    window.fetch = async function () {
        let [resource, config] = arguments;
        if (typeof resource === 'string' && resource.startsWith(API_BASE_URL)) {
            config = config || {};
            config.headers = config.headers || {};
            let accessToken = TokenManager.getAccessToken();
            if (accessToken && TokenManager.isTokenExpired(accessToken)) {
                accessToken = await TokenManager.refreshAccessToken();
            }
            if (accessToken) {
                if (config.headers instanceof Headers) {
                    config.headers.append('Authorization', `Bearer ${accessToken}`);
                } else {
                    config.headers['Authorization'] = `Bearer ${accessToken}`;
                }
            }
            if (!config.headers['Content-Type'] &&
                !(config.headers instanceof Headers && config.headers.has('Content-Type'))) {
                if (config.headers instanceof Headers) {
                    config.headers.append('Content-Type', 'application/json');
                } else {
                    config.headers['Content-Type'] = 'application/json';
                }
            }
        }
        const response = await originalFetch(resource, config);
        if (response.status === 401 && typeof resource === 'string' && resource.startsWith(API_BASE_URL)) {
            TokenManager.clearTokens();
            SessionManager.clearSession();
            if (!window.location.pathname.includes('login.html') &&
                !window.location.pathname.includes('register.html')) {
                window.location.href = 'login.html';
            }
        }
        return response;
    };

    window.API = {
        async login(emailOrUsername, password) {
            TokenManager.clearTokens();
            SessionManager.clearSession();
            _nativeRemoveItem.call(localStorage, 'session');

            const response = await fetch(`${API_BASE_URL}auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailOrUsername, password })
            });
            const data = await response.json();
            if (data.success && data.tokens) {
                TokenManager.saveTokens(data.tokens);
                SessionManager.saveSession(data.user);
                _nativeSetItem.call(localStorage, 'session', JSON.stringify({ user: data.user, loggedIn: true }));
                return data;
            }
            return data;
        },
        logout() {
            TokenManager.clearTokens();
            SessionManager.clearSession();
            _nativeRemoveItem.call(localStorage, 'session');
            window.location.replace('login.html');
        },
        isAuthenticated() {
            const accessToken = TokenManager.getAccessToken();
            return accessToken && !TokenManager.isTokenExpired(accessToken);
        },
        getCurrentUser() {
            return SessionManager.getSession();
        }
    };
})();
