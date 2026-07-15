import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { encryptData } from '../lib/crypto';
import { Shield, Key, Mail, Phone, UserPlus } from 'lucide-react';

interface AuthViewProps {
  onAuthSuccess: (email: string, role: string) => void;
}

export default function AuthView({ onAuthSuccess }: AuthViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const cryptoSecret = 'church-encryption-key-shared'; // 실제 상용화 시 env 환경변수 사용 권장

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        // 1. 회원가입 프로세스
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData.user) {
          // 2. 이름, 전화번호 보안 암호화 (사용자 룰 8번 적용)
          const nameEncrypted = encryptData(name, cryptoSecret);
          const phoneEncrypted = encryptData(phone, cryptoSecret);

          // 3. profiles 테이블 적재
          const { error: profileError } = await supabase.from('profiles').insert([
            {
              id: authData.user.id,
              name_encrypted: nameEncrypted,
              phone_encrypted: phoneEncrypted,
              role: 'guest', // 신규 가입자는 무조건 'guest' (관리자 승인 대기)
            },
          ]);

          if (profileError) throw profileError;
          setMessage('회원가입이 완료되었습니다! 교회의 가입 승인을 기다려 주세요.');
        }
      } else {
        // 로그인 프로세스
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData.user) {
          // 역할 조회
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authData.user.id)
            .maybeSingle();

          const role = profile?.role || 'guest';
          onAuthSuccess(email, role);
        }
      }
    } catch (err: any) {
      console.error(err);
      setMessage(`에러: ${err.message || '인증 오류가 발생했습니다.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="church-container" style={{ padding: '60px 20px', maxWidth: '450px' }}>
      <div className="church-card" style={{ padding: '40px 30px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Shield size={40} style={{ color: 'var(--church-gold)', marginBottom: '10px' }} />
          <h3 className="font-serif" style={{ fontSize: '1.5rem', color: 'var(--church-navy)', margin: 0 }}>
            {isSignUp ? '성도 회원가입' : '교인 로그인'}
          </h3>
          <p style={{ color: 'var(--church-text-muted)', fontSize: '0.88rem', marginTop: '6px' }}>
            {isSignUp ? '정보는 철저히 암호화되어 안전하게 관리됩니다.' : '은혜와평강교회 온라인 소식지'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--church-text-muted)' }} />
            <input
              type="email"
              placeholder="이메일 주소"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="church-input"
              style={{ paddingLeft: '40px' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Key size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--church-text-muted)' }} />
            <input
              type="password"
              placeholder="비밀번호 (6자 이상)"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="church-input"
              style={{ paddingLeft: '40px' }}
            />
          </div>

          {isSignUp && (
            <>
              <div style={{ position: 'relative' }}>
                <UserPlus size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--church-text-muted)' }} />
                <input
                  type="text"
                  placeholder="성함 (실명)"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="church-input"
                  style={{ paddingLeft: '40px' }}
                />
              </div>

              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--church-text-muted)' }} />
                <input
                  type="text"
                  placeholder="연락처 (예: 01012345678)"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="church-input"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </>
          )}

          {message && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'hsl(35, 30%, 93%)',
              border: '1px solid var(--church-beige-dark)',
              borderRadius: '6px',
              fontSize: '0.85rem',
              color: 'var(--church-text-dark)',
              lineHeight: '1.4'
            }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="church-btn church-btn-primary"
            style={{ width: '100%', height: '46px', marginTop: '10px' }}
          >
            {loading ? '처리 중...' : isSignUp ? '회원가입 신청' : '로그인'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem' }}>
          {isSignUp ? (
            <p style={{ color: 'var(--church-text-muted)', margin: 0 }}>
              이미 계정이 있으신가요?{' '}
              <span
                onClick={() => setIsSignUp(false)}
                style={{ color: 'var(--church-gold)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                로그인하기
              </span>
            </p>
          ) : (
            <p style={{ color: 'var(--church-text-muted)', margin: 0 }}>
              처음 방문하셨나요?{' '}
              <span
                onClick={() => setIsSignUp(true)}
                style={{ color: 'var(--church-gold)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                교인 회원가입
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
