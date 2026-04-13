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
  
  const [timeLeft, setTimeLeft] = useState(roomData.timeBanks[myTeamName] || 15);
  const [isRevealing, setIsRevealing] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isSlowMo, setIsSlowMo] = useState(false);

  useEffect(() => {
    setTimeLeft(roomData.timeBanks[myTeamName] || 15);
  }, [roomData.timeBanks, myTeamName]);

  // לוגיקת בחירת שאלה עם סינון כפילויות
  const currentLevel = Math.min(Math.floor((roomData.currentQuestionIdx || 0) / 2) + 1, 10);
  
  // 1. סינון לפי רמה
  const levelQuestions = ALL_QUESTIONS.filter(q => q.level === currentLevel);
  
  // 2. סינון שאלות שכבר נשאלו בסבב הנוכחי
  const askedTexts = roomData.askedQuestions || [];
  const availableQuestions = levelQuestions.filter(q => !askedTexts.includes(q.text));
  
  // 3. בחירת מאגר: אם נגמרו השאלות ברמה הזו, נשתמש בכל הרמה (למניעת קריסה), אחרת רק בחדשות
  const pool = availableQuestions.length > 0 ? availableQuestions : levelQuestions;
  
  // 4. בחירת השאלה הספציפית
  const questionIdx = (roomData.seed + (roomData.currentQuestionIdx || 0)) % pool.length;
  const currentQuestion = pool[questionIdx];

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
    if (isRevealing) return;
    setIsRevealing(true);
    const isCorrect = idx === currentQuestion.correctIdx;
    if (!isCorrect) setHasFailed(true);
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

  return (
    <div style={s.layout}>
      <div style={s.header}>
        <div style={s.teamInfo}>
          <div style={s.teamName}>{myTeamName}</div>
          <div style={s.scoreBadge}>{Math.round(timeLeft)}s</div>
        </div>
        <div style={s.progressContainer}>
          <div style={s.levelText}>רמה {currentLevel}</div>
          <div style={s.qCounter}>שאלה {roomData.currentQuestionIdx + 1}</div>
        </div>
      </div>

      <div style={s.timerBarContainer}>
        <div style={{
          ...s.timerBar,
          width: `${(timeLeft / 30) * 100}%`,
          backgroundColor: timeLeft < 5 ? '#ef4444' : (isFrozen ? '#00E5FF' : '#FF9100'),
          boxShadow: isFrozen ? '0 0 15px #00E5FF' : 'none'
        }} />
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

      <div style={s.footer}>
        <div style={s.powerUpLabel}>בונוסים זמינים:</div>
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
      </div>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', padding: '20px', boxSizing: 'border-box', direction: 'rtl' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  teamInfo: { display: 'flex', flexDirection: 'column' },
  teamName: { fontSize: '1.2rem', fontWeight: 'bold', color: '#00E5FF' },
  scoreBadge: { fontSize: '1.5rem', fontWeight: '900', color: 'white' },
  progressContainer: { textAlign: 'left' },
  levelText: { fontSize: '0.9rem', color: '#FF9100' },
  qCounter: { fontSize: '0.8rem', opacity: 0.6 },
  timerBarContainer: { width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginBottom: '30px', overflow: 'hidden' },
  timerBar: { height: '100%', transition: 'all 1s linear' },
  questionCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '25px', padding: '30px', marginBottom: '25px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' },
  questionText: { fontSize: '1.4rem', fontWeight: 'bold', lineHeight: '1.4' },
  optionsGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '12px', flex: 1 },
  optionBtn: { border: '2px solid', borderRadius: '18px', padding: '18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', color: 'white', textAlign: 'right' },
  optionText: { fontSize: '1.1rem', fontWeight: 'bold' },
  hiddenPlaceholder: { height: '60px' },
  footer: { marginTop: 'auto', padding: '20px 0' },
  powerUpLabel: { fontSize: '0.9rem', opacity: 0.6, marginBottom: '10px', textAlign: 'center' },
  powerUpsRow: { display: 'flex', justifyContent: 'center', gap: '15px' },
  puBtn: { backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'white' },
  puIcon: { fontSize: '1.2rem' },
  puCount: { fontSize: '0.9rem', fontWeight: 'bold' }
};