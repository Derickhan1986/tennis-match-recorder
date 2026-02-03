//
// Auth module: Supabase login, register, logout, session, profile
// 认证模块：Supabase 登录、注册、登出、会话、资料
//

const auth = {
    supabase: null,
    user: null,
    profile: null,
    accessToken: null,

    init() {
        if (typeof window.supabase === 'undefined' || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
            console.warn('Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in js/config.js.');
            return;
        }
        this.supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
        // PASSWORD_RECOVERY: user clicked reset link; show set-new-password form
        // 用户点击重置链接后触发；显示设置新密码表单
        this.pendingPasswordRecovery = false;
        this.supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                this.pendingPasswordRecovery = true;
                this.user = session?.user ?? null;
                this.profile = null;
                this.accessToken = session?.access_token || null;
                this._saveTokenToStorage(this.accessToken);
                return;
            }
            if (session && session.user) {
                if (!session.user.email_confirmed_at) {
                    this.supabase.auth.signOut();
                    this.user = null;
                    this.profile = null;
                    this.accessToken = null;
                    this._saveTokenToStorage(null);
                } else {
                    this.user = session.user;
                    this.accessToken = session?.access_token || null;
                    this._saveTokenToStorage(this.accessToken);
                    this.fetchProfile();
                }
            } else {
                this.user = null;
                this.profile = null;
                this.accessToken = null;
                this._saveTokenToStorage(null);
            }
        });
        return this.supabase.auth.getSession().then((res) => {
            const session = (res && res.data && res.data.session) ? res.data.session : (res && res.data) ? res.data : null;
            // If user landed from reset-password email link, URL hash contains type=recovery
            // 若从重置密码邮件链接进入，URL hash 会包含 type=recovery
            if (typeof window !== 'undefined' && window.location && window.location.hash && window.location.hash.includes('type=recovery')) {
                this.pendingPasswordRecovery = true;
            }
            console.log('[MatchReview Debug] auth.init getSession: res keys=', res ? Object.keys(res) : 'null', ', hasSession=', !!session, ', hasUser=', !!(session && session.user));
            if (session && session.user) {
                if (this.pendingPasswordRecovery) {
                    this.user = session.user;
                    this.accessToken = session.access_token || null;
                    this._saveTokenToStorage(this.accessToken);
                    return Promise.resolve();
                }
                if (!session.user.email_confirmed_at) {
                    this.supabase.auth.signOut();
                    this.user = null;
                    this.profile = null;
                    this.accessToken = null;
                    this._saveTokenToStorage(null);
                    return Promise.resolve();
                }
                this.user = session.user;
                this.accessToken = session.access_token || null;
                this._saveTokenToStorage(this.accessToken);
                console.log('[MatchReview Debug] auth.init: set user.id=', this.user?.id, ', tokenLen=', this.accessToken ? this.accessToken.length : 0);
                return this.fetchProfile();
            }
            this.accessToken = null;
            this._saveTokenToStorage(null);
            return Promise.resolve();
        });
    },

    async fetchProfile() {
        if (!this.supabase || !this.user) return null;
        const { data, error } = await this.supabase
            .from('profiles')
            .select('id, email, role, credits')
            .eq('id', this.user.id)
            .single();
        if (error) {
            console.warn('Failed to fetch profile:', error);
            return null;
        }
        this.profile = data;
        return data;
    },

    // Storage key for token fallback (avoids relying on getSession() return shape)
    _TOKEN_KEY: 'supabase_access_token',

    _tokenFromResult(res) {
        if (!res) return null;
        if (typeof res === 'string') return res;
        if (res.access_token) return res.access_token;
        const s = res.data?.session ?? res.session ?? (res.data && typeof res.data.access_token === 'string' ? res.data : null);
        return (s && s.access_token) ? s.access_token : (res.data && res.data.access_token) ? res.data.access_token : null;
    },

    _saveTokenToStorage(token) {
        try {
            if (token) window.sessionStorage.setItem(this._TOKEN_KEY, token);
            else window.sessionStorage.removeItem(this._TOKEN_KEY);
        } catch (e) {}
    },

    async getToken() {
        if (this.accessToken) {
            console.log('[MatchReview Debug] getToken: from cache, len=', this.accessToken.length);
            return this.accessToken;
        }
        try {
            const stored = window.sessionStorage && window.sessionStorage.getItem(this._TOKEN_KEY);
            if (stored) {
                this.accessToken = stored;
                console.log('[MatchReview Debug] getToken: from sessionStorage, len=', stored.length);
                return stored;
            }
        } catch (e) {}
        if (!this.supabase) {
            console.log('[MatchReview Debug] getToken: no supabase, return null');
            return null;
        }
        const result = await this.supabase.auth.getSession();
        let token = this._tokenFromResult(result);
        if (!token && this.user) {
            const refresh = await this.supabase.auth.refreshSession();
            token = this._tokenFromResult(refresh);
        }
        if (token) {
            this.accessToken = token;
            this._saveTokenToStorage(token);
            console.log('[MatchReview Debug] getToken: from getSession/refresh, len=', token.length);
        } else {
            console.log('[MatchReview Debug] getToken: getSession returned no token, result keys=', result ? Object.keys(result) : 'null');
        }
        return token;
    },

    isLoggedIn() {
        return !!this.user;
    },

    getEmail() {
        return this.user?.email || this.profile?.email || '';
    },

    getRole() {
        return this.profile?.role || 'User';
    },

    getCredits() {
        return this.profile?.credits != null ? this.profile.credits : 0;
    },

    async login(email, password) {
        if (!this.supabase) throw new Error('Supabase not configured');
        const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        this.user = data.user;
        this.accessToken = (data.session && data.session.access_token) || null;
        this._saveTokenToStorage(this.accessToken);
        await this.fetchProfile();
        return data;
    },

    async register(email, password) {
        if (!this.supabase) throw new Error('Supabase not configured');
        // After email confirmation, redirect to confirm-thanks.html (must be in Supabase Redirect URLs)
        // 邮箱确认后跳转到 confirm-thanks.html（该地址须在 Supabase Redirect URLs 中）
        let emailRedirectTo;
        if (typeof window !== 'undefined' && window.location) {
            const origin = window.location.origin;
            const path = (window.location.pathname || '/');
            const basePath = path.substring(0, path.lastIndexOf('/') + 1);
            emailRedirectTo = origin + basePath + 'confirm-thanks.html';
        }
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: emailRedirectTo ? { emailRedirectTo } : {}
        });
        if (error) throw error;
        // If email confirmation is required and not yet confirmed, do not stay logged in
        // 若需要邮件确认且尚未确认，则不保持登录状态
        if (data.user && !data.user.email_confirmed_at) {
            await this.supabase.auth.signOut();
            this.user = null;
            this.profile = null;
            return { needsConfirmation: true };
        }
        this.user = data.user;
        await this.fetchProfile();
        return data;
    },

    async logout() {
        if (this.supabase) await this.supabase.auth.signOut();
        this.user = null;
        this.profile = null;
        this.accessToken = null;
        this._saveTokenToStorage(null);
        this.pendingPasswordRecovery = false;
    },

    /**
     * Send password reset email to the given address.
     * 向指定邮箱发送重置密码邮件。
     * @param {string} email - User email / 用户邮箱
     * @param {object} [options] - { redirectTo } URL to open after user clicks the link / 用户点击链接后打开的 URL
     */
    async resetPasswordForEmail(email, options = {}) {
        if (!this.supabase) throw new Error('Supabase not configured');
        // Redirect to dedicated reset-password page (must be in Supabase Redirect URLs)
        // 跳转到专用重置密码页面（该地址须在 Supabase Redirect URLs 中）
        let redirectTo = options.redirectTo;
        if (!redirectTo && typeof window !== 'undefined' && window.location) {
            const origin = window.location.origin;
            let path = (window.location.pathname || '/');
            if (path.indexOf('reset-password.html') !== -1) path = path.replace(/reset-password\.html.*$/, '');
            path = path.replace(/\/[^/]*$/, '/') || '/';
            redirectTo = origin + path + (path.endsWith('/') ? 'reset-password.html' : '/reset-password.html');
        }
        const { error } = await this.supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;
    },

    /**
     * Update current user's password (e.g. after recovery). Must be called while session is in recovery.
     * 更新当前用户密码（如恢复流程后）。须在恢复会话状态下调用。
     * @param {string} newPassword - New password / 新密码
     */
    async updatePassword(newPassword) {
        if (!this.supabase) throw new Error('Supabase not configured');
        const { data, error } = await this.supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        this.pendingPasswordRecovery = false;
        this.user = data?.user ?? this.user;
        await this.fetchProfile();
        return data;
    }
};
