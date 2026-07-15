import { supabase } from '../lib/supabaseClient';

// ----------------------------------------------------
// 1. 설교 (Sermons) 관련 서비스
// ----------------------------------------------------

export interface Sermon {
  id?: string;
  title: string;
  youtube_video_id: string;
  preacher: string;
  passage?: string;
  preached_at: string;
  created_at?: string;
}

/**
 * 최신 설교 영상 목록을 가져옵니다.
 */
export async function getSermons(): Promise<Sermon[]> {
  const { data, error } = await supabase
    .from('sermons')
    .select('*')
    .order('preached_at', { ascending: false });

  if (error) {
    console.error('설교 조회 오류:', error);
    throw error;
  }
  return data || [];
}

/**
 * 새로운 설교 영상을 데이터베이스에 등록합니다.
 */
export async function addSermon(sermon: Sermon): Promise<Sermon> {
  const { data, error } = await supabase
    .from('sermons')
    .insert([sermon])
    .select()
    .single();

  if (error) {
    console.error('설교 등록 오류:', error);
    throw error;
  }
  return data;
}

// ----------------------------------------------------
// 2. 주보 (Bulletins) 관련 서비스
// ----------------------------------------------------

export interface Bulletin {
  id?: string;
  title: string;
  file_url: string;
  published_at: string;
  created_at?: string;
}

/**
 * 최신 주보 목록을 가져옵니다. (로그인 성도 권한 필요)
 */
export async function getBulletins(): Promise<Bulletin[]> {
  const { data, error } = await supabase
    .from('bulletins')
    .select('*')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('주보 조회 오류:', error);
    throw error;
  }
  return data || [];
}

/**
 * 새로운 주보를 등록합니다.
 */
export async function addBulletin(bulletin: Bulletin): Promise<Bulletin> {
  const { data, error } = await supabase
    .from('bulletins')
    .insert([bulletin])
    .select()
    .single();

  if (error) {
    console.error('주보 등록 오류:', error);
    throw error;
  }
  return data;
}

// ----------------------------------------------------
// 3. 공지사항 (Notices) 관련 서비스
// ----------------------------------------------------

export interface Notice {
  id?: string;
  title: string;
  content: string;
  is_pinned: boolean;
  author_id?: string;
  created_at?: string;
}

/**
 * 공지사항 목록을 가져옵니다. (상단 고정글 우선, 최신글 순)
 */
export async function getNotices(): Promise<Notice[]> {
  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('공지사항 조회 오류:', error);
    throw error;
  }
  return data || [];
}

/**
 * 새로운 공지사항을 등록합니다.
 */
export async function addNotice(notice: Notice): Promise<Notice> {
  const { data, error } = await supabase
    .from('notices')
    .insert([notice])
    .select()
    .single();

  if (error) {
    console.error('공지사항 등록 오류:', error);
    throw error;
  }
  return data;
}

// ----------------------------------------------------
// 4. 교회 소개 (Church Info) 관련 서비스
// ----------------------------------------------------

export interface ChurchInfo {
  id?: number;
  pastor_message?: string;
  vision_text?: string;
  history_json?: any;
  address?: string;
  worship_schedule_json?: any;
  updated_at?: string;
}

/**
 * 교회의 기본 정보를 가져옵니다.
 */
export async function getChurchInfo(): Promise<ChurchInfo | null> {
  const { data, error } = await supabase
    .from('church_info')
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('교회 정보 조회 오류:', error);
    throw error;
  }
  return data;
}

/**
 * 교회의 기본 정보를 수정하거나 생성합니다.
 */
export async function updateChurchInfo(info: ChurchInfo): Promise<ChurchInfo> {
  // 이미 정보가 존재하면 update, 없으면 insert 처리
  const existing = await getChurchInfo();

  let query;
  if (existing && existing.id) {
    query = supabase
      .from('church_info')
      .update(info)
      .eq('id', existing.id);
  } else {
    query = supabase
      .from('church_info')
      .insert([info]);
  }

  const { data, error } = await query.select().single();

  if (error) {
    console.error('교회 정보 업데이트 오류:', error);
    throw error;
  }
  return data;
}
