let words = [...WORD_DATA];
let progress = JSON.parse(localStorage.getItem('linguaflow_progress') || '{}');
let streak = Number(localStorage.getItem('linguaflow_streak') || 0);
let lastPracticeDate = localStorage.getItem('linguaflow_last_date') || '';

let selectedLevel = 1;
let quizWords = [];
let currentIndex = 0;
let currentWord = null;
let currentMode = null;
let sessionScore = 0;
let sessionMissed = [];

let currentPractice = { type: 'chapter', chapter: 1, chapters: [1] };
let lastPractice = { type: 'chapter', chapter: 1, chapters: [1] };

const quotes = [
  "You don't need to learn everything today. Just don't stop.",
  "Small progress is still progress.",
  "Consistency beats motivation.",
  "One word today is one less word tomorrow.",
  "Practice smarter, not harder.",
  "Your future self will thank you.",
  "Keep showing up.",
  "You are building something every day."
];

function setLevel(level) {
  selectedLevel = level;
  document.getElementById('level1Btn').classList.toggle('active', level === 1);
  document.getElementById('level2Btn').classList.toggle('active', level === 2);
  document.getElementById('levelTitle').textContent = `Level ${level}`;
  document.getElementById('levelDescription').textContent =
    level === 1 ? 'Say it and listen' : 'Understand the meaning';
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (id === 'homePage') document.getElementById('navHome').classList.add('active');
  if (id === 'quizPage') document.getElementById('navPractice').classList.add('active');
}

function focusChapters() {
  showPage('homePage');
  setTimeout(() => {
    document.querySelector('.section-heading-row')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, 50);
}

function updateHome() {
  document.getElementById('totalWords').textContent = words.length;

  let mastered = 0;
  let weak = 0;

  words.forEach(word => {
    const item = progress[word.id];
    if (!item) return;
    if (item.correct >= 3) mastered++;
    if (item.wrong > item.correct) weak++;
  });

  document.getElementById('masteredWords').textContent = mastered;
  document.getElementById('weakWords').textContent = weak;
  document.getElementById('streak').textContent = streak;
  document.getElementById('progressBar').style.width =
    Math.min(100, (mastered / Math.max(words.length, 1)) * 100) + '%';
  document.getElementById('quoteText').textContent =
    quotes[new Date().getDate() % quotes.length];
}

function escapeHTML(text) {
  const e = document.createElement('div');
  e.textContent = text ?? '';
  return e.innerHTML;
}

function renderChapters() {
  const grid = document.getElementById('chapterGrid');
  const custom = document.getElementById('customChapterGrid');

  grid.innerHTML = '';
  custom.innerHTML = '';

  CHAPTER_DATA.forEach(ch => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chapter-card';
    b.onclick = () => startChapterPractice(ch.id);
    b.innerHTML = `
      <span class="chapter-number">Chapter ${ch.id}</span>
      <strong>${escapeHTML(ch.title)}</strong>
      <span class="chapter-meta">${ch.words.length} words · 10 questions</span>
    `;
    grid.appendChild(b);

    const l = document.createElement('label');
    l.className = 'custom-chapter-option';
    l.innerHTML = `
      <input type="checkbox" value="${ch.id}" onchange="updateCustomSelection()">
      <span>
        <strong>Ch. ${ch.id}</strong>
        <small>${escapeHTML(ch.title)}</small>
      </span>
    `;
    custom.appendChild(l);
  });

  document.getElementById('wordCountBadge').textContent = `${words.length} words`;
}

function getSelectedCustomChapters() {
  return [...document.querySelectorAll('#customChapterGrid input:checked')]
    .map(x => Number(x.value));
}

