const fs = require('fs');
const data = [
  {
    "id": "1",
    "topic": "서안 성벽 벽돌에 새겨진 비밀",
    "title": "서안 성벽 벽돌에 새겨진 비밀",
    "category": "여행 and 이야기",
    "city": "중국 서안",
    "postedAt": "2026-09-05T21:01:00"
  },
  {
    "id": "2",
    "topic": "14km 성벽 벽돌마다 장인의 이름을 새겨 넣었던 서안의 놀라운 비밀",
    "title": "14km 성벽 벽돌마다 장인의 이름을 새겨 넣었던 서안의 놀라운 비밀",
    "category": "여행 and 이야기",
    "city": "중국 서안",
    "postedAt": "2026-09-05T18:41:00"
  },
  {
    "id": "3",
    "topic": "천년의 세월을 품은 교토 골목길",
    "title": "천년의 세월을 품은 교토 골목길에서 마주친 뜻밖의 비밀 이야기",
    "category": "여행 and 이야기",
    "city": "일본 교토",
    "postedAt": "2026-09-05T18:19:00"
  },
  {
    "id": "1788613265693",
    "topic": "가우디가 미완의 성당에 바친 평생의 시간",
    "title": "가우디가 미완의 성당에 바친 평생의 시간",
    "category": "여행 and 이야기",
    "city": "스페인 바르셀로나",
    "postedAt": "2026-09-05T13:01:05.693Z"
  }
];
fs.writeFileSync('data/posted_history.json', JSON.stringify(data, null, 2), 'utf8');
console.log('History fixed. Items:', data.length);
console.log('브루넬레스키 항목 제거 완료');
