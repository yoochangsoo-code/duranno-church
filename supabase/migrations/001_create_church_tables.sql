-- 001_create_church_tables.sql
-- 교회 홈페이지를 위한 데이터베이스 스키마 정의 및 Row Level Security (RLS) 설정

-- 1. 프로필 테이블 (Profiles)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name_encrypted text NOT NULL,        -- 암호화된 성도 실명
  phone_encrypted text NOT NULL,       -- 암호화된 전화번호
  role text DEFAULT 'guest' CHECK (role IN ('guest', 'member', 'manager', 'admin')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 교회 소개 테이블 (Church Info)
CREATE TABLE public.church_info (
  id int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  pastor_message text,
  vision_text text,
  history_json jsonb DEFAULT '[]'::jsonb,
  address text,
  worship_schedule_json jsonb DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. 설교 동영상 테이블 (Sermons)
CREATE TABLE public.sermons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  youtube_video_id text NOT NULL UNIQUE,
  preacher text NOT NULL,
  passage text,
  preached_at date NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. 주보 테이블 (Bulletins)
CREATE TABLE public.bulletins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  file_url text NOT NULL,
  published_at date NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. 공지사항 테이블 (Notices)
CREATE TABLE public.notices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  is_pinned boolean DEFAULT false,
  author_id uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. 행사 사진첩 테이블 (Gallery)
CREATE TABLE public.gallery (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  image_urls jsonb DEFAULT '[]'::jsonb, -- 여러 장의 사진 이미지 주소 배열
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- Row Level Security (RLS) 및 권한 정책 설정
-- =========================================================================

-- 모든 테이블의 RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulletins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- 1. profiles 정책
-- (자신 또는 관리자 등급만 읽기 가능)
CREATE POLICY "자신의 프로필 또는 관리자만 조회 가능" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('manager', 'admin')
  ));

-- (자신의 프로필 정보만 수정 가능)
CREATE POLICY "자신의 프로필만 수정 가능" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- (누구나 신규 가입 시 프로필 생성 가능)
CREATE POLICY "누구나 프로필 생성 가능" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- (관리자만 프로필 삭제 가능)
CREATE POLICY "관리자만 프로필 삭제 가능" ON public.profiles
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));


-- 2. church_info 정책
-- (누구나 교회 소개 조회 가능)
CREATE POLICY "누구나 교회 소개 조회 가능" ON public.church_info
  FOR SELECT USING (true);

-- (관리자만 교회 소개 수정 가능)
CREATE POLICY "관리자만 교회 소개 수정 가능" ON public.church_info
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('manager', 'admin')
  ));


-- 3. sermons 정책
-- (누구나 설교 영상 목록 조회 가능)
CREATE POLICY "누구나 설교 조회 가능" ON public.sermons
  FOR SELECT USING (true);

-- (관리자만 설교 영상 추가/수정/삭제 가능)
CREATE POLICY "관리자만 설교 영상 관리 가능" ON public.sermons
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('manager', 'admin')
  ));


-- 4. bulletins 정책
-- (등록 성도(member) 이상 및 관리자만 주보 조회 가능)
CREATE POLICY "성도 및 관리자만 주보 조회 가능" ON public.bulletins
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('member', 'manager', 'admin')
  ));

-- (관리자만 주보 추가/수정/삭제 가능)
CREATE POLICY "관리자만 주보 관리 가능" ON public.bulletins
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('manager', 'admin')
  ));


-- 5. notices 정책
-- (누구나 공지사항 조회 가능)
CREATE POLICY "누구나 공지사항 조회 가능" ON public.notices
  FOR SELECT USING (true);

-- (관리자 및 부교역자만 공지사항 작성 및 관리 가능)
CREATE POLICY "관리자만 공지사항 작성 및 관리 가능" ON public.notices
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('manager', 'admin')
  ));


-- 6. gallery 정책
-- (누구나 행사 갤러리 조회 가능)
CREATE POLICY "누구나 갤러리 조회 가능" ON public.gallery
  FOR SELECT USING (true);

-- (관리자만 갤러리 관리 가능)
CREATE POLICY "관리자만 갤러리 관리 가능" ON public.gallery
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('manager', 'admin')
  ));
