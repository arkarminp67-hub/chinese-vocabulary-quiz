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
let currentPractice = {type:'chapter', chapter:1, chapters:[1]};
let lastPractice = {type:'chapter', chapter:1, chapters:[1]};
const quotes = [
 "You don't need to learn everything today. Just don't stop.","Small progress is still progress.","Consistency beats motivation.","One word today is one less word tomorrow.","Practice smarter, not harder.","Your future self will thank you.","Keep showing up.","You are building something every day."
];

function setLevel(level){
 selectedLevel=level;
 document.getElementById('level1Btn').classList.toggle('active',level===1);
 document.getElementById('level2Btn').classList.toggle('active',level===2);
 document.getElementById('levelTitle').textContent=`Level ${level}`;
 document.getElementById('levelDescription').textContent=level===1?'Say it and listen':'Understand the meaning';
}
function showPage(id){
 document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
 document.getElementById(id).classList.add('active');
 document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
 if(id==='homePage')document.getElementById('navHome').classList.add('active');
 if(id==='quizPage')document.getElementById('navPractice').classList.add('active');
}
function focusChapters(){showPage('homePage');setTimeout(()=>document.querySelector('.section-heading-row')?.scrollIntoView({behavior:'smooth',block:'start'}),50);}
function updateHome(){
 document.getElementById('totalWords').textContent=words.length;
 let mastered=0,weak=0;
 words.forEach(w=>{const x=progress[w.id];if(!x)return;if(x.correct>=3)mastered++;if(x.wrong>x.correct)weak++;});
 document.getElementById('masteredWords').textContent=mastered;
 document.getElementById('weakWords').textContent=weak;
 document.getElementById('streak').textContent=streak;
 document.getElementById('progressBar').style.width=Math.min(100,(mastered/Math.max(words.length,1))*100)+'%';
 document.getElementById('quoteText').textContent=quotes[new Date().getDate()%quotes.length];
}
function escapeHTML(text){const e=document.createElement('div');e.textContent=text;return e.innerHTML;}
function renderChapters(){
 const grid=document.getElementById('chapterGrid'), custom=document.getElementById('customChapterGrid');grid.innerHTML='';custom.innerHTML='';
 CHAPTER_DATA.forEach(ch=>{
  const b=document.createElement('button');b.type='button';b.className='chapter-card';b.onclick=()=>startChapterPractice(ch.id);
  b.innerHTML=`<span class="chapter-number">Chapter ${ch.id}</span><strong>${escapeHTML(ch.title)}</strong><span class="chapter-meta">${ch.words.length} words · 10 questions</span>`;grid.appendChild(b);
  const l=document.createElement('label');l.className='custom-chapter-option';l.innerHTML=`<input type="checkbox" value="${ch.id}" onchange="updateCustomSelection()"><span><strong>Ch. ${ch.id}</strong><small>${escapeHTML(ch.title)}</small></span>`;custom.appendChild(l);
 });
 document.getElementById('wordCountBadge').textContent=`${words.length} words`;
}
function getSelectedCustomChapters(){return [...document.querySelectorAll('#customChapterGrid input:checked')].map(x=>Number(x.value));}
function updateCustomSelection(){
 const n=getSelectedCustomChapters().length;document.getElementById('selectedChapterCount').textContent=n;
 const b=document.getElementById('customStartBtn');b.disabled=n===0;b.textContent=n?'Start Custom · 40 Questions':'Select at least 1 chapter';
}
function shuffle(a){return [...a].sort(()=>Math.random()-0.5);}
function getChapterWords(id){return words.filter(w=>Number(w.chapter)===Number(id));}
function startChapterPractice(id){
 const pool=getChapterWords(id);if(pool.length<10){alert('This chapter does not have enough vocabulary for 10 questions.');return;}
 currentPractice={type:'chapter',chapter:id,chapters:[id]};lastPractice={...currentPractice,chapters:[id]};beginQuiz(shuffle(pool).slice(0,10));
}
function startFinalPractice(){
 if(words.length<50){alert('There are not enough vocabulary words for the 50-question Final.');return;}
 currentPractice={type:'final',chapter:null,chapters:CHAPTER_DATA.map(c=>c.id)};lastPractice={...currentPractice,chapters:[...currentPractice.chapters]};beginQuiz(shuffle(words).slice(0,50));
}
function startCustomPractice(){
 const ids=getSelectedCustomChapters();if(!ids.length){alert('Please select at least one chapter.');return;}
 const pool=words.filter(w=>ids.includes(Number(w.chapter)));if(pool.length<40){alert('The selected chapters contain fewer than 40 words. Please select more chapters.');return;}
 currentPractice={type:'custom',chapter:null,chapters:ids};lastPractice={...currentPractice,chapters:[...ids]};beginQuiz(shuffle(pool).slice(0,40));
}
function startPractice(){
 if(lastPractice.type==='final')return startFinalPractice();
 if(lastPractice.type==='custom'){const pool=words.filter(w=>lastPractice.chapters.includes(Number(w.chapter)));return beginQuiz(shuffle(pool).slice(0,40));}
 startChapterPractice(lastPractice.chapter||1);
}
function repeatLastPractice(){startPractice();}
function beginQuiz(pool){quizWords=shuffle(pool);currentIndex=0;sessionScore=0;showPage('quizPage');loadQuestion();}
function getQuizTitle(){if(currentPractice.type==='final')return 'Final · All Chapters';if(currentPractice.type==='custom')return `Custom · ${currentPractice.chapters.length} Chapters`;return `Chapter ${currentPractice.chapter}`;}
function loadQuestion(){
 if(currentIndex>=quizWords.length)return finishPractice();
 currentWord=quizWords[currentIndex];
 currentMode=selectedLevel===1?['meaningToChinese','audioToMeaning'][Math.floor(Math.random()*2)]:'chineseToMeaning';
 const q=document.getElementById('question'),label=document.getElementById('modeLabel'),play=document.getElementById('questionPlayButton'),ans=document.getElementById('answer'),rating=document.getElementById('rating'),show=document.getElementById('showAnswerBtn');
 q.className='question';ans.classList.remove('show');rating.classList.remove('show');show.style.display='inline-block';play.classList.add('hidden');
 if(currentMode==='meaningToChinese'){label.textContent='Say it in Chinese';q.textContent=currentWord.meaning;q.classList.add('myanmar');}
 if(currentMode==='audioToMeaning'){label.textContent='Listen & Remember';q.textContent='🔊';play.classList.remove('hidden');setTimeout(playCurrentAudio,300);}
 if(currentMode==='chineseToMeaning'){label.textContent='What does this mean?';q.textContent=currentWord.chinese;play.classList.remove('hidden');}
 document.getElementById('questionNumber').textContent=currentIndex+1;document.getElementById('questionTotal').textContent=quizWords.length;document.getElementById('quizMode').textContent=`${getQuizTitle()} · Level ${selectedLevel}`;document.getElementById('quizProgress').style.width=(currentIndex/quizWords.length*100)+'%';
}
function showAnswer(){
 document.getElementById('answerChinese').textContent=currentWord.chinese;document.getElementById('answerPinyin').textContent=currentWord.pinyin;document.getElementById('answerMeaning').textContent=currentWord.meaning;
 document.getElementById('answer').classList.add('show');document.getElementById('rating').classList.add('show');document.getElementById('showAnswerBtn').style.display='none';document.getElementById('questionPlayButton').classList.remove('hidden');
}
function rateAnswer(ok){
 const key=currentWord.id;if(!progress[key])progress[key]={correct:0,wrong:0};if(ok){progress[key].correct++;sessionScore++;}else progress[key].wrong++;
 localStorage.setItem('linguaflow_progress',JSON.stringify(progress));currentIndex++;loadQuestion();
}
function playCurrentAudio(){
 if(!currentWord)return;const text=currentWord.chinese;const url='https://translate.google.com/translate_tts?ie=UTF-8&q='+encodeURIComponent(text)+'&tl=zh-CN&client=tw-ob';const audio=new Audio(url);audio.play().catch(()=>browserSpeak(text));
}
function browserSpeak(text){if(!('speechSynthesis' in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='zh-CN';u.rate=.78;u.pitch=1;speechSynthesis.speak(u);}
function finishPractice(){
 document.getElementById('finalScore').textContent=sessionScore;document.getElementById('finalTotal').textContent=quizWords.length;
 let msg;if(sessionScore===quizWords.length)msg='ပုလဲလေးကတော်လိုက်တာ ဘာမုန့်စားမလဲ';else if(sessionScore>=Math.ceil(quizWords.length*.5))msg='မဆိုးပါဖူး မေ့နေတာတွေပြန်ကျက်အုန်း';else msg='ပြန်ကျက်အုန်း';
 document.getElementById('finalMessage').textContent=msg;updateStreak();updateHome();showPage('completePage');
}
function updateStreak(){
 const today=new Date().toISOString().split('T')[0];if(lastPracticeDate===today)return;
 if(lastPracticeDate){const d=Math.round((new Date(today)-new Date(lastPracticeDate))/(1000*60*60*24));streak=d===1?streak+1:1;}else streak=1;
 lastPracticeDate=today;localStorage.setItem('linguaflow_streak',streak);localStorage.setItem('linguaflow_last_date',lastPracticeDate);
}
renderChapters();setLevel(1);updateCustomSelection();updateHome();
