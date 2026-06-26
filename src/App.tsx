/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RotateCcw, 
  RefreshCw,
  Award,
  BookOpen,
  Info,
  ChevronRight,
  HelpCircle,
  Undo
} from 'lucide-react';
import { Question } from './types';

// Default question bank - Chemistry 10: Biến thiên Enthalpy
const removeAccents = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Đ/g, 'D')
    .replace(/đ/g, 'd')
    .toUpperCase();
};

const getCorrectAnswerText = (q: Question): string => {
  const key = q.correct as keyof Question;
  return typeof q[key] === 'string' ? (q[key] as string) : '';
};

// Default question bank - Chemistry 10: Biến thiên Enthalpy
const DEFAULT_QUESTIONS: Question[] = [
  {
    "question": "Ở áp suất 1 bar và nhiệt độ 25 °C (298 K) được gọi là điều kiện gì?",
    "a": "Điều kiện chuẩn",
    "b": "Điều kiện thường",
    "c": "Nhiệt độ phòng",
    "d": "Trạng thái chuẩn",
    "correct": "a",
    "row_word": "DIEUKIENCHUAN"
  },
  {
    "question": "Phản ứng giải phóng năng lượng dưới dạng nhiệt ra môi trường được gọi là phản ứng gì?",
    "a": "Trao đổi",
    "b": "Tỏa nhiệt",
    "c": "Thu nhiệt",
    "d": "Phân hủy",
    "correct": "b",
    "row_word": "TOANHIET"
  },
  {
    "question": "Phản ứng hấp thụ năng lượng dưới dạng nhiệt từ môi trường được gọi là phản ứng gì?",
    "a": "Thu nhiệt",
    "b": "Tỏa nhiệt",
    "c": "Hóa hợp",
    "d": "Phân hủy",
    "correct": "a",
    "row_word": "THUNHIET"
  },
  {
    "question": "Nhiệt tạo thành chuẩn của các đơn chất ở dạng bền vững nhất có giá trị như thế nào?",
    "a": "Bằng một",
    "b": "Lớn hơn không",
    "c": "Nhỏ hơn không",
    "d": "Bằng không",
    "correct": "d",
    "row_word": "BANGKHONG"
  },
  {
    "question": "Biến thiên enthalpy chuẩn của một phản ứng hóa học bằng tổng nhiệt tạo thành chuẩn của các chất nào trừ đi tổng nhiệt tạo thành chuẩn của các chất đầu?",
    "a": "Tham gia",
    "b": "Sản phẩm",
    "c": "Đơn chất",
    "d": "Xúc tác",
    "correct": "b",
    "row_word": "SANPHAM"
  },
  {
    "question": "Đại lượng Eb trong công thức tính nhiệt phản ứng dựa vào năng lượng liên kết được viết tắt từ cụm từ nào?",
    "a": "Liên kết",
    "b": "Tạo thành",
    "c": "Tỏa nhiệt",
    "d": "Thu nhiệt",
    "correct": "a",
    "row_word": "LIENKET"
  },
  {
    "question": "Kí hiệu nhiệt tạo thành chuẩn của một chất là gì?",
    "a": "Entropy",
    "b": "Enthalpy",
    "c": "Energy",
    "d": "Effect",
    "correct": "b",
    "row_word": "ENTHALPY"
  },
  {
    "question": "Phản ứng phân hủy đá vôi (\\(CaCO_3\\)) hấp thụ nhiệt lượng từ môi trường, đây thuộc loại phản ứng nào?",
    "a": "Phân hủy",
    "b": "Hóa hợp",
    "c": "Thế",
    "d": "Trung hòa",
    "correct": "a",
    "row_word": "PHANHUY"
  }
];

