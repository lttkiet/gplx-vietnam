"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, BarChart3, BookOpen, Bookmark, BookmarkCheck, CarFront, Check, ChevronRight, CircleAlert, Clock3, Heart, Home, Map, Play, RotateCcw, Search, Signpost, Sparkles, Timer, Trophy, X } from "lucide-react";
import { categories, Category, Question, questions } from "@/lib/questions";

type View = "home" | "topics" | "quiz" | "saved" | "progress" | "result";
type Stats = Record<number, { attempts: number; correct: number }>;
type Store = { saved: number[]; stats: Stats; testHistory: number[]; activityDays: string[] };
const initialStore: Store = { saved: [], stats: {}, testHistory: [], activityDays: [] };
const STORE_KEY = "vung-tay-lai-progress-v2";

function getToday() { return new Date().toLocaleDateString("en-CA"); }

function Logo() {
  return <div className="logo" aria-label="Ôn thi GPLX Việt Nam"><span className="logo-mark"><CarFront size={24} strokeWidth={2.4} /></span><span className="logo-label">Ôn thi GPLX Việt Nam</span></div>;
}

function CategoryIcon({ name, size = 20 }: { name: Category; size?: number }) {
  if (name === "Báo hiệu đường bộ") return <Signpost size={size} />;
  if (name === "Sa hình và xử lý tình huống") return <Map size={size} />;
  if (name === "Kỹ thuật lái xe") return <CarFront size={size} />;
  if (name === "Văn hóa giao thông, đạo đức và cứu hộ") return <Heart size={size} />;
  return <BookOpen size={size} />;
}

function EvidenceKindLabel({ kind }: { kind: Question["evidence"][number]["kind"] }) {
  const labels = {
    "official-exam-bank": "Đáp án trong bộ đề CSGT",
    law: "Căn cứ pháp lý / kỹ thuật",
    "law-context": "Quy định liên quan (không phải căn cứ trực tiếp)",
    "technical-conflict": "Lưu ý kỹ thuật có nội dung mâu thuẫn",
  };
  return <span className="evidence-kind">{labels[kind]}</span>;
}

function normalizeSearchText(value: string) {
  return value.toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim();
}

