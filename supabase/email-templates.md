# Supabase 邮件模板与感谢页
# Supabase Email Templates and Thank You Page

## 1. Confirm signup 邮件模板（粘贴到 Supabase）

在 Supabase 控制台：**Authentication** → **Email Templates** → 选择 **Confirm signup**，将 **Message body** 替换为下面内容（保留 Subject 或改成你喜欢的主旨）。

---

**Subject（主旨，可选）：**
```
Confirm your email - Tennis Match Recorder
```

**Message body（正文）：**
```html
<h2>Confirm your email</h2>

<p>You (or someone) signed up for Tennis Match Recorder with this email address.</p>

<p><strong>If this was you:</strong> Please click the link below to confirm your account and start using the app.</p>
<p><a href="{{ .ConfirmationURL }}" style="display:inline-block; padding:10px 20px; background:#1a472a; color:#fff; text-decoration:none; border-radius:8px;">Confirm my email</a></p>

<p><strong>If this was not you:</strong> You can safely ignore this email. No account will be created without confirming.</p>

<p style="color:#666; font-size:12px;">This link will expire in 24 hours. If you did not sign up, no action is needed.</p>
```

---

说明：`{{ .ConfirmationURL }}` 是 Supabase 变量，不要改。点击链接后 Supabase 会验证并跳转到你设置的 **Site URL**；若将 Site URL 设为感谢页地址，用户会看到感谢页。

---

## 2. 感谢页地址（Site URL）设置

1. 在项目里已添加 **confirm-thanks.html**（见下方）。部署后该页地址为：  
   `https://你的域名/confirm-thanks.html`  
   例如 GitHub Pages：`https://你的用户名.github.io/tennis-match-recorder/confirm-thanks.html`

2. 在 Supabase：**Authentication** → **URL Configuration**：
   - **Site URL** 填：`https://你的域名/confirm-thanks.html`（与上面一致）
   - **Redirect URLs** 里可添加：`https://你的域名/**` 或具体地址，以便确认后能跳转

3. 用户点击邮件中的“Confirm my email”后，会先到 Supabase 验证，再跳转到感谢页；从感谢页点“Go to App”进入应用。

---

## 3. Reset password 邮件模板（可选 / Optional）

**Reset password** 使用 Supabase 默认模板即可：`{{ .ConfirmationURL }}` 会变成正确的重置链接，用户点击后会被重定向回你的应用并显示“设置新密码”表单。  
若希望与 **Confirm signup** 风格一致（应用名、按钮样式、说明），可在 Supabase：**Authentication** → **Email Templates** → **Reset password** 中把 **Message body** 替换为下面内容。

**You can leave the default Reset password template as is**—the link works. The following is optional, for consistent branding with Confirm signup.

---

**Subject（主旨，可选）：**
```
Reset your password - Tennis Match Recorder
```

**Message body（正文）：**
```html
<h2>Reset your password</h2>

<p>You (or someone) requested a password reset for Tennis Match Recorder with this email address.</p>

<p><strong>If this was you:</strong> Click the link below to set a new password.</p>
<p><a href="{{ .ConfirmationURL }}" style="display:inline-block; padding:10px 20px; background:#1a472a; color:#fff; text-decoration:none; border-radius:8px;">Reset password</a></p>

<p><strong>If this was not you:</strong> You can safely ignore this email. Your password will not be changed.</p>

<p style="color:#666; font-size:12px;">This link will expire in 1 hour. If you did not request a reset, no action is needed.</p>
```

---

说明：`{{ .ConfirmationURL }}` 是 Supabase 变量，不要改。用户点击后会被重定向到你在 **Redirect URLs** 中配置的应用地址，应用会显示“设置新密码”表单。