export default function App() {
  // Core states
  const [secretKeyword, setSecretKeyword] = useState<string>("ENTHALPY");
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>(Array(DEFAULT_QUESTIONS.length).fill(null));
  const [groupName, setGroupName] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [shakingRow, setShakingRow] = useState<number | null>(null);

  // Verification modal state
  const [verificationResult, setVerificationResult] = useState<{
    show: boolean;
    allCorrect: boolean;
    correctCount: number;
    totalCount: number;
  } | null>(null);

  // Temp state for settings form
  const [settingsSecret, setSettingsSecret] = useState<string>("ENTHALPY");
  const [settingsJSON, setSettingsJSON] = useState<string>(JSON.stringify(DEFAULT_QUESTIONS, null, 2));
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Ref for active question scrolling
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Trigger MathJax rendering when questions, answers or modals change
  useEffect(() => {
    const triggerMathJax = () => {
      const windowObj = window as any;
      if (windowObj.MathJax && typeof windowObj.MathJax.typesetPromise === 'function') {
        windowObj.MathJax.typesetPromise().catch((err: any) => {
          console.warn("MathJax typeset error: ", err);
        });
      }
    };
    
    // Tiny delay to ensure React DOM has completed updates
    const timer = setTimeout(triggerMathJax, 150);
    return () => clearTimeout(timer);
  }, [questions, userAnswers, activeQuestionIndex, isSettingsOpen, verificationResult]);

  // Sync state with settings form inputs on open
  useEffect(() => {
    if (isSettingsOpen) {
      setSettingsSecret(secretKeyword);
      setSettingsJSON(JSON.stringify(questions, null, 2));
      setSettingsError(null);
    }
  }, [isSettingsOpen]);

  // Play Programmatic synthesized sounds using Web Audio API (cross-platform, offline, fast)
  const playDing = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      // Pleasant high double-beep "ding"
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.08); // E6
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Web Audio API not allowed or failed to initialize: ", e);
    }
  };

  const playBuzzer = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      // Low rasping buzz
      osc.frequency.setValueAtTime(140, ctx.currentTime); // C3
      osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.25);
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Web Audio API not allowed or failed to initialize: ", e);
    }
  };

  const playChimeSweep = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      // Sweep up
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.5);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn(e);
    }
  };

  // Auto-alignment algorithm logic
  const N_limit = Math.min(secretKeyword.length, questions.length);
  const rowCalculations = [];
  
  for (let i = 0; i < N_limit; i++) {
    const keywordChar = removeAccents(secretKeyword[i] || '');
    const rawAnswerText = getCorrectAnswerText(questions[i]);
    const rowWord = removeAccents(rawAnswerText).replace(/\s/g, '');
    let matchIndex = rowWord.indexOf(keywordChar);
    
    // Robust search: if not found, let's search case insensitively or default to 0
    if (matchIndex === -1) {
      matchIndex = 0;
    }
    
    rowCalculations.push({
      word: rowWord,
      matchIndex,
    });
  }

  const maxMatchIndex = Math.max(...rowCalculations.map(r => r.matchIndex), 0);
  
  const alignedRows = rowCalculations.map((r, i) => {
    const startColumn = maxMatchIndex - r.matchIndex;
    const endColumn = startColumn + r.word.length;
    return {
      word: r.word,
      matchIndex: r.matchIndex,
      startColumn, // 0-indexed column offset
      endColumn,
    };
  });

  const totalGridCols = Math.max(
    ...alignedRows.map(r => r.endColumn),
    maxMatchIndex + 1
  );

  // Handle student selecting an option
  const handleSelectAnswer = (qIndex: number, optionLetter: string) => {
    const isCorrect = optionLetter === questions[qIndex].correct;
    
    // Update user answer state
    const updatedAnswers = [...userAnswers];
    updatedAnswers[qIndex] = optionLetter;
    setUserAnswers(updatedAnswers);

    if (isCorrect) {
      playDing();
      
      // Auto scroll/advance to the next unsolved question to keep high momentum!
      const nextUnsolved = updatedAnswers.findIndex((ans, idx) => ans !== questions[idx].correct);
      if (nextUnsolved !== -1 && nextUnsolved < questions.length) {
        setTimeout(() => {
          setActiveQuestionIndex(nextUnsolved);
          scrollToQuestion(nextUnsolved);
        }, 300);
      }
    } else {
      playBuzzer();
      
      // Trigger temporary shake animation on the corresponding row
      setShakingRow(qIndex);
      setTimeout(() => setShakingRow(null), 350);
    }
  };

  // Safe scrolling helper
  const scrollToQuestion = (index: number) => {
    if (questionRefs.current[index]) {
      questionRefs.current[index]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  };

  // Footer: "Kiểm tra thông điệp"
  const handleCheckMessage = () => {
    let correctCount = 0;
    for (let i = 0; i < N_limit; i++) {
      if (userAnswers[i] === questions[i].correct) {
        correctCount++;
      }
    }
    
    const allCorrect = correctCount === N_limit;
    if (allCorrect) {
      playChimeSweep();
    } else {
      playBuzzer();
    }

    setVerificationResult({
      show: true,
      allCorrect,
      correctCount,
      totalCount: N_limit
    });
  };

  // Footer: "Làm lại câu sai"
  const handleRetryWrongQuestions = () => {
    const updatedAnswers = [...userAnswers];
    let resetCount = 0;
    
    for (let i = 0; i < questions.length; i++) {
      const isAnswered = updatedAnswers[i] !== null;
      const isCorrect = updatedAnswers[i] === questions[i].correct;
      if (isAnswered && !isCorrect) {
        updatedAnswers[i] = null;
        resetCount++;
      }
    }
    
    if (resetCount > 0) {
      setUserAnswers(updatedAnswers);
      playChimeSweep();
      // Set active question to the first newly reset question
      const firstReset = updatedAnswers.indexOf(null);
      if (firstReset !== -1) {
        setActiveQuestionIndex(firstReset);
        scrollToQuestion(firstReset);
      }
    }
  };

  // Footer: "Làm lại tất cả"
  const handleResetAll = () => {
    if (window.confirm("Bạn có chắc chắn muốn làm lại toàn bộ câu hỏi không?")) {
      setUserAnswers(Array(questions.length).fill(null));
      setActiveQuestionIndex(0);
      playChimeSweep();
    }
  };

  // Settings Save Handler
  const handleSaveSettings = () => {
    try {
      const trimmedSecret = removeAccents(settingsSecret.trim());
      if (!trimmedSecret) {
        setSettingsError("Từ khoá bí mật không được để trống!");
        return;
      }

      const parsedJSON = JSON.parse(settingsJSON);
      if (!Array.isArray(parsedJSON)) {
        setSettingsError("Dữ liệu câu hỏi phải là một mảng JSON!");
        return;
      }

      if (parsedJSON.length === 0) {
        setSettingsError("Danh sách câu hỏi không được rỗng!");
        return;
      }

      // Check schemas of questions
      for (let i = 0; i < parsedJSON.length; i++) {
        const q = parsedJSON[i];
        if (!q.question || !q.a || !q.b || !q.c || !q.d || !q.correct || !q.row_word) {
          setSettingsError(`Câu hỏi ở vị trí thứ ${i + 1} thiếu thuộc tính bắt buộc (question, a, b, c, d, correct, row_word).`);
          return;
        }
      }

      // Ensure the secret keyword length matches the number of questions exactly
      if (trimmedSecret.length !== parsedJSON.length) {
        setSettingsError(`Độ dài của từ khóa dọc (${trimmedSecret.length} ký tự) phải bằng đúng số lượng câu hỏi (${parsedJSON.length} câu).`);
        return;
      }

      // Save states
      setSecretKeyword(trimmedSecret);
      setQuestions(parsedJSON);
      setUserAnswers(Array(parsedJSON.length).fill(null));
      setActiveQuestionIndex(0);
      setSettingsError(null);
      setIsSettingsOpen(false);
      playChimeSweep();
    } catch (e: any) {
      setSettingsError("Lỗi cú pháp JSON: " + e.message);
    }
  };

  // Restore Defaults in settings
  const handleRestoreDefaults = () => {
    setSettingsSecret("ENTHALPY");
    setSettingsJSON(JSON.stringify(DEFAULT_QUESTIONS, null, 2));
    setSettingsError(null);
    playChimeSweep();
  };

  // Helper to check option text length for smart layout styling
  const getOptionsLayoutClass = (q: Question) => {
    const maxLen = Math.max(q.a.length, q.b.length, q.c.length, q.d.length);
    if (maxLen <= 14) {
      // Short: single line row (4 columns)
      return "grid grid-cols-2 sm:grid-cols-4 gap-2";
    } else if (maxLen <= 32) {
      // Medium: 2 rows (2 columns)
      return "grid grid-cols-1 sm:grid-cols-2 gap-2";
    } else {
      // Long: 4 rows (1 column)
      return "grid grid-cols-1 gap-1.5";
    }
  };

  return (
    <div id="crossword-app" className="min-h-screen w-full flex items-center justify-center bg-[#f4f8fc] p-2 sm:p-4 md:p-6 font-sans">
      
      {/* Outer High Density Blue Rounded Frame */}
      <div className="w-full max-w-6xl bg-white text-slate-900 font-sans p-4 md:p-6 overflow-hidden relative border-8 border-blue-900 rounded-[2rem] flex flex-col justify-between min-h-[90vh] shadow-2xl">
        
        {/* UPPER LEFT CORNER: Crimson ribbon arrow with group name input */}
        <div className="absolute top-0 left-0 z-20 flex items-center">
          <div 
            className="bg-[#900020] text-white font-bold py-2 pl-6 pr-12 text-xs md:text-sm flex items-center shadow-lg select-none transition-transform hover:scale-102"
            style={{
              clipPath: "polygon(0 0, 100% 0, 85% 50%, 100% 100%, 0 100%)",
            }}
          >
            <span className="mr-1 shrink-0 uppercase tracking-widest font-black text-xs text-rose-100">NHÓM</span>
            <input 
              type="text" 
              id="input-group-name"
              placeholder="........"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              title="Nhấp để nhập tên nhóm của bạn"
              className="bg-transparent border-none text-white focus:outline-none placeholder-rose-200/60 w-20 md:w-28 font-black focus:bg-[#b00028]/50 px-1 rounded transition-all text-xs md:text-sm tracking-widest border-b border-dashed border-rose-400 focus:border-solid focus:border-white"
            />
          </div>
        </div>

        {/* HEADER AREA */}
        <div className="flex flex-col md:flex-row items-center justify-between mt-12 md:mt-2 mb-4 gap-4 select-none">
          
          {/* Spacer or alignment offset for left ribbon */}
          <div className="w-full md:w-32 hidden md:block"></div>

          {/* MAIN CENTER TITLE: Bold, red, uppercase with shadow */}
          <h1 className="text-center font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-red-600 uppercase tracking-wider drop-shadow-sm py-1 flex-1">
            TRÒ CHƠI “Ô CHỮ BÍ MẬT”
          </h1>

          {/* UPPER RIGHT CORNER: Settings & Sound buttons (High Density Style) */}
          <div className="flex items-center gap-2 ml-auto md:ml-0 shrink-0">
            {/* Settings Button */}
            <button 
              id="btn-settings"
              onClick={() => setIsSettingsOpen(true)}
              className="w-10 h-10 bg-yellow-400 hover:bg-yellow-500 text-slate-800 rounded-lg flex items-center justify-center shadow transition-all duration-200 hover:scale-105 active:scale-95"
              title="Cài đặt thiết lập trò chơi"
            >
              <Settings className="h-5 w-5" />
            </button>
            
            {/* Sound Button */}
            <button 
              id="btn-sound"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center shadow transition-all duration-200 hover:scale-105 active:scale-95 ${soundEnabled ? 'bg-cyan-400 hover:bg-cyan-500 text-white' : 'bg-slate-300 hover:bg-slate-400 text-slate-700'}`}
              title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* MAIN BODY: 50-50 Columns split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch flex-1 my-2">
          
          {/* LEFT COLUMN (50%): RED DASHED BORDER COMPONENT */}
          <div className="border-4 border-dashed border-red-500 rounded-2xl bg-white p-4 relative flex flex-col justify-between overflow-hidden shadow-sm min-h-[350px]">
            
            {/* Section label */}
            <h2 className="text-lg md:text-xl font-bold text-slate-800 text-center uppercase tracking-wide select-none pb-2 mb-4 flex items-center justify-center gap-2">
              Giải ô chữ
            </h2>

            {/* Dynamic Responsive Crossword Grid Box */}
            <div className="flex-1 flex flex-col justify-center items-center py-4 w-full max-w-full">
              
              <div className="w-full flex flex-col gap-1.5 md:gap-2.5">
                {alignedRows.map((row, i) => {
                  const isRowSolved = userAnswers[i] === questions[i].correct;
                  const isRowActive = activeQuestionIndex === i;
                  
                  return (
                    <div 
                      key={i}
                      id={`crossword-row-${i}`}
                      onClick={() => {
                        setActiveQuestionIndex(i);
                        scrollToQuestion(i);
                      }}
                      className={`grid w-full items-center gap-x-1 cursor-pointer transition-all rounded-lg p-0.5 ${isRowActive ? 'bg-sky-50/70 shadow-sm ring-1 ring-sky-200' : 'hover:bg-slate-50/50'} ${shakingRow === i ? 'animate-shake' : ''}`}
                      style={{ 
                        gridTemplateColumns: `1.75rem repeat(${totalGridCols}, minmax(0, 1fr))` 
                      }}
                    >
                      {/* Row Badge on Column 1 */}
                      <div className={`col-start-1 flex items-center justify-center font-mono font-black text-xs md:text-sm rounded-lg h-6 w-6 md:h-7 md:w-7 transition-all ${isRowSolved ? 'bg-emerald-500 text-white' : isRowActive ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {i + 1}
                      </div>

                      {/* Render individual cells */}
                      {Array.from({ length: row.word.length }).map((_, j) => {
                        const isYellowColumn = j === row.matchIndex;
                        const char = row.word[j];
                        
                        return (
                          <div
                            key={j}
                            className={`
                              aspect-square w-full flex items-center justify-center font-mono font-extrabold border transition-all duration-300 rounded select-none text-xs sm:text-sm md:text-base md:h-8 md:w-8
                              ${isRowSolved 
                                ? isYellowColumn 
                                  ? 'bg-[#fef08a] border-[#eab308] text-[#1e40af] bg-gradient-to-b from-[#fef08a] to-[#fde047] shadow-sm animate-reveal scale-102 font-black ring-1 ring-yellow-400' 
                                  : 'bg-[#dbeafe] border-sky-300 text-[#1e40af] animate-reveal'
                                : isYellowColumn
                                  ? 'bg-[#fef08a]/60 border-[#eab308]/40 text-transparent'
                                  : 'bg-[#f8fafc] border-[#cbd5e1] text-transparent'
                              }
                            `}
                            style={{ 
                              gridColumnStart: row.startColumn + 2 + j,
                            }}
                          >
                            {isRowSolved ? char : ''}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Bottom grass decoration (High Density Theme) */}
            <div className="absolute bottom-0 left-0 w-full h-8 bg-green-500/20 blur-xs pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-full h-4 bg-green-600/30 flex justify-around pointer-events-none">
              <div className="w-2 h-full bg-green-800/10"></div>
              <div className="w-2 h-full bg-green-800/10"></div>
              <div className="w-2 h-full bg-green-800/10"></div>
              <div className="w-2 h-full bg-green-800/10"></div>
              <div className="w-2 h-full bg-green-800/10"></div>
            </div>

          </div>

          {/* RIGHT COLUMN (50%): SCROLLABLE QUESTION LIST */}
          <div className="bg-white rounded-2xl shadow-inner border border-slate-200 p-4 md:p-6 flex flex-col justify-between min-h-[350px]">
            
            {/* Scrollable question items box */}
            <div className="flex-1 overflow-y-auto max-h-[460px] pr-2 space-y-4 custom-scrollbar">
              {questions.map((q, idx) => {
                const isSelectedAnswerCorrect = userAnswers[idx] === q.correct;
                const isAnswered = userAnswers[idx] !== null;
                const isQuestionActive = activeQuestionIndex === idx;

                return (
                  <div 
                    key={idx}
                    id={`question-box-${idx}`}
                    ref={(el) => { questionRefs.current[idx] = el; }}
                    onClick={() => setActiveQuestionIndex(idx)}
                    className={`p-3 rounded-2xl border transition-all duration-300 cursor-pointer ${
                      isQuestionActive 
                        ? 'border-sky-400 bg-sky-50/40 shadow-sm ring-1 ring-sky-200' 
                        : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                  >
                    {/* Question Header */}
                    <div className="flex items-start gap-2 mb-2">
                      <span className={`inline-flex items-center justify-center text-xs font-black px-2.5 py-1 rounded-full shrink-0 ${
                        isSelectedAnswerCorrect 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : isAnswered 
                            ? 'bg-rose-100 text-rose-800' 
                            : 'bg-sky-100 text-sky-800'
                      }`}>
                        Câu {idx + 1}
                      </span>
                      
                      <div className="text-sm md:text-base font-bold text-slate-800 math-container pt-0.5 leading-relaxed">
                        {q.question}
                      </div>
                    </div>

                    {/* Options (Flex/Grid Layout depending on content length) */}
                    <div className={`${getOptionsLayoutClass(q)} mt-3 pl-2`}>
                      {['a', 'b', 'c', 'd'].map((optionKey) => {
                        const optionText = q[optionKey as keyof Question];
                        const isChosen = userAnswers[idx] === optionKey;
                        const isThisCorrect = optionKey === q.correct;
                        
                        // Style options dynamically
                        let optionStyle = "border border-slate-200 hover:border-slate-300 bg-[#f8fafc] text-slate-700";
                        if (isChosen) {
                          if (isThisCorrect) {
                            // "Khi click chọn đáp án đúng, đáp án đó đổi màu nền sang xanh dương nhạt viền xanh dương đậm."
                            optionStyle = "bg-[#dbeafe] border-2 border-[#1e40af] text-[#1e40af] font-extrabold shadow-sm";
                          } else {
                            optionStyle = "bg-rose-100 border-2 border-rose-500 text-rose-900 font-bold";
                          }
                        }

                        return (
                          <button
                            key={optionKey}
                            id={`option-btn-${idx}-${optionKey}`}
                            onClick={(e) => {
                              e.stopPropagation(); // Avoid double trigger from row click
                              handleSelectAnswer(idx, optionKey);
                            }}
                            className={`py-2 px-3 rounded-xl text-xs md:text-sm text-left transition-all duration-150 flex items-center gap-2 ${optionStyle}`}
                          >
                            <span className="font-mono font-black text-xs opacity-75 uppercase mr-1">{optionKey}.</span>
                            <span className="math-container">{optionText}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Micro instructions / tips */}
            <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 select-none justify-center">
              <Info className="h-3 w-3 text-sky-400 shrink-0" />
              <span>Click câu hỏi để chọn, chọn đáp án <strong>đúng</strong> để mở khóa ô chữ tương ứng ở bên trái!</span>
            </div>

          </div>

        </div>

        {/* FOOTER: Pill-shaped 3 buttons row */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4">
          
          {/* Button 1: Kiểm tra thông điệp (Navy blue background) */}
          <button
            id="btn-verify-message"
            onClick={handleCheckMessage}
            className="px-6 py-2 bg-blue-900 text-white rounded-full font-bold shadow-md hover:bg-blue-800 active:scale-95 transition-all duration-150 flex items-center gap-2 cursor-pointer text-xs md:text-sm uppercase tracking-wide"
          >
            <CheckCircle2 className="h-4 w-4" />
            Kiểm tra thông điệp
          </button>

          {/* Button 2: Làm lại câu sai (Pink/Rose background) */}
          <button
            id="btn-retry-failed"
            onClick={handleRetryWrongQuestions}
            className="px-6 py-2 bg-pink-500 text-white rounded-full font-bold shadow-md hover:bg-pink-600 active:scale-95 transition-all duration-150 flex items-center gap-2 cursor-pointer text-xs md:text-sm uppercase tracking-wide"
          >
            <Undo className="h-4 w-4" />
            Làm lại câu sai
          </button>

          {/* Button 3: Làm lại tất cả (Pink/Rose background) */}
          <button
            id="btn-reset-all"
            onClick={handleResetAll}
            className="px-6 py-2 bg-pink-500 text-white rounded-full font-bold shadow-md hover:bg-pink-600 active:scale-95 transition-all duration-150 flex items-center gap-2 cursor-pointer text-xs md:text-sm uppercase tracking-wide"
          >
            <RefreshCw className="h-4 w-4" />
            Làm lại tất cả
          </button>

        </div>

      </div>

      {/* POPUP: CÀI ĐẶT THIẾT LẬP TRÒ CHƠI */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 md:p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            
            {/* Settings Header */}
            <div className="bg-amber-400 p-4 flex items-center justify-between text-slate-800 select-none">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 animate-spin-slow" />
                <h3 className="font-display font-black text-base md:text-lg uppercase tracking-wider">
                  Cài đặt thiết lập trò chơi
                </h3>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="hover:bg-amber-500 p-1.5 rounded-lg transition-colors text-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Settings Body */}
            <div className="p-4 md:p-6 overflow-y-auto space-y-4 flex-1">
              
              {settingsError && (
                <div className="bg-rose-50 border-l-4 border-rose-500 p-3 rounded-lg flex items-start gap-2 text-rose-800 text-xs md:text-sm">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>{settingsError}</div>
                </div>
              )}

              {/* Secret Keyword Input */}
              <div className="space-y-1">
                <label className="block text-xs md:text-sm font-extrabold text-slate-700 uppercase tracking-wide">
                  Từ khoá bí mật cột dọc
                </label>
                <input 
                  type="text"
                  value={settingsSecret}
                  onChange={(e) => setSettingsSecret(e.target.value)}
                  placeholder="Nhập từ khóa dọc (Ví dụ: ENTHALP)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none uppercase font-mono font-bold"
                />
                <p className="text-[10px] text-slate-400 italic">Mỗi chữ cái tương ứng với 1 hàng ngang câu hỏi theo thứ tự dọc.</p>
              </div>

              {/* Question Bank JSON Area */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs md:text-sm font-extrabold text-slate-700 uppercase tracking-wide">
                    Ngân hàng Câu hỏi (JSON)
                  </label>
                  
                  <button 
                    type="button"
                    onClick={handleRestoreDefaults}
                    className="text-[11px] text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Khôi phục mặc định
                  </button>
                </div>
                
                <textarea 
                  value={settingsJSON}
                  onChange={(e) => setSettingsJSON(e.target.value)}
                  rows={10}
                  className="w-full bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl p-4 focus:ring-2 focus:ring-sky-500 focus:outline-none focus:bg-slate-950"
                  placeholder="Dán mã mảng JSON câu hỏi tại đây"
                />
                
                <div className="text-[10px] text-slate-400 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-600 block">Cấu trúc mẫu mỗi phần tử:</span>
                  <code className="block text-slate-500 whitespace-pre-wrap select-all font-mono leading-relaxed">
                    {`{\n  "question": "Câu hỏi...",\n  "a": "Đáp án A...", "b": "B...", "c": "C...", "d": "D...",\n  "correct": "a",\n  "row_word": "TUKHOAHANGNGANG"\n}`}
                  </code>
                </div>
              </div>

            </div>

            {/* Settings Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs md:text-sm cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              
              <button
                id="btn-save-settings-submit"
                onClick={handleSaveSettings}
                className="bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold py-2 px-5 rounded-xl text-xs md:text-sm cursor-pointer shadow transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                Lưu & Khởi tạo lại Ô chữ
              </button>
            </div>

          </div>
        </div>
      )}

      {/* POPUP: KẾT QUẢ KIỂM TRA THÔNG ĐIỆP */}
      {verificationResult?.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 text-center p-6 space-y-4">
            
            {verificationResult.allCorrect ? (
              // SOLVED ALL SUCCESSFULLY!
              <>
                <div className="mx-auto bg-emerald-100 text-emerald-600 p-4 rounded-full h-16 w-16 flex items-center justify-center animate-bounce">
                  <Award className="h-10 w-10" />
                </div>
                
                <h3 className="font-display font-black text-xl md:text-2xl text-emerald-600 uppercase tracking-wide">
                  Chúc mừng chiến thắng!
                </h3>
                
                <div className="text-slate-600 text-sm md:text-base leading-relaxed">
                  Nhóm của bạn đã hoàn thành xuất sắc tất cả <strong className="text-emerald-600">{verificationResult.totalCount}</strong> câu hỏi và giải mã hoàn toàn từ khóa bí mật cột dọc:
                  
                  <div className="my-4 flex items-center justify-center gap-1 font-mono text-xl font-black text-yellow-950">
                    {secretKeyword.split('').map((char, index) => (
                      <span key={index} className="bg-yellow-300 border-2 border-yellow-500 rounded px-2.5 py-1 shadow-sm">
                        {char}
                      </span>
                    ))}
                  </div>

                  {secretKeyword === "ENTHALPY" && (
                    <div className="bg-sky-50 p-3 rounded-2xl border border-sky-100 text-xs text-sky-800 text-left mt-2 space-y-1">
                      <span className="font-bold flex items-center gap-1"><BookOpen className="h-3.5 w-3.5 text-sky-600" /> Biến thiên Enthalpy:</span>
                      <p className="leading-relaxed">Biến thiên enthalpy (ký hiệu là $\Delta H$) là một đại lượng nhiệt động lực học mô tả lượng nhiệt tỏa ra hoặc hấp thụ bởi một hệ thống trong một quá trình hóa học ở áp suất không đổi. Giúp xác định phản ứng là tỏa nhiệt ($\Delta H &lt; 0$) hay thu nhiệt ($\Delta H &gt; 0$).</p>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setVerificationResult(null)}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold py-2.5 rounded-2xl shadow transition-colors cursor-pointer"
                  >
                    Tiếp tục ôn tập
                  </button>
                </div>
              </>
            ) : (
              // NOT SOLVED FULLY YET
              <>
                <div className="mx-auto bg-rose-100 text-rose-500 p-4 rounded-full h-16 w-16 flex items-center justify-center">
                  <HelpCircle className="h-10 w-10" />
                </div>
                
                <h3 className="font-display font-black text-xl text-rose-600 uppercase tracking-wide">
                  Chưa Hoàn Thành!
                </h3>
                
                <p className="text-slate-600 text-sm leading-relaxed">
                  Hiện tại nhóm mới chỉ giải chính xác <strong className="text-rose-500">{verificationResult.correctCount}/{verificationResult.totalCount}</strong> câu hỏi.
                </p>

                <div className="bg-slate-50 p-3 rounded-2xl text-xs text-slate-500 text-left space-y-1">
                  <span className="font-bold text-slate-600 flex items-center gap-1"><Info className="h-3.5 w-3.5" /> Gợi ý:</span>
                  <p>Mỗi câu trả lời đúng sẽ lật mở chữ cái của từ khóa tương ứng ở cột trái. Hãy click vào các hàng ô chữ bị khuyết để tìm câu hỏi và điền đáp án chính xác nhé!</p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setVerificationResult(null)}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-2xl shadow transition-colors cursor-pointer"
                  >
                    Quay lại giải tiếp
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
