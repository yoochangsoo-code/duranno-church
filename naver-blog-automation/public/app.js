/**
 * app.js - 네이버 블로그 여행 전문 자동화 프론트엔드 대시보드 스크립트
 * 
 * [교육용 상세 설명]
 * 이 스크립트는 Express 백엔드 API와 통신하여
 * 1. '다른 주제 직접 입력' 체크 여부에 따른 입력창 동적 제어
 * 2. 중점 여행지(2배 가중치) 설정 저장 및 불러오기
 * 3. 5대 여행 테마 기반 즉시 포스팅 트리거
 * 4. 카테고리별 포스팅 실행 이력 로그 모니터링을 담당합니다.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM 요소 참조
  const schedulerBadge = document.getElementById('schedulerStatusBadge');
  const toggleSchedulerBtn = document.getElementById('toggleSchedulerBtn');
  const openBrowserBtn = document.getElementById('openBrowserBtn');
  const btnPostNow = document.getElementById('btnPostNow');
  const postNowSpinner = document.getElementById('postNowSpinner');
  const customTopicEnabled = document.getElementById('customTopicEnabled');
  const instantKeyword = document.getElementById('instantKeyword');
  const topicModeNotice = document.getElementById('topicModeNotice');
  const instantPostResult = document.getElementById('instantPostResult');

  const configForm = document.getElementById('configForm');
  const priorityDestinations = document.getElementById('priorityDestinations');
  const naverId = document.getElementById('naverId');
  const naverPw = document.getElementById('naverPw');
  const aiProvider = document.getElementById('aiProvider');
  const aiApiKey = document.getElementById('aiApiKey');
  const cronSchedule = document.getElementById('cronSchedule');

  const btnRefreshLogs = document.getElementById('btnRefreshLogs');
  const logsTableBody = document.getElementById('logsTableBody');

  // '다른 주제' 체크박스 토글 핸들러
  function handleCustomTopicToggle() {
    if (customTopicEnabled.checked) {
      instantKeyword.disabled = false;
      instantKeyword.placeholder = '직접 포스팅할 여행 주제를 입력하세요 (예: 치앙마이 한 달 살기 꿀팁)';
      topicModeNotice.innerHTML = `✍️ <strong>현재 모드</strong>: 직접 입력한 주제로 포스팅합니다.`;
      topicModeNotice.style.color = '#38bdf8';
    } else {
      instantKeyword.disabled = true;
      instantKeyword.value = '';
      instantKeyword.placeholder = '다른 주제 체크 시에만 활성화됩니다';
      topicModeNotice.innerHTML = `🧭 <strong>현재 모드</strong>: 5대 여행 테마 자동 선정 (중점 여행지 2배 가중치 적용)`;
      topicModeNotice.style.color = '#10b981';
    }
  }

  customTopicEnabled.addEventListener('change', handleCustomTopicToggle);

  // 1. 초기 데이터 로드 (설정 및 로그)
  loadConfig();
  loadLogs();

  // --------------------------------------------------------------------------
  // API 함수들
  // --------------------------------------------------------------------------

  // 현재 설정 불러오기
  async function loadConfig() {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();

      if (data.success && data.config) {
        const c = data.config;
        naverId.value = c.naverId || 'cbsctour';
        naverPw.value = c.encryptedNaverPw || '';
        aiProvider.value = c.aiProvider || 'mock';
        aiApiKey.value = c.encryptedAiApiKey || '';
        cronSchedule.value = c.cronSchedule || '0 10 * * *';
        priorityDestinations.value = (c.priorityDestinations || ['서안', '방콕', '바르셀로나', '교토']).join(', ');

        customTopicEnabled.checked = !!c.customTopicEnabled;
        if (c.customTopicEnabled && c.customTopic) {
          instantKeyword.value = c.customTopic;
        }
        handleCustomTopicToggle();

        updateSchedulerBadge(c.isEnabled);
      }
    } catch (err) {
      console.error('설정 불러오기 실패:', err);
    }
  }

  // 포스팅 실행 이력 로그 불러오기
  async function loadLogs() {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();

      if (data.success && data.logs) {
        renderLogsTable(data.logs);
      }
    } catch (err) {
      console.error('로그 불러오기 실패:', err);
    }
  }

  // 로그 테이블 렌더링
  function renderLogsTable(logs) {
    if (!logs || logs.length === 0) {
      logsTableBody.innerHTML = `<tr><td colspan="6" class="text-center empty-msg">아직 실행된 포스팅 이력이 없습니다.</td></tr>`;
      return;
    }

    logsTableBody.innerHTML = logs.map(log => {
      const isSuccess = log.status === 'SUCCESS';
      const badgeClass = isSuccess ? 'badge-success' : 'badge-fail';
      const statusText = isSuccess ? '성공' : '실패';
      const cat = log.category || '여행 and 이야기';

      let catBadgeColor = '#38bdf8';
      if (cat === '사진과 생각') catBadgeColor = '#10b981';
      if (cat === '여행도 장비빨') catBadgeColor = '#f59e0b';

      return `
        <tr>
          <td>${log.timestamp}</td>
          <td><strong>${escapeHtml(log.keyword)}</strong></td>
          <td><span style="display:inline-block; padding:3px 8px; border-radius:12px; font-size:11px; background: rgba(255,255,255,0.08); color:${catBadgeColor}; font-weight:600;">${escapeHtml(cat)}</span></td>
          <td>${escapeHtml(log.title)}</td>
          <td><span class="badge ${badgeClass}">${statusText}</span></td>
          <td>${escapeHtml(log.message)}</td>
        </tr>
      `;
    }).join('');
  }

  // HTML 이스케이프 유틸리티
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // 스케줄러 배지 UI 업데이트
  function updateSchedulerBadge(isEnabled) {
    const dot = schedulerBadge.querySelector('.status-dot');
    const text = schedulerBadge.querySelector('.status-text');

    if (isEnabled) {
      dot.className = 'status-dot active';
      text.textContent = '스케줄러 작동 중';
      toggleSchedulerBtn.textContent = '⏸️ 스케줄러 일시정지';
    } else {
      dot.className = 'status-dot inactive';
      text.textContent = '스케줄러 일시정지됨';
      toggleSchedulerBtn.textContent = '🚀 스케줄러 시작';
    }
  }

  // --------------------------------------------------------------------------
  // 이벤트 리스너 설정
  // --------------------------------------------------------------------------

  // 설정 저장 폼 제출
  configForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const destArray = priorityDestinations.value.split(',').map(d => d.trim()).filter(d => d.length > 0);

    const payload = {
      naverId: naverId.value.trim(),
      naverPw: naverPw.value,
      aiProvider: aiProvider.value,
      aiApiKey: aiApiKey.value,
      cronSchedule: cronSchedule.value,
      priorityDestinations: destArray,
      customTopicEnabled: customTopicEnabled.checked,
      customTopic: instantKeyword.value.trim()
    };

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        alert('설정이 안전하게 저장되었습니다!');
        loadConfig();
      } else {
        alert(`저장 실패: ${data.message}`);
      }
    } catch (err) {
      alert(`오류가 발생했습니다: ${err.message}`);
    }
  });

  // 즉시 포스팅 실행 버튼 클릭
  btnPostNow.addEventListener('click', async () => {
    const isCustom = customTopicEnabled.checked;
    const kw = isCustom ? instantKeyword.value.trim() : '';

    if (isCustom && !kw) {
      alert('다른 주제 직접 입력 모드가 켜져 있습니다. 주제를 입력해 주세요!');
      instantKeyword.focus();
      return;
    }

    // 로딩 상태 시작
    btnPostNow.disabled = true;
    postNowSpinner.classList.remove('hidden');
    instantPostResult.className = 'alert-box hidden';

    // 먼저 현재 체크 상태 및 입력 주제 저장
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customTopicEnabled: isCustom,
          customTopic: kw
        })
      });
    } catch (e) {}

    try {
      const res = await fetch('/api/post/now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: kw })
      });
      const data = await res.json();

      if (data.success) {
        instantPostResult.className = 'alert-box success';
        instantPostResult.textContent = `🎉 포스팅 성공! ${data.message}`;
      } else {
        instantPostResult.className = 'alert-box error';
        instantPostResult.textContent = `❌ 포스팅 실패: ${data.message}`;
      }
    } catch (err) {
      instantPostResult.className = 'alert-box error';
      instantPostResult.textContent = `통신 에러: ${err.message}`;
    } finally {
      btnPostNow.disabled = false;
      postNowSpinner.classList.add('hidden');
      loadLogs();
    }
  });

  // 스케줄러 토글 버튼
  toggleSchedulerBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/scheduler/toggle', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        updateSchedulerBadge(data.isEnabled);
      }
    } catch (err) {
      alert(`스케줄러 전환 실패: ${err.message}`);
    }
  });

  // 브라우저 열기 버튼
  openBrowserBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/browser/open', { method: 'POST' });
      const data = await res.json();
      alert(data.message || '브라우저 창이 열렸습니다.');
    } catch (err) {
      alert(`브라우저 열기 실패: ${err.message}`);
    }
  });

  // 로그 새로고침 버튼
  btnRefreshLogs.addEventListener('click', () => {
    loadLogs();
  });
});
