import fs from 'fs';
import path from 'path';

// 원래 크롬 쿠키 파일 복사본 검사
const origCookies = 'C:\\Users\\hp\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Network\\Cookies';
const targetCookies = path.join(process.cwd(), 'data', 'naver_user_data', 'Default', 'Network', 'Cookies');

console.log('원본 크롬 쿠키 크기:', fs.existsSync(origCookies) ? fs.statSync(origCookies).size : '없음');
console.log('자동화 크롬 쿠키 크기:', fs.existsSync(targetCookies) ? fs.statSync(targetCookies).size : '없음');

// 바이너리 검색으로 NID_AUT 문자열이 있는지 확인
if (fs.existsSync(origCookies)) {
  try {
    const buf = fs.readFileSync(origCookies);
    console.log('원본 크롬에 NID_AUT 포함 여부:', buf.includes(Buffer.from('NID_AUT')));
    console.log('원본 크롬에 NID_SES 포함 여부:', buf.includes(Buffer.from('NID_SES')));
  } catch (e: any) {
    console.log('원본 읽기 에러:', e.message);
  }
}

if (fs.existsSync(targetCookies)) {
  const buf = fs.readFileSync(targetCookies);
  console.log('자동화 크롬에 NID_AUT 포함 여부:', buf.includes(Buffer.from('NID_AUT')));
  console.log('자동화 크롬에 NID_SES 포함 여부:', buf.includes(Buffer.from('NID_SES')));
}