function updateCustomSelection() {
  const n = getSelectedCustomChapters().length;
  document.getElementById('selectedChapterCount').textContent = n;

  const button = document.getElementById('customStartBtn');
  button.disabled = n === 0;
  button.textContent = n
    ? 'Start Custom · 40 Questions'
    : 'Select at least 1 chapter';
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getChapterWords(id) {
  return words.filter(w => Number(w.chapter) === Number(id));
}

function startChapterPractice(id) {
  const pool = getChapterWords(id);

  if (pool.length < 10) {
    alert('This chapter does not have enough vocabulary for 10 questions.');
    return;
  }

  currentPractice = {
    type: 'chapter',
    chapter: id,
    chapters: [id]
  };
  lastPractice = {
    type: 'chapter',
    chapter: id,
    chapters: [id]
  };

  beginQuiz(shuffle(pool).slice(0, 10));
}

function startFinalPractice() {
  if (words.length < 50) {
    alert('There are not enough vocabulary words for the 50-question Final.');
    return;
  }

  currentPractice = {
    type: 'final',
    chapter: null,
    chapters: CHAPTER_DATA.map(c => c.id)
  };
  lastPractice = {
    type: 'final',
    chapter: null,
    chapters: [...currentPractice.chapters]
  };

  beginQuiz(shuffle(words).slice(0, 50));
}

function startCustomPractice() {
  const ids = getSelectedCustomChapters();

  if (!ids.length) {
    alert('Please select at least one chapter.');
    return;
  }

  const pool = words.filter(w => ids.includes(Number(w.chapter)));

  if (pool.length < 40) {
    alert('The selected chapters contain fewer than 40 words. Please select more chapters.');
    return;
  }

  currentPractice = {
    type: 'custom',
    chapter: null,
    chapters: [...ids]
  };
  lastPractice = {
    type: 'custom',
    chapter: null,
    chapters: [...ids]
  };

  beginQuiz(shuffle(pool).slice(0, 40));
}

function startPractice() {
  if (lastPractice.type === 'final') {
    startFinalPractice();
    return;
  }

  if (lastPractice.type === 'custom') {
    const pool = words.filter(w =>
      lastPractice.chapters.includes(Number(w.chapter))
    );

    currentPractice = {
      type: 'custom',
      chapter: null,
      chapters: [...lastPractice.chapters]
    };

    beginQuiz(shuffle(pool).slice(0, 40));
    return;
  }

  startChapterPractice(lastPractice.chapter || 1);
}

function repeatLastPractice() {
  startPractice();
}

function beginQuiz(pool) {
  quizWords = shuffle(pool);
  currentIndex = 0;
  sessionScore = 0;
  sessionMissed = [];
  showPage('quizPage');
  loadQuestion();
}

function getQuizTitle() {
  if (currentPractice.type === 'final') return 'Final · All Chapters';
  if (currentPractice.type === 'custom') {
    return `Custom · ${currentPractice.chapters.length} Chapters`;
  }
  return `Chapter ${currentPractice.chapter}`;
}

function loadQuestion() {
  if (currentIndex >= quizWords.length) {
    finishPractice();
    return;
  }

  currentWord = quizWords[currentIndex];

  currentMode = selectedLevel === 1
    ? ['meaningToChinese', 'audioToMeaning'][Math.floor(Math.random() * 2)]
    : 'chineseToMeaning';

  const question = document.getElementById('question');
  const label = document.getElementById('modeLabel');
  const play = document.getElementById('questionPlayButton');
  const answer = document.getElementById('answer');
  const rating = document.getElementById('rating');
  const show = document.getElementById('showAnswerBtn');

  question.className = 'question';
  answer.classList.remove('show');
  rating.classList.remove('show');
  show.style.display = 'inline-block';
  play.classList.add('hidden');

  if (currentMode === 'meaningToChinese') {
    label.textContent = 'Say it in Chinese';
    question.textContent = currentWord.meaning;
    question.classList.add('myanmar');
  }

  if (currentMode === 'audioToMeaning') {
    label.textContent = 'Listen & Remember';
    question.textContent = '🔊';
    play.classList.remove('hidden');
    setTimeout(playCurrentAudio, 300);
  }

  if (currentMode === 'chineseToMeaning') {
    label.textContent = 'What does this mean?';
    question.textContent = currentWord.chinese;
    play.classList.remove('hidden');
  }

  document.getElementById('questionNumber').textContent = currentIndex + 1;
  document.getElementById('questionTotal').textContent = quizWords.length;
  document.getElementById('quizMode').textContent =
    `${getQuizTitle()} · Level ${selectedLevel}`;
  document.getElementById('quizProgress').style.width =
    ((currentIndex / quizWords.length) * 100) + '%';
}

function showAnswer() {
  document.getElementById('answerChinese').textContent = currentWord.chinese;
  document.getElementById('answerPinyin').textContent = currentWord.pinyin;
  document.getElementById('answerMeaning').textContent = currentWord.meaning;

  document.getElementById('answer').classList.add('show');
  document.getElementById('rating').classList.add('show');
  document.getElementById('showAnswerBtn').style.display = 'none';
  document.getElementById('questionPlayButton').classList.remove('hidden');
}

function rateAnswer(remembered) {
  const key = currentWord.id;

  if (!progress[key]) {
    progress[key] = { correct: 0, wrong: 0 };
  }

  if (remembered) {
    progress[key].correct++;
    sessionScore++;
  } else {
    progress[key].wrong++;
    addSessionMissed(currentWord);
  }

  localStorage.setItem('linguaflow_progress', JSON.stringify(progress));

  currentIndex++;
  loadQuestion();
}

function addSessionMissed(word) {
  if (!sessionMissed.some(item => item.id === word.id)) {
    sessionMissed.push(word);
  }
}

function playCurrentAudio() {
  if (!currentWord) return;

  const text = currentWord.chinese;
  const url =
    'https://translate.google.com/translate_tts?ie=UTF-8&q=' +
    encodeURIComponent(text) +
    '&tl=zh-CN&client=tw-ob';

  const audio = new Audio(url);
  audio.play().catch(() => browserSpeak(text));
}

function browserSpeak(text) {
  if (!('speechSynthesis' in window)) return;

  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.78;
  utterance.pitch = 1;
  speechSynthesis.speak(utterance);
}

function finishPractice() {
  document.getElementById('finalScore').textContent = sessionScore;
  document.getElementById('finalTotal').textContent = quizWords.length;

  let message;
  if (sessionScore === quizWords.length) {
    message = 'ပုလဲလေးကတော်လိုက်တာ ဘာမုန့်စားမလဲ';
  } else if (sessionScore >= Math.ceil(quizWords.length * 0.5)) {
    message = 'မဆိုးပါဖူး မေ့နေတာတွေပြန်ကျက်အုန်း';
  } else {
    message = 'ပြန်ကျက်အုန်း';
  }

  document.getElementById('finalMessage').textContent = message;
  renderSessionReview();
  updateStreak();
  updateHome();
  showPage('completePage');
}

function renderSessionReview() {
  const section = document.getElementById('reviewSection');
  const list = document.getElementById('reviewList');
  const count = document.getElementById('reviewCount');

  if (!section || !list || !count) return;

  list.innerHTML = '';
  count.textContent = sessionMissed.length;

  if (!sessionMissed.length) {
    section.classList.add('empty');
    list.innerHTML = '<div class="no-review">🔥 Perfect! You remembered every vocabulary.</div>';
    return;
  }

  section.classList.remove('empty');

  sessionMissed.forEach(word => {
    const item = document.createElement('div');
    item.className = 'review-word';
    item.innerHTML = `
      <div>
        <strong>${escapeHTML(word.chinese)}</strong>
        <span>${escapeHTML(word.pinyin)}</span>
      </div>
      <p>${escapeHTML(word.meaning)}</p>
      <button type="button" onclick="speakWord('${encodeURIComponent(word.chinese)}')">🔊</button>
    `;
    list.appendChild(item);
  });
}

function speakWord(encodedText) {
  const text = decodeURIComponent(encodedText);
  const url =
    'https://translate.google.com/translate_tts?ie=UTF-8&q=' +
    encodeURIComponent(text) +
    '&tl=zh-CN&client=tw-ob';

  const audio = new Audio(url);
  audio.play().catch(() => browserSpeak(text));
}

function reviewMissedWords() {
  if (!sessionMissed.length) return;

  currentPractice = {
    type: 'review',
    chapter: null,
    chapters: [...new Set(sessionMissed.map(w => Number(w.chapter)))]
  };
  lastPractice = {
    type: 'review',
    chapter: null,
    chapters: [...currentPractice.chapters]
  };

  beginQuiz(sessionMissed);
}

function updateStreak() {
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('-');

  if (lastPracticeDate === today) return;

  if (lastPracticeDate) {
    const previous = new Date(lastPracticeDate + 'T00:00:00');
    const current = new Date(today + 'T00:00:00');
    const days = Math.round((current - previous) / (1000 * 60 * 60 * 24));
    streak = days === 1 ? streak + 1 : 1;
  } else {
    streak = 1;
  }

  lastPracticeDate = today;
  localStorage.setItem('linguaflow_streak', String(streak));
  localStorage.setItem('linguaflow_last_date', lastPracticeDate);
}

renderChapters();
setLevel(1);
updateCustomSelection();
updateHome();
