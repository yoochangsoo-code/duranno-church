import React from 'react';
import { CreditCard, Heart } from 'lucide-react';

export default function OfferingView() {
  const accounts = [
    { type: '십일조/감사헌금', bank: '은혜은행', number: '123-456-789012', holder: '은혜와평강교회' },
    { type: '선교/장학헌금', bank: '평강은행', number: '987-654-321098', holder: '은혜와평강교회' },
  ];

  return (
    <div className="church-container" style={{ padding: '60px 20px', maxWidth: '800px' }}>
      <h2 className="font-serif" style={{ fontSize: '2.2rem', color: 'var(--church-navy)', marginBottom: '30px', borderBottom: '2px solid var(--church-gold)', paddingBottom: '10px', textAlign: 'center' }}>
        온라인 헌금 안내
      </h2>

      <div style={{
        backgroundColor: 'var(--church-beige)',
        padding: '30px',
        borderRadius: '16px',
        textAlign: 'center',
        marginBottom: '40px',
        border: '1px solid var(--church-beige-dark)'
      }}>
        <Heart size={32} style={{ color: 'var(--church-gold)', marginBottom: '10px' }} />
        <p style={{ fontStyle: 'italic', lineHeight: '1.6', color: 'var(--church-text-dark)', margin: 0 }}>
          “각각 그 마음에 정한 대로 할 것이요 인색함으로나 억지로 하지 말지니 하나님은 즐겨 내는 자를 사랑하시느니라”<br />
          (고린도후서 9:7)
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {accounts.map((acc, index) => (
          <div key={index} className="church-card" style={{ padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                backgroundColor: 'hsl(36, 45%, 93%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--church-gold)'
              }}>
                <CreditCard size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--church-gold)', fontWeight: 'bold' }}>{acc.type}</span>
                <h4 className="font-serif" style={{ fontSize: '1.2rem', color: 'var(--church-navy)', margin: '4px 0 0 0' }}>
                  {acc.bank} <span style={{ fontFamily: 'monospace' }}>{acc.number}</span>
                </h4>
                <span style={{ fontSize: '0.85rem', color: 'var(--church-text-muted)' }}>예금주: {acc.holder}</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                navigator.clipboard.writeText(acc.number);
                alert('계좌번호가 복사되었습니다.');
              }}
              className="church-btn church-btn-outline"
              style={{ fontSize: '0.85rem', padding: '8px 16px' }}
            >
              계좌 복사하기
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '40px', fontSize: '0.88rem', color: 'var(--church-text-muted)', lineHeight: '1.6' }}>
        <p>※ 헌금 송금 시 본인 확인을 위해 실명과 직분을 함께 적어주시기 바랍니다. (예: 홍길동성도, 이영희집사)</p>
        <p>※ 기부금 영수증 발급을 원하시는 분은 연말에 교회 행정실로 문의해 주시기 바랍니다.</p>
      </div>
    </div>
  );
}
