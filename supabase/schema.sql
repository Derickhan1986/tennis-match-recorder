--
-- Supabase schema for Tennis Match Recorder (user auth, credits, per-user data)
-- 网球比赛记录器 Supabase 表结构（用户认证、积分、按用户数据）
--
-- Run this in Supabase SQL Editor after creating a project.
-- 在 Supabase 控制台创建项目后，在 SQL Editor 中执行此文件。
--

-- Enable UUID extension if not already
-- 启用 UUID 扩展（若尚未启用）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles: extends Supabase Auth (email, role, credits)
-- 用户资料：扩展 Supabase Auth（邮箱、角色、积分）
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'User' CHECK (role IN ('Admin', 'Pro', 'User')),
    credits INT NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User data: one row per user (players + matches snapshot)
-- 用户数据：每用户一行（players + matches 快照）
CREATE TABLE IF NOT EXISTS public.user_data (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    players_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    matches_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NULL
);

-- RLS: users can only read/write their own profile and user_data
-- RLS：用户只能读写自己的 profile 和 user_data
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can read own user_data"
    ON public.user_data FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user_data"
    ON public.user_data FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_data"
    ON public.user_data FOR UPDATE
    USING (auth.uid() = user_id);

-- Trigger: create profile on signup (run after first user signs up or create Admin manually)
-- 触发器：注册时自动创建 profile（首个用户注册后执行，或手动创建 Admin）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, credits)
    VALUES (
        NEW.id,
        NEW.email,
        'User',
        10
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Optional: seed one Admin (replace with your email and run once)
-- 可选：手动创建一个 Admin（将邮箱改为你的邮箱后执行一次）
-- INSERT INTO public.profiles (id, email, role, credits)
-- SELECT id, email, 'Admin', 0 FROM auth.users WHERE email = 'your-admin@example.com'
-- ON CONFLICT (id) DO UPDATE SET role = 'Admin', credits = 0;
