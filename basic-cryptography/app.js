/* ============================================================
   密码学基础考试复习应用 — 核心逻辑
   ============================================================ */

(function () {
  'use strict';

  // ============ State ============
  const state = {
    currentView: 'dashboard',   // 'dashboard' | 'ch1' | 'ch2' ...
    currentMode: 'study',       // 'study' | 'quiz'
    quizState: null,            // { chapterId, questions, currentIndex, answers, submitted }
    progress: loadProgress(),
  };

  // ============ Progress Management ============
  function loadProgress() {
    try {
      const saved = localStorage.getItem('crypto-exam-progress');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem('crypto-exam-progress', JSON.stringify(state.progress));
    } catch { /* ignore quota errors */ }
  }

  function getChapterProgress(chapterId) {
    return state.progress[chapterId] || { completedQuestions: [], bestScore: 0, totalAttempts: 0 };
  }

  function updateChapterProgress(chapterId, questionId, isCorrect) {
    if (!state.progress[chapterId]) {
      state.progress[chapterId] = { completedQuestions: [], bestScore: 0, totalAttempts: 0 };
    }
    const cp = state.progress[chapterId];
    if (isCorrect && !cp.completedQuestions.includes(questionId)) {
      cp.completedQuestions.push(questionId);
    }
    saveProgress();
  }

  function updateBestScore(chapterId, score) {
    if (!state.progress[chapterId]) {
      state.progress[chapterId] = { completedQuestions: [], bestScore: 0, totalAttempts: 0 };
    }
    state.progress[chapterId].totalAttempts++;
    if (score > state.progress[chapterId].bestScore) {
      state.progress[chapterId].bestScore = score;
    }
    saveProgress();
  }

  function resetAllProgress() {
    if (confirm('确定要重置所有学习进度吗？此操作不可撤销。')) {
      state.progress = {};
      saveProgress();
      navigate('dashboard');
      renderNavigation();
    }
  }

  // ============ Theme Management ============
  function initTheme() {
    const saved = localStorage.getItem('crypto-exam-theme');
    const theme = saved || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('crypto-exam-theme', next);
    updateThemeIcon(next);
  }

  function updateThemeIcon(theme) {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '🌙' : '☀️';
  }

  // ============ Navigation ============
  function navigate(view) {
    state.currentView = view;
    state.currentMode = 'study';
    state.quizState = null;

    // Update sidebar active state
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (view === 'dashboard') {
      document.getElementById('nav-dashboard')?.classList.add('active');
    } else {
      document.querySelector(`.nav-item[data-target="${view}"]`)?.classList.add('active');
    }

    // Update breadcrumb
    const bcCurrent = document.getElementById('breadcrumb-current');
    if (view === 'dashboard') {
      bcCurrent.textContent = '学习仪表盘';
    } else {
      const chapter = chapters.find(c => c.id === view);
      if (chapter) bcCurrent.textContent = chapter.title;
    }

    // Show/hide mode switcher
    const ms = document.getElementById('mode-switcher');
    if (ms) ms.style.display = view === 'dashboard' ? 'none' : 'flex';

    // Reset mode buttons
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('mode-study-btn')?.classList.add('active');

    // Close mobile sidebar
    closeSidebar();

    // Render content
    render();
  }

  function switchMode(mode) {
    state.currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.mode-btn[data-mode="${mode}"]`)?.classList.add('active');

    if (mode === 'quiz') {
      startQuiz(state.currentView);
    } else {
      state.quizState = null;
    }

    render();
  }

  // ============ Sidebar ============
  function renderNavigation() {
    const container = document.getElementById('chapter-nav-list');
    if (!container || typeof chapters === 'undefined') return;

    container.innerHTML = chapters.map(ch => {
      const prog = getChapterProgress(ch.id);
      const total = ch.questions ? ch.questions.length : 0;
      const done = prog.completedQuestions.length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;

      return `
        <div class="nav-item" data-target="${ch.id}" data-chapter="${ch.id}" id="nav-${ch.id}">
          <div class="nav-icon">${ch.icon}</div>
          <div class="nav-label">${ch.title}</div>
          ${total > 0 ? `<div class="nav-badge">${pct}%</div>` : ''}
        </div>
      `;
    }).join('');

    // Bind events
    container.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => navigate(item.dataset.target));
    });
  }

  function openSidebar() {
    document.getElementById('sidebar')?.classList.add('open');
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) {
      overlay.style.display = 'block';
      requestAnimationFrame(() => overlay.classList.add('visible'));
    }
  }

  function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.style.display = 'none', 250);
    }
  }

  // ============ Render Router ============
  function render() {
    const area = document.getElementById('content-area');
    if (!area) return;

    if (state.currentView === 'dashboard') {
      renderDashboard(area);
    } else if (state.currentMode === 'quiz') {
      renderQuiz(area);
    } else {
      renderChapterStudy(area);
    }

    // Re-render KaTeX
    renderMath(area);
  }

  function renderMath(container) {
    if (typeof renderMathInElement === 'function') {
      try {
        renderMathInElement(container, {
          delimiters: [
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true },
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      } catch { /* ignore render errors */ }
    }
  }

  // ============ Dashboard View ============
  function renderDashboard(area) {
    const totalQuestions = chapters.reduce((sum, ch) => sum + (ch.questions ? ch.questions.length : 0), 0);
    const totalCompleted = chapters.reduce((sum, ch) => {
      const prog = getChapterProgress(ch.id);
      return sum + prog.completedQuestions.length;
    }, 0);
    const totalAttempts = chapters.reduce((sum, ch) => {
      const prog = getChapterProgress(ch.id);
      return sum + prog.totalAttempts;
    }, 0);
    const overallPct = totalQuestions > 0 ? Math.round((totalCompleted / totalQuestions) * 100) : 0;

    area.innerHTML = `
      <div class="dashboard" data-active-chapter="">
        <div class="dashboard-greeting">
          <h1>📚 密码学基础复习</h1>
          <p>系统地复习课程核心知识点，通过自测检验掌握程度</p>
        </div>

        <!-- Overall Stats -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-value">${overallPct}%</div>
            <div class="stat-label">总体掌握度</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${totalCompleted}/${totalQuestions}</div>
            <div class="stat-label">已掌握题目</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${totalAttempts}</div>
            <div class="stat-label">练习次数</div>
          </div>
        </div>

        <!-- Chapter Cards -->
        <div class="nav-section-title" style="padding-left:0">各章节进度</div>
        <div class="progress-grid">
          ${chapters.map(ch => {
            const prog = getChapterProgress(ch.id);
            const total = ch.questions ? ch.questions.length : 0;
            const done = prog.completedQuestions.length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;

            return `
              <div class="progress-card" data-chapter="${ch.id}" onclick="window.__navigate('${ch.id}')">
                <div class="progress-card-icon">${ch.icon}</div>
                <div class="progress-card-title">${ch.title}</div>
                <div class="progress-card-value">${pct}%</div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width: ${pct}%"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Animate progress bars
    setTimeout(() => {
      area.querySelectorAll('.progress-bar-fill').forEach(bar => {
        bar.style.width = bar.style.width; // trigger reflow for animation
      });
    }, 50);
  }

  // ============ Chapter Study View ============
  function renderChapterStudy(area) {
    const chapter = chapters.find(c => c.id === state.currentView);
    if (!chapter) {
      area.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">章节未找到</div></div>';
      return;
    }

    const prog = getChapterProgress(chapter.id);
    const total = chapter.questions ? chapter.questions.length : 0;
    const done = prog.completedQuestions.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const sectionsHTML = chapter.sections ? chapter.sections.map((section, idx) => `
      <div class="knowledge-card ${idx === 0 ? 'expanded' : ''}" id="section-${idx}">
        <div class="knowledge-card-header" onclick="window.__toggleCard(this)">
          <div class="knowledge-card-title">
            <span>${section.title}</span>
          </div>
          <div class="knowledge-card-toggle">▼</div>
        </div>
        <div class="knowledge-card-body">
          <div class="knowledge-card-content">
            ${section.content}
            ${section.keyPoints && section.keyPoints.length > 0 ? `
              <div class="key-points">
                ${section.keyPoints.map(kp => `<span class="key-point-tag">${kp}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `).join('') : '';

    area.innerHTML = `
      <div class="chapter-view" data-active-chapter="${chapter.id}">
        <div class="chapter-header" data-chapter="${chapter.id}">
          <div class="chapter-header-icon">${chapter.icon}</div>
          <h2>${chapter.title}</h2>
          <p>${chapter.sections ? chapter.sections.length : 0} 个知识模块 · ${total} 道练习题</p>
          <div class="chapter-progress-inline">
            <span class="chapter-progress-label">掌握进度</span>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${pct}%"></div>
            </div>
            <span class="chapter-progress-label">${pct}%</span>
          </div>
        </div>

        <!-- Mobile mode switcher -->
        <div class="mobile-mode-switcher mode-switcher" style="display: none;">
          <button class="mode-btn active" data-mode="study" onclick="window.__switchMode('study')">📖 知识浏览</button>
          <button class="mode-btn" data-mode="quiz" onclick="window.__switchMode('quiz')">✏️ 自测练习</button>
        </div>

        <div class="knowledge-section">
          ${sectionsHTML}
        </div>

        ${total > 0 ? `
          <div style="text-align: center; margin-top: var(--space-8);">
            <button class="btn btn-primary btn-lg" onclick="window.__switchMode('quiz')">
              ✏️ 开始自测练习 (${total} 题)
            </button>
          </div>
        ` : ''}
      </div>
    `;

    // Show mobile mode switcher
    if (window.innerWidth <= 768) {
      const mms = area.querySelector('.mobile-mode-switcher');
      if (mms) mms.style.display = 'flex';
    }
  }

  // ============ Quiz Engine ============
  function startQuiz(chapterId) {
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter || !chapter.questions || chapter.questions.length === 0) return;

    // Shuffle questions
    const shuffled = [...chapter.questions].sort(() => Math.random() - 0.5);

    state.quizState = {
      chapterId,
      questions: shuffled,
      currentIndex: 0,
      answers: new Array(shuffled.length).fill(null),
      results: new Array(shuffled.length).fill(null), // null | true | false
      submitted: new Array(shuffled.length).fill(false),
      finished: false
    };
  }

  function renderQuiz(area) {
    const qs = state.quizState;
    if (!qs) {
      area.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-title">暂无题目</div></div>';
      return;
    }

    if (qs.finished) {
      renderQuizResults(area);
      return;
    }

    const chapter = chapters.find(c => c.id === qs.chapterId);
    const q = qs.questions[qs.currentIndex];
    const answered = qs.submitted[qs.currentIndex];
    const correct = qs.results.filter(r => r === true).length;
    const wrong = qs.results.filter(r => r === false).length;

    let optionsHTML = '';

    if (q.type === 'choice') {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      optionsHTML = `
        <div class="quiz-options">
          ${q.options.map((opt, idx) => {
            let classes = 'quiz-option';
            if (answered) {
              classes += ' disabled';
              if (idx === q.answer) classes += ' correct';
              else if (qs.answers[qs.currentIndex] === idx && idx !== q.answer) classes += ' wrong';
            } else if (qs.answers[qs.currentIndex] === idx) {
              classes += ' selected';
            }
            return `
              <div class="${classes}" onclick="window.__selectOption(${idx})" data-idx="${idx}">
                <div class="quiz-option-letter">${letters[idx]}</div>
                <div class="quiz-option-text">${opt}</div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else if (q.type === 'fill') {
      const inputVal = qs.answers[qs.currentIndex] || '';
      let inputClass = 'quiz-fill-input';
      if (answered) {
        inputClass += qs.results[qs.currentIndex] ? ' correct' : ' wrong';
      }
      optionsHTML = `
        <input type="text" class="${inputClass}" id="quiz-fill-input"
          placeholder="请输入答案..."
          value="${escapeHtml(inputVal)}"
          ${answered ? 'disabled' : ''}
          onkeydown="if(event.key==='Enter')window.__submitAnswer()"
          oninput="window.__fillInput(this.value)">
      `;
    } else if (q.type === 'truefalse') {
      optionsHTML = `
        <div class="quiz-tf-options">
          ${[{ val: true, label: '✅ 正确' }, { val: false, label: '❌ 错误' }].map(opt => {
            let classes = 'quiz-tf-btn';
            if (answered) {
              classes += ' disabled';
              if (opt.val === q.answer) classes += ' correct';
              else if (qs.answers[qs.currentIndex] === opt.val && opt.val !== q.answer) classes += ' wrong';
            } else if (qs.answers[qs.currentIndex] === opt.val) {
              classes += ' selected';
            }
            return `<button class="${classes}" onclick="window.__selectTF(${opt.val})">${opt.label}</button>`;
          }).join('')}
        </div>
      `;
    }

    // Type badge
    const typeLabelMap = { choice: '选择题', fill: '填空题', truefalse: '判断题' };

    // Explanation
    let explanationHTML = '';
    if (answered) {
      const isCorrect = qs.results[qs.currentIndex];
      explanationHTML = `
        <div class="quiz-explanation ${isCorrect ? 'correct' : 'wrong'}">
          <div class="quiz-explanation-title">${isCorrect ? '✅ 回答正确！' : '❌ 回答错误'}</div>
          <div class="quiz-explanation-text">${q.explanation || ''}</div>
        </div>
      `;
    }

    area.innerHTML = `
      <div class="quiz-container" data-active-chapter="${qs.chapterId}">
        <!-- Mobile mode switcher -->
        <div class="mobile-mode-switcher mode-switcher" style="display: none;">
          <button class="mode-btn" data-mode="study" onclick="window.__switchMode('study')">📖 知识浏览</button>
          <button class="mode-btn active" data-mode="quiz" onclick="window.__switchMode('quiz')">✏️ 自测练习</button>
        </div>

        <div class="quiz-progress-header">
          <div class="quiz-progress-text">
            题目 <strong>${qs.currentIndex + 1}</strong> / ${qs.questions.length}
          </div>
          <div class="quiz-score">
            <span class="correct">✓ ${correct}</span>
            <span class="wrong">✗ ${wrong}</span>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="progress-bar-bg" style="margin-bottom: var(--space-6); height: 4px;">
          <div class="progress-bar-fill" style="width: ${((qs.currentIndex + (answered ? 1 : 0)) / qs.questions.length * 100)}%; background: var(--accent-primary);"></div>
        </div>

        <div class="quiz-card ${answered && qs.results[qs.currentIndex] ? 'animate-correct' : ''} ${answered && !qs.results[qs.currentIndex] ? 'animate-shake' : ''}">
          <div class="quiz-type-badge">${typeLabelMap[q.type] || '题目'}</div>
          <div class="quiz-question">${q.question}</div>
          ${optionsHTML}
          ${explanationHTML}
        </div>

        <div class="quiz-actions">
          <button class="btn btn-secondary" ${qs.currentIndex === 0 ? 'disabled' : ''} onclick="window.__prevQuestion()">
            ← 上一题
          </button>
          <div style="display:flex;gap:var(--space-3);">
            ${!answered ? `
              <button class="btn btn-primary" onclick="window.__submitAnswer()" ${qs.answers[qs.currentIndex] === null ? 'disabled' : ''} id="submit-btn">
                提交答案
              </button>
            ` : ''}
            ${answered ? `
              <button class="btn btn-primary" onclick="window.__nextQuestion()">
                ${qs.currentIndex < qs.questions.length - 1 ? '下一题 →' : '查看结果 🎯'}
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    // Show mobile mode switcher
    if (window.innerWidth <= 768) {
      const mms = area.querySelector('.mobile-mode-switcher');
      if (mms) mms.style.display = 'flex';
    }
  }

  function renderQuizResults(area) {
    const qs = state.quizState;
    const total = qs.questions.length;
    const correct = qs.results.filter(r => r === true).length;
    const wrong = qs.results.filter(r => r === false).length;
    const pct = Math.round((correct / total) * 100);

    // Update progress
    updateBestScore(qs.chapterId, pct);

    let emoji = '🎉';
    let message = '太棒了！';
    if (pct < 60) { emoji = '💪'; message = '继续加油！'; }
    else if (pct < 80) { emoji = '👍'; message = '不错的成绩！'; }
    else if (pct < 100) { emoji = '🌟'; message = '优秀！'; }

    area.innerHTML = `
      <div class="quiz-results">
        <div style="font-size:3rem;margin-bottom:var(--space-4);">${emoji}</div>
        <div class="quiz-results-score">${pct}%</div>
        <div class="quiz-results-label">${message}</div>

        <div class="quiz-results-breakdown">
          <div class="quiz-results-stat">
            <div class="quiz-results-stat-value" style="color:var(--success);">${correct}</div>
            <div class="quiz-results-stat-label">正确</div>
          </div>
          <div class="quiz-results-stat">
            <div class="quiz-results-stat-value" style="color:var(--error);">${wrong}</div>
            <div class="quiz-results-stat-label">错误</div>
          </div>
          <div class="quiz-results-stat">
            <div class="quiz-results-stat-value">${total}</div>
            <div class="quiz-results-stat-label">总题数</div>
          </div>
        </div>

        <div class="quiz-results-actions">
          <button class="btn btn-secondary btn-lg" onclick="window.__switchMode('study')">📖 返回知识浏览</button>
          <button class="btn btn-primary btn-lg" onclick="window.__retryQuiz()">🔄 再做一次</button>
        </div>
      </div>
    `;

    // Update sidebar badges
    renderNavigation();
  }

  // ============ Quiz Interaction Handlers ============
  window.__selectOption = function (idx) {
    const qs = state.quizState;
    if (!qs || qs.submitted[qs.currentIndex]) return;
    qs.answers[qs.currentIndex] = idx;
    render();
  };

  window.__selectTF = function (val) {
    const qs = state.quizState;
    if (!qs || qs.submitted[qs.currentIndex]) return;
    qs.answers[qs.currentIndex] = val;
    render();
  };

  window.__fillInput = function (val) {
    const qs = state.quizState;
    if (!qs || qs.submitted[qs.currentIndex]) return;
    qs.answers[qs.currentIndex] = val;
    // Update submit button state
    const btn = document.getElementById('submit-btn');
    if (btn) btn.disabled = !val || val.trim() === '';
  };

  window.__submitAnswer = function () {
    const qs = state.quizState;
    if (!qs || qs.submitted[qs.currentIndex]) return;

    const q = qs.questions[qs.currentIndex];
    const answer = qs.answers[qs.currentIndex];

    if (answer === null || answer === undefined) return;

    let isCorrect = false;
    if (q.type === 'choice') {
      isCorrect = answer === q.answer;
    } else if (q.type === 'fill') {
      // Normalize comparison: trim and case insensitive
      const normalizedAnswer = String(answer).trim().toLowerCase();
      const normalizedCorrect = String(q.answer).trim().toLowerCase();
      isCorrect = normalizedAnswer === normalizedCorrect;
    } else if (q.type === 'truefalse') {
      isCorrect = answer === q.answer;
    }

    qs.submitted[qs.currentIndex] = true;
    qs.results[qs.currentIndex] = isCorrect;

    // Update per-question progress
    updateChapterProgress(qs.chapterId, q.id, isCorrect);

    render();
  };

  window.__nextQuestion = function () {
    const qs = state.quizState;
    if (!qs) return;

    if (qs.currentIndex < qs.questions.length - 1) {
      qs.currentIndex++;
    } else {
      qs.finished = true;
    }
    render();
  };

  window.__prevQuestion = function () {
    const qs = state.quizState;
    if (!qs || qs.currentIndex === 0) return;
    qs.currentIndex--;
    render();
  };

  window.__retryQuiz = function () {
    startQuiz(state.quizState.chapterId);
    state.currentMode = 'quiz';
    render();
  };

  // ============ Global Handlers ============
  window.__navigate = function (view) { navigate(view); };
  window.__switchMode = function (mode) { switchMode(mode); };

  window.__toggleCard = function (headerEl) {
    const card = headerEl.closest('.knowledge-card');
    if (card) card.classList.toggle('expanded');
  };

  // ============ Utility ============
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ============ Event Bindings ============
  function bindEvents() {
    // Dashboard nav
    document.getElementById('nav-dashboard')?.addEventListener('click', () => navigate('dashboard'));

    // Theme toggle
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

    // Menu toggle (mobile)
    document.getElementById('menu-toggle')?.addEventListener('click', openSidebar);
    document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar);

    // Mode switcher
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    });

    // Reset progress
    document.getElementById('nav-reset')?.addEventListener('click', resetAllProgress);
  }

  // ============ Initialize ============
  function init() {
    initTheme();
    renderNavigation();
    bindEvents();
    navigate('dashboard');
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