function sampleQuestions(pool: Question[], count: number) {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function DrivingApp() {
  const [view, setView] = useState<View>("home");
  const [store, setStore] = useState<Store>(initialStore);
  const [hydrated, setHydrated] = useState(false);
  const [quiz, setQuiz] = useState<Question[]>([]);
  const [sessionMisses, setSessionMisses] = useState<Question[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [quizMode, setQuizMode] = useState<"learn" | "test">("learn");
  const [timeLeft, setTimeLeft] = useState(0);
  const [criticalMissed, setCriticalMissed] = useState(false);

  useEffect(() => {
    try { const raw = localStorage.getItem(STORE_KEY); if (raw) setStore(JSON.parse(raw)); } catch { /* private browsing fallback */ }
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch { /* in-memory fallback */ } }, [store, hydrated]);
  useEffect(() => {
    if (view !== "quiz" || quizMode !== "test" || timeLeft <= 0) return;
    const id = window.setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => window.clearInterval(id);
  }, [view, quizMode, timeLeft]);
  useEffect(() => { if (view === "quiz" && quizMode === "test" && timeLeft === 0 && quiz.length) finishQuiz(); }, [timeLeft]);

  const attempted = Object.keys(store.stats).length;
  const totalAttempts = Object.values(store.stats).reduce((n, s) => n + s.attempts, 0);
  const totalCorrect = Object.values(store.stats).reduce((n, s) => n + s.correct, 0);
  const accuracy = totalAttempts ? Math.round(totalCorrect / totalAttempts * 100) : 0;
  const streak = useMemo(() => {
    const days = new Set(store.activityDays); let n = 0; const d = new Date();
    while (days.has(d.toLocaleDateString("en-CA"))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }, [store.activityDays]);

  function navigate(next: View) { setView(next); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function startQuiz(pool = questions, mode: "learn" | "test" = "learn") {
    let list = pool;
    if (mode === "test") {
      const critical = sampleQuestions(questions.filter((q) => q.critical), 1)[0];
      const regular = sampleQuestions(pool.filter((q) => !q.critical), 49);
      list = sampleQuestions([...regular, ...(critical ? [critical] : [])], 50);
    }
    setQuiz(list); setSessionMisses([]); setQuizIndex(0); setSelected(null); setRevealed(false); setScore(0); setCriticalMissed(false); setQuizMode(mode); setTimeLeft(mode === "test" ? 33 * 60 : 0); navigate("quiz");
  }
  function submitAnswer() {
    if (selected === null || revealed) return;
    const q = quiz[quizIndex]; const ok = selected === q.correct;
    setRevealed(true); if (ok) setScore((s) => s + 1); else {
      setSessionMisses((misses) => misses.some((miss) => miss.id === q.id) ? misses : [...misses, q]);
      if (q.critical && quizMode === "test") setCriticalMissed(true);
    }
    setStore((prev) => ({ ...prev, stats: { ...prev.stats, [q.id]: { attempts: (prev.stats[q.id]?.attempts ?? 0) + 1, correct: (prev.stats[q.id]?.correct ?? 0) + (ok ? 1 : 0) } }, activityDays: prev.activityDays.includes(getToday()) ? prev.activityDays : [...prev.activityDays, getToday()] }));
  }
  function nextQuestion() { if (quizIndex === quiz.length - 1) finishQuiz(); else { setQuizIndex((i) => i + 1); setSelected(null); setRevealed(false); } }
  function finishQuiz() {
    const unanswered = quiz[quizIndex];
    if (quizMode === "test" && unanswered && !revealed) {
      setSessionMisses((misses) => misses.some((miss) => miss.id === unanswered.id) ? misses : [...misses, unanswered]);
      if (unanswered.critical) setCriticalMissed(true);
    }
    setStore((prev) => quizMode === "test" ? { ...prev, testHistory: [...prev.testHistory, score] } : prev);
    navigate("result");
  }
  function toggleSaved(id: number) { setStore((s) => ({ ...s, saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id] })); }

  const navItems: { view: View; label: string; icon: typeof Home }[] = [
    { view: "home", label: "Trang chủ", icon: Home }, { view: "topics", label: "Câu hỏi", icon: BookOpen }, { view: "saved", label: "Đã lưu", icon: Bookmark }, { view: "progress", label: "Tiến độ", icon: BarChart3 },
  ];

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Bỏ qua điều hướng</a>
    <header><div className="header-inner"><button className="brand-button" onClick={() => navigate("home")}><Logo /></button><nav aria-label="Điều hướng chính">{navItems.map(({ view: itemView, label }) => <button key={itemView} aria-current={view === itemView ? "page" : undefined} className={view === itemView ? "active" : ""} onClick={() => navigate(itemView)}>{label}</button>)}</nav></div></header>
    <main id="main-content" tabIndex={-1}>
      {view === "home" && <HomeView attempted={attempted} accuracy={accuracy} store={store} startQuiz={startQuiz} startQuickPractice={() => startQuiz(sampleQuestions(questions, 10))} navigate={navigate} />}
      {view === "topics" && <TopicsView store={store} startQuiz={startQuiz} />}
      {view === "saved" && <SavedView store={store} startQuiz={startQuiz} toggleSaved={toggleSaved} />}
      {view === "progress" && <ProgressView store={store} accuracy={accuracy} attempted={attempted} streak={streak} />}
      {view === "quiz" && quiz.length > 0 && <QuizView question={quiz[quizIndex]} index={quizIndex} total={quiz.length} selected={selected} setSelected={setSelected} revealed={revealed} submitAnswer={submitAnswer} nextQuestion={nextQuestion} saved={store.saved} toggleSaved={toggleSaved} mode={quizMode} timeLeft={timeLeft} quit={() => navigate("home")} />}
      {view === "result" && <ResultView score={score} total={quiz.length} mode={quizMode} criticalMissed={criticalMissed} misses={sessionMisses} reviewMisses={() => startQuiz(sessionMisses)} retry={() => startQuiz(quizMode === "test" ? questions : quiz, quizMode)} home={() => navigate("home")} />}
    </main>
    <nav className="mobile-nav" aria-label="Điều hướng chính">{navItems.map(({ view: itemView, label, icon: Icon }) => <button key={itemView} aria-current={view === itemView ? "page" : undefined} className={view === itemView ? "active" : ""} onClick={() => navigate(itemView)}><Icon size={20} /><span>{label}</span></button>)}</nav>
  </div>;
}

function HomeView({ attempted, accuracy, store, startQuiz, startQuickPractice, navigate }: { attempted: number; accuracy: number; store: Store; startQuiz: (q?: Question[], m?: "learn" | "test") => void; startQuickPractice: () => void; navigate: (v: View) => void }) {
  const weak = questions.filter((q) => store.stats[q.id] && store.stats[q.id].correct < store.stats[q.id].attempts);
  return <div className="page home-page simple-home">
    <section className="simple-intro">
      <div><span className="eyebrow"><BookOpen size={15} /> ÔN TẬP LÝ THUYẾT</span><h1>Học theo nhịp của bạn</h1><p>600 câu hỏi · Tiến độ được lưu trên thiết bị này.</p></div>
      <button className="primary" onClick={startQuickPractice}><Play size={18} fill="currentColor" /> Luyện 10 câu</button>
    </section>
    <section className="simple-summary" aria-label="Tóm tắt tiến độ">
      <div><span>Đã học</span><b>{attempted}<small> / 600</small></b></div>
      <div><span>Độ chính xác</span><b>{attempted ? `${accuracy}%` : "—"}</b></div>
      <div><span>Thi thử gần nhất</span><b>{store.testHistory.length ? `${store.testHistory.at(-1)}/50` : "—"}</b></div>
    </section>
    <section className="simple-actions" aria-label="Lối tắt học tập">
      <button className="simple-action" type="button" onClick={() => navigate("topics")}><Search size={20}/><span><b>Chọn câu hỏi</b><small>Tìm số câu hoặc nội dung</small></span><ArrowRight size={17}/></button>
      <button className="simple-action" type="button" disabled={!weak.length} onClick={() => startQuiz(weak)}><CircleAlert size={20}/><span><b>Ôn câu sai</b><small>{weak.length ? `${weak.length} câu cần xem lại` : "Các câu trả lời sai sẽ hiện ở đây"}</small></span><ArrowRight size={17}/></button>
      <button className="simple-action" type="button" onClick={() => startQuiz(questions, "test")}><Timer size={20}/><span><b>Thi thử hạng B</b><small>50 câu · 33 phút</small></span><ArrowRight size={17}/></button>
    </section>
    <p className="source-note">600 câu hỏi theo bộ Cục Cảnh sát giao thông, Bộ Công an ban hành năm 2025. <a href="https://xaydungchinhsach.chinhphu.vn/huong-dan-su-dung-bo-600-cau-hoi-dung-de-sat-hach-lai-xe-co-gioi-duong-bo-119250513110514585.htm" target="_blank" rel="noreferrer">Xem nguồn chính thức</a></p>
  </div>;
}

function TopicsView({ store, startQuiz }: { store: Store; startQuiz: (q: Question[]) => void }) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | Category>("all");
  const [page, setPage] = useState(1);
  const searchTerm = normalizeSearchText(query).replace(/^cau\s*/, "");
  const results = questions.filter(q => {
    const matchesCategory = categoryFilter === "all" || q.category === categoryFilter;
    const matchesSearch = !searchTerm || String(q.id).includes(searchTerm) || normalizeSearchText(q.question).includes(searchTerm) || q.answers.some(answer => normalizeSearchText(answer).includes(searchTerm));
    return matchesCategory && matchesSearch;
  });
  const pageSize = 30;
  const pageCount = Math.max(1, Math.ceil(results.length / pageSize));
  const visibleResults = results.slice((page - 1) * pageSize, page * pageSize);
  const firstVisible = results.length ? (page - 1) * pageSize + 1 : 0;
  const lastVisible = Math.min(page * pageSize, results.length);

  return <div className="page inner-page">
    <span className="eyebrow"><BookOpen size={15}/> BỘ CÂU HỎI</span>
    <h1>Chọn câu hỏi</h1>
    <p className="lead">Chọn trực tiếp trong bộ 600 câu hoặc tìm theo số câu, nội dung, đáp án hay chủ đề.</p>
    <div className="question-search-box">
      <label htmlFor="question-search">Tìm câu trong bộ 600 câu hỏi</label>
      <div className="question-search">
        <Search size={18} aria-hidden="true" />
        <input id="question-search" type="text" inputMode="search" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Ví dụ: 260 hoặc từ khóa câu hỏi" autoComplete="off" />
        <button type="button" aria-label="Xóa nội dung tìm kiếm" disabled={!query} onClick={() => { setQuery(""); setPage(1); }}><X size={17}/></button>
      </div>
    </div>
    <div className="question-category-filter">
      <label htmlFor="question-category">Lọc theo chủ đề</label>
      <select id="question-category" value={categoryFilter} onChange={event => { setCategoryFilter(event.target.value as "all" | Category); setPage(1); }}>
        <option value="all">Tất cả chủ đề</option>
        {categories.map(category => <option key={category.name} value={category.name}>{category.name}</option>)}
      </select>
    </div>
    <p className="search-status" role="status" aria-live="polite">{results.length ? `Câu ${firstVisible}–${lastVisible} trong ${results.length} câu phù hợp` : "Không tìm thấy câu phù hợp. Thử số câu hoặc từ khóa khác."}</p>
    {visibleResults.length > 0 && <ul className="question-search-results">{visibleResults.map(q => <li key={q.id}><button className="question-search-result" type="button" onClick={() => startQuiz([q])} aria-label={`Chọn và luyện tập câu ${q.id}: ${q.question}`}><span>Câu {q.id} · {q.category}</span><b>{q.question}</b><small>Luyện câu này <ArrowRight size={14}/></small></button></li>)}</ul>}
    {pageCount > 1 && <nav className="question-pagination" aria-label="Phân trang câu hỏi"><button type="button" disabled={page === 1} onClick={() => setPage(current => current - 1)}><ArrowLeft size={16}/> Trước</button><span>Trang {page} / {pageCount}</span><button type="button" disabled={page === pageCount} onClick={() => setPage(current => current + 1)}>Tiếp <ArrowRight size={16}/></button></nav>}
  </div>;
}

function SavedView({ store, startQuiz, toggleSaved }: { store: Store; startQuiz: (q: Question[]) => void; toggleSaved: (id: number) => void }) {
  const saved = questions.filter(q => store.saved.includes(q.id));
  return <div className="page inner-page">
    <span className="eyebrow"><Bookmark size={15}/> BỘ SƯU TẬP</span>
    <h1>Câu hỏi đã lưu</h1>
    <p className="lead">Giữ lại những câu quan trọng để quay lại bất cứ lúc nào.</p>
    {saved.length ? <div className="saved-list">
      {saved.map(q => <div className="saved-question" key={q.id}>
        <div className="saved-question-copy"><span>Câu {q.id}</span><b>{q.question}</b><small>{q.category}</small></div>
        <div className="saved-actions">
          <button className="saved-action study" type="button" aria-label={`Ôn riêng câu ${q.id}`} onClick={() => startQuiz([q])}><Play size={15}/> Ôn câu</button>
          <button className="saved-action remove" type="button" aria-label={`Bỏ lưu câu ${q.id}`} onClick={() => toggleSaved(q.id)}><BookmarkCheck size={15}/> Bỏ lưu</button>
        </div>
      </div>)}
      <button className="primary" onClick={() => startQuiz(saved)}><Play size={17}/> Ôn {saved.length} câu đã lưu</button>
    </div> : <Empty icon={<Bookmark size={35}/>} title="Chưa có câu hỏi nào" copy="Nhấn biểu tượng lưu trong khi học để tạo bộ ôn tập riêng của bạn." />}
  </div>;
}

function ProgressView({ store, accuracy, attempted, streak }: { store: Store; accuracy: number; attempted: number; streak: number }) {
  return <div className="page inner-page">
    <span className="eyebrow"><BarChart3 size={15}/> NHÌN LẠI HÀNH TRÌNH</span>
    <h1>Tiến độ của bạn</h1>
    <p className="lead">Hiểu điểm mạnh, nhận ra phần cần ôn và tiến lên theo nhịp của riêng bạn.</p>
    <div className="progress-hero">
      <div><span>Mức độ bao phủ</span><b>{Math.round(attempted/questions.length*100)}%</b><small>{attempted}/{questions.length} câu đã học</small></div>
      <div><span>Độ chính xác</span><b>{attempted ? `${accuracy}%` : "—"}</b><small>{attempted ? "trên tất cả lượt trả lời" : "Chưa có lượt trả lời"}</small></div>
      <div><span>Chuỗi học</span><b>{streak} ngày</b><small>chỉ để ghi nhận, không áp mục tiêu</small></div>
    </div>
    <h2 className="subheading">Theo từng chủ đề</h2>
    <div className="category-progress">{categories.map(c => {
      const set=questions.filter(q=>q.category===c.name);
      const attempts=set.reduce((n,q)=>n+(store.stats[q.id]?.attempts||0),0);
      const correct=set.reduce((n,q)=>n+(store.stats[q.id]?.correct||0),0);
      const value=attempts?Math.round(correct/attempts*100):0;
      return <div key={c.name}>
        <span className="topic-icon" style={{background:c.bg,color:c.color}}><CategoryIcon name={c.name}/></span>
        <span><b>{c.name}</b><span className="progress-bar" role="progressbar" aria-label={`Độ chính xác ${c.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={attempts ? value : undefined} aria-valuetext={attempts ? `${value}% chính xác` : "Chưa có dữ liệu"}><i style={{width:`${value}%`,background:c.color}}/></span></span>
        <strong>{attempts ? `${value}%` : "—"}</strong>
      </div>;
    })}</div>
  </div>;
}

function QuizView({ question, index, total, selected, setSelected, revealed, submitAnswer, nextQuestion, saved, toggleSaved, mode, timeLeft, quit }: { question: Question; index:number; total:number; selected:number|null; setSelected:(n:number)=>void; revealed:boolean; submitAnswer:()=>void; nextQuestion:()=>void; saved:number[]; toggleSaved:(id:number)=>void; mode:"learn"|"test"; timeLeft:number; quit:()=>void }) {
  const mins = Math.floor(timeLeft/60).toString().padStart(2,"0"), secs=(timeLeft%60).toString().padStart(2,"0");
  return <div className="quiz-page">
    <div className="quiz-top">
      <button onClick={quit}><ArrowLeft size={19}/> Thoát</button>
      <div><span>{mode === "test" ? "Thi thử hạng B" : "Luyện tập"}</span><div className="quiz-progress" role="progressbar" aria-label="Tiến độ câu hỏi" aria-valuemin={1} aria-valuemax={total} aria-valuenow={index + 1}><i style={{width:`${(index+1)/total*100}%`}}/></div></div>
      {mode === "test" ? <span className="timer" aria-label={`Thời gian còn lại ${mins} phút ${secs} giây`}><Clock3 size={17}/>{mins}:{secs}</span> : <span aria-label={`Câu ${index + 1} trên ${total}`}>{index+1}/{total}</span>}
    </div>
    <article className="question-card">
      <div className="question-meta"><span>{question.category}</span>{question.critical && <em><CircleAlert size={15}/> Câu điểm liệt</em>}<button aria-label={saved.includes(question.id)?"Bỏ lưu câu hỏi":"Lưu câu hỏi"} onClick={() => toggleSaved(question.id)}>{saved.includes(question.id)?<BookmarkCheck fill="currentColor"/>:<Bookmark/>}</button></div>
      <p className="question-number">CÂU {question.id} · {index+1} / {total}</p>
      <h1>{question.question}</h1>
      {question.images.length > 0 && <div className="question-images">{question.images.map((image, imageIndex) => <Image key={image.src} src={image.src} alt={`Hình minh họa câu ${question.id}${question.images.length > 1 ? `, hình ${imageIndex + 1}` : ""}`} width={image.width} height={image.height} className="question-image" unoptimized />)}</div>}
      <div className="answers">{question.answers.map((a,i) => {
        const state = revealed ? i===question.correct ? "correct" : i===selected ? "wrong" : "" : selected===i ? "selected" : "";
        const status = revealed ? i===question.correct ? " — Đáp án đúng" : i===selected ? " — Bạn đã chọn đáp án này" : "" : "";
        return <button key={`${question.id}-${i}`} type="button" aria-pressed={selected===i} aria-label={`${String.fromCharCode(65+i)}. ${a}${status}`} disabled={revealed} className={state} onClick={() => setSelected(i)}><span>{String.fromCharCode(65+i)}</span><b>{a}</b>{revealed && i===question.correct && <Check aria-hidden="true"/>}{revealed && i===selected && i!==question.correct && <X aria-hidden="true"/>}</button>;
      })}</div>
      {revealed && question.explanation && <div className="explanation" role="status" aria-live="polite"><span><Sparkles size={18}/></span><div><b>Lý giải cho đáp án đúng</b><p style={{ whiteSpace: "pre-line" }}>{question.explanation}</p>{question.id === 260 && <p className="evidence-note">Phần lý giải này là nội dung bổ sung, không phải trích dẫn pháp luật. Vui lòng xem các lưu ý kỹ thuật trong nguồn bên dưới.</p>}</div></div>}
      {revealed && <section className="evidence-block" aria-label="Nguồn và căn cứ"><h2>Nguồn và căn cứ</h2>{question.evidence.map((item, itemIndex) => <div className="evidence-item" key={`${item.kind}-${item.citation}-${itemIndex}`}><EvidenceKindLabel kind={item.kind}/><b>{item.title}</b><blockquote lang="vi">“{item.quote}”</blockquote><a href={item.url} target="_blank" rel="noreferrer">{item.citation} · Mở tài liệu gốc</a></div>)}{!question.evidence.some((item) => item.kind === "law") && <p className="evidence-note">Chưa tìm thấy trích dẫn pháp luật hoặc kỹ thuật trực tiếp xác nhận thao tác trong đáp án. Trích dẫn bộ đề chỉ xác nhận khóa đáp án, không tự nó thay thế căn cứ pháp lý.</p>}</section>}
      <div className="quiz-actions">{!revealed ? <button className="primary" disabled={selected===null} onClick={submitAnswer}>Kiểm tra đáp án</button> : <button className="primary" onClick={nextQuestion}>{index===total-1?"Xem kết quả":"Câu tiếp theo"}<ArrowRight size={17}/></button>}</div>
    </article>
  </div>;
}

function ResultView({ score, total, mode, criticalMissed, misses, reviewMisses, retry, home }: { score: number; total: number; mode: "learn" | "test"; criticalMissed: boolean; misses: Question[]; reviewMisses: () => void; retry: () => void; home: () => void }) {
  const pct = Math.round(score / total * 100);
  const passed = mode === "learn" || (score >= 45 && !criticalMissed);
  return <div className="page result-page">
    <div className="result-badge"><Trophy size={44} /></div>
    <span className="eyebrow">{mode === "test" ? (passed ? "ĐẠT" : "CHƯA ĐẠT") : "HOÀN THÀNH"}</span>
    <h1>{mode === "test" ? (passed ? "Bạn đã đạt bài thi thử." : "Hãy ôn thêm trước khi thi.") : pct >= 80 ? "Làm tốt lắm!" : "Thêm một lần luyện là thêm vững vàng"}</h1>
    <p>Bạn trả lời đúng <b>{score}/{total}</b> câu trong {mode === "test" ? "bài thi thử" : "lượt học này"}.{criticalMissed ? " Bạn đã sai câu điểm liệt nên không đạt." : mode === "test" && score < 45 ? " Cần đạt ít nhất 45/50 câu." : ""}</p>
    <div className="score-ring" style={{ "--score": `${pct * 3.6}deg` } as React.CSSProperties}><span><b>{pct}%</b><small>chính xác</small></span></div>
    <div className="result-actions">
      {misses.length > 0 && <button className="primary" onClick={reviewMisses}><BookOpen size={17} /> Ôn lại {misses.length} câu sai</button>}
      <button className="secondary" onClick={home}><Home size={17} /> Về trang chủ</button>
      <button className={misses.length > 0 ? "secondary" : "primary"} onClick={retry}><RotateCcw size={17} /> Làm lại</button>
    </div>
  </div>;
}

function Empty({icon,title,copy}:{icon:React.ReactNode;title:string;copy:string}) { return <div className="empty"><span>{icon}</span><h2>{title}</h2><p>{copy}</p></div>; }
