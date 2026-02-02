//
// Auth module: Supabase login, register, logout, session, profile
// 认证模块：Supabase 登录、注册、登出、会话、资料
//

const auth = {
    supabase: null,
    user: null,
    profile: null,

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
                return;
            }
            if (session && session.user) {
                if (!session.user.email_confirmed_at) {
                    this.supabase.auth.signOut();
                    this.user = null;
                    this.profile = null;
                } else {
                    this.user = session.user;
                    this.fetchProfile();
                }
            } else {
                this.user = null;
                this.profile = null;
            }
        });
        return this.supabase.auth.getSession().then(({ data: { session } }) => {
            if (session && session.user) {
                if (!session.user.email_confirmed_at) {
                    this.supabase.auth.signOut();
                    this.user = null;
                    this.profile = null;
                    return Promise.resolve();
                }
                this.user = session.user;
                return this.fetchProfile();
            }
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

    async getToken() {
        if (!this.supabase) return null;
        const { data: { session } } = await this.supabase.auth.getSession();
        return session?.access_token || null;
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
        await this.fetchProfile();
        return data;
    },

    async register(email, password) {
        if (!this.supabase) throw new Error('Supabase not configured');
        const { data, error } = await this.supabase.auth.signUp({ email, password });
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
        const redirectTo = options.redirectTo || (typeof window !== 'undefined' && window.location ? `${window.location.origin}${window.location.pathname || '/'}`.replace(/\/?$/, '/') : '');
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
