"use client";
import React, { useState, useEffect } from "react";
import questionsData from "../../src/lib/questions.json";

interface QuestionType {
  level: number;
  text: string;
  options: string[];
  correctIdx: number;
}

const ALL_QUESTIONS = questionsData as QuestionType[];

export default function GameStep({ roomData, userId, updateRoom, handleAnswer, onDirectStepChange }: any) {
  const isIndividual = roomData.gameMode === "individual";
  const me = roomData.players.find((p: any) => p.id === userId) || roomData.players[0];
  const myTeamName = isIndividual ? me.name : roomData.teamNames[me.teamIdx];
  
  const [timeLeft, setTimeLeft] = useState(roomData.timeBanks[myTeamName] || 20);
  const [isRevealing, setIsRevealing] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isSlowMo, setIsSlowMo] = useState(false);

  useEffect(() => {
    setTimeLeft(roomData.timeBanks[myTeamName] || 20);
    setIsRevealing(false);
    setHasFailed(false);
    setHiddenOptions([]);
    setIsFrozen(false);
    setIsSlowMo(false);
  }, [roomData.currentQuestionIdx, roomData.timeBanks, myTeamName]);

  // לוגיקת בחירת שאלה חכמה - מוגבל לרמה 4 (המקסימום הקיים בקובץ)
  const targetLevel = Math.min(Math.floor((roomData.currentQuestionIdx || 0) / 2) + 1, 4);
  const levelPool = ALL_QUESTIONS.filter(q => q.level === targetLevel);
  const askedTexts = roomData.askedQuestions || [];
  
  let availableQuestions = levelPool.filter(q => !askedTexts.includes(q.text));
  
  // הגנה מפני התרסקות: אם נגמרו השאלות ברמה הספציפית, לוקחים שאלה שלא נשאלה מכל המאגר
  if (availableQuestions.length === 0) {
    availableQuestions = ALL_QUESTIONS.filter(q => !askedTexts.includes(q.text));
    // מוצא אחרון בהחלט - אם הכל נשאל, מתחילים להשתמש בשאלות חוזרות כדי למנוע קריסה
    if (availableQuestions.length === 0) availableQuestions = ALL_QUESTIONS;
  }
  
  const seed = roomData.seed || 37;
  const questionIdx = (seed + (roomData.currentQuestionIdx || 0)) % availableQuestions.length;
  const currentQuestion = availableQuestions[questionIdx];

  useEffect(() => {
    if (isRevealing || isFrozen) return;
    if (timeLeft <= 0) {
      setHasFailed(true);
      setTimeout(() => handleAnswer(false, 0, currentQuestion), 1000);
      return;
    }
    const tickRate = isSlowMo ? 2000 : 1000;
    const timer = setInterval(() => setTimeLeft((prev: number) => Math.max(0, prev - 1)), tickRate);
    return () => clearInterval(timer);
  }, [timeLeft, isRevealing, isFrozen, isSlowMo, handleAnswer, currentQuestion]);

  const onOptionClick = (idx: number) => {
    if (isRevealing || isFrozen) return;
    setIsRevealing(true);
    const isCorrect = idx === currentQuestion.correctIdx;
    if (!isCorrect) setHasFailed(true);
    
    // שליחת התשובה ל-Container עם הזמן הנוכחי כניקוד
    setTimeout(() => handleAnswer(isCorrect, timeLeft, currentQuestion), 1500);
  };

  const usePowerUp = (type: string) => {
    const currentPUs = roomData.powerUps[myTeamName] || [];
    if (!currentPUs.includes(type)) return;

    const newPUs = [...currentPUs];
    newPUs.splice(newPUs.indexOf(type), 1);
    updateRoom({ [`powerUps/${myTeamName}`]: newPUs });

    if (type === '50:50') {
      const wrongIndices = currentQuestion.options
        .map((_, i) => i)
        .filter(i => i !== currentQuestion.correctIdx);
      const shuffled = wrongIndices.sort(() => 0.5 - Math.random());
      setHiddenOptions([shuffled[0], shuffled[1]]);
    } else if (type === 'freeze') {
      setIsFrozen(true);
      setTimeout(() => setIsFrozen(false), 5000);
    } else if (type === 'slow-mo') {
      setIsSlowMo(true);
    }
  };

  // לוגיקת השעון המעגלי
  const maxTime = 60;
  const progress = Math.min(Math.max(timeLeft / maxTime, 0), 1);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress * circumference);
  const clockColor = isFrozen ? "#00E5FF" : (timeLeft < 5 ? "#ef4444" : "#FF9100");

  return (
    <div style={s.layout}>
      {/* השעון המעגלי */}
      <div style={s.clockContainer}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <circle 
            cx="60" cy="60" r={radius} fill="none" stroke={clockColor} strokeWidth="8" 
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform="rotate(-90 60 60)" 
            style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 5px ${clockColor})` }}
          />
        </svg>
        <div style={s.clockTime}>{Math.round(timeLeft)}</div>
      </div>

      <div style={s.contentArea}>
        {/* שורת הכוחות - ממוקמת מתחת לשעון */}
        <div style={s.powerUpsRow}>
          {['50:50', 'freeze', 'slow-mo'].map(type => {
            const count = (roomData.powerUps[myTeamName] || []).filter((p: string) => p === type).length;
            return (
              <button key={type} onClick={() => usePowerUp(type)} disabled={count === 0 || isRevealing} style={{ ...s.puBtn, opacity: count > 0 ? 1 : 0.3 }}>
                <span style={s.puIcon}>{type === '50:50' ? '🌓' : type === 'freeze' ? '❄️' : '⏳'}</span>
                <span style={s.puCount}>x{count}</span>
              </button>
            );
          })}
        </div>

        <div style={s.questionCard}>
          <h2 style={s.questionText}>{currentQuestion.text}</h2>
        </div>

        <div style={s.optionsGrid}>
          {currentQuestion.options.map((opt, i) => {
            if (hiddenOptions.includes(i)) return <div key={i} style={s.hiddenPlaceholder} />;
            
            let borderColor = 'rgba(255,255,255,0.1)';
            let bgColor = 'rgba(255,255,255,0.05)';
            
            if (isRevealing) {
              if (i === currentQuestion.correctIdx) {
                borderColor = '#10b981';
                bgColor = 'rgba(16,185,129,0.2)';
              } else if (hasFailed) {
                borderColor = '#ef4444';
                bgColor = 'rgba(239,68,68,0.2)';
              }
            }

            return (
              <button key={i} onClick={() => onOptionClick(i)} style={{ ...s.optionBtn, borderColor, backgroundColor: bgColor }}>
                <span style={s.optionText}>{opt}</span>
                {isRevealing && i === currentQuestion.correctIdx && <span>✅</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', padding: '15px', direction: 'rtl', alignItems: 'center', boxSizing: 'border-box', overflow: 'hidden' },
  clockContainer: { position: 'relative', width: '120px', height: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: '10px' },
  clockTime: { position: 'absolute', fontSize: '2.8rem', fontWeight: '900', color: 'white', fontFamily: 'monospace' },
  contentArea: { flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '600px', gap: '15px', padding: '10px 5px', boxSizing: 'border-box' },
  powerUpsRow: { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px', flexShrink: 0 },
  puBtn: { backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'white' },
  puIcon: { fontSize: '1rem' },
  puCount: { fontSize: '0.8rem', fontWeight: 'bold' },
  questionCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '20px', padding: '20px', textAlign: 'center', border: '1px solid rgba(0,229,255,0.1)', flexShrink: 0, boxShadow: '0 4px 15px rgba(0,0,0,0.2)' },
  questionText: { fontSize: '1.2rem', fontWeight: 'bold', color: '#FF9100', lineHeight: '1.3', margin: 0 },
  optionsGrid: { display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 },
  optionBtn: { border: '2px solid', borderRadius: '15px', padding: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', color: 'white', textAlign: 'right', backgroundColor: 'transparent' },
  optionText: { fontSize: '1.1rem', fontWeight: 'bold' },
  hiddenPlaceholder: { height: '55px' }
};