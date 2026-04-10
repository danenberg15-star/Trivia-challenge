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
  const myTeamPlayers = isIndividual ? [me] : roomData.players.filter((p: any) => p.teamIdx === me.teamIdx);
  
  const [timeLeft, setTimeLeft] = useState(roomData.timeBanks[myTeamName] || 15);
  const [isRevealing, setIsRevealing] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isSlowMo, setIsSlowMo] = useState(false);

  useEffect(() => {
    setTimeLeft(roomData.timeBanks[myTeamName] || 15);
    setIsRevealing(false);
    setHasFailed(false);
    setHiddenOptions([]);
    setIsFrozen(false);
    setIsSlowMo(false);
  }, [roomData.currentQuestionIdx, roomData.timeBanks, myTeamName]);

  useEffect(() => {
    if (timeLeft <= 0 || isRevealing || isFrozen || hasFailed) return;
    const delay = isSlowMo ? 2000 : 1000;
    const t = setInterval(() => setTimeLeft((prev: number) => prev - 1), delay);
    return () => clearInterval(t);
  }, [timeLeft, isRevealing, isFrozen, isSlowMo, hasFailed]);

  useEffect(() => {
    if (timeLeft <= 0 && !hasFailed && !isRevealing) {
      setHasFailed(true);
      if (onDirectStepChange) {
        onDirectStepChange(9); 
      } else {
        handleAnswer(false, 0, ""); 
      }
    }
  }, [timeLeft, hasFailed, isRevealing, onDirectStepChange, handleAnswer]);

  const difficulty = roomData.difficulty || 'dynamic';
  const timeBanksArray = Object.values(roomData.timeBanks || {}) as number[];
  const maxTimeInGame = timeBanksArray.length > 0 ? Math.max(...timeBanksArray) : 15;

  let targetLevel = 1;
  if (difficulty === 'easy') {
    targetLevel = maxTimeInGame <= 40 ? 1 : ((roomData.currentQuestionIdx % 2) + 1); 
  } else if (difficulty === 'hard') {
    targetLevel = maxTimeInGame <= 30 ? 3 : 4;
  } else {
    if (maxTimeInGame <= 20) targetLevel = 1;
    else if (maxTimeInGame <= 40) targetLevel = 2;
    else if (maxTimeInGame <= 55) targetLevel = 3;
    else targetLevel = 4;
  }

  const levelPool = ALL_QUESTIONS.filter((q: QuestionType) => q.level === targetLevel);
  
  // === מערכת הזיכרון: מניעת כפילויות שאישרת להוסיף ===
  const askedTexts = roomData.askedQuestions || [];
  let filteredPool = levelPool.filter(q => !askedTexts.includes(q.text));
  if (filteredPool.length === 0) filteredPool = levelPool; // גיבוי במידה והמאגר התרוקן לחלוטין

  const seed = roomData.seed || 37;
  const qIdx = (((roomData.currentQuestionIdx || 0) + 1) * seed) % filteredPool.length;
  const question: QuestionType = filteredPool[qIdx];

  const votes = roomData.votes || {};

  const safePowerUpsObj = roomData.powerUps || {};
  let myPowerUps = safePowerUpsObj[myTeamName] || [];
  if (!Array.isArray(myPowerUps)) myPowerUps = Object.values(myPowerUps);

  const handlePowerUpClick = (pu: string) => {
    let currentPUs = [...myPowerUps];
    const idx = currentPUs.indexOf(pu);
    if (idx > -1) {
      currentPUs.splice(idx, 1);
      updateRoom({ powerUps: { ...safePowerUpsObj, [myTeamName]: currentPUs } });
    }

    if (pu === '50:50') {
      const incorrects = [0, 1, 2, 3].filter(i => i !== question.correctIdx);
      incorrects.sort(() => Math.random() - 0.5);
      setHiddenOptions([incorrects[0], incorrects[1]]);
    } else if (pu === 'freeze') {
      setIsFrozen(true);
      setTimeout(() => setIsFrozen(false), 10000); 
    } else if (pu === 'slow-mo') {
      setIsSlowMo(true);
    }
  };

  const handleVote = (optIdx: number) => {
    if (isRevealing || isFrozen || hasFailed) return; 
    let newVotes = { ...votes, [userId]: optIdx };
    updateRoom({ votes: newVotes });
  };

  const handleSubmit = () => {
    if (votes[userId] === undefined) return;
    setIsRevealing(true);
    setTimeout(() => {
      // מעביר גם את טקסט השאלה למנהל הסטייט כדי שישמור בזיכרון
      handleAnswer(votes[userId] === question.correctIdx, timeLeft, question.text);
    }, 1500);
  };

  const maxTime = 60;
  const progress = Math.min(Math.max(timeLeft / maxTime, 0), 1);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress * circumference);

  const clockColor = isFrozen ? "#00E5FF" : (isSlowMo ? "#FF9100" : "#ef4444");

  return (
    <div style={s.layout}>
      
      <div style={s.clockContainer}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <circle 
            cx="60" cy="60" r={radius} fill="none" stroke={clockColor} strokeWidth="8" 
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform="rotate(-90 60 60)" 
            style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 5px ${clockColor})` }}
          />
        </svg>
        <div style={s.clockTime}>{timeLeft}</div>
      </div>

      <div style={s.contentArea}>
        {myPowerUps.length > 0 && !isRevealing && (
          <div style={s.powerUpsContainer}>
            {myPowerUps.map((pu: string, i: number) => (
               <button key={i} onClick={() => handlePowerUpClick(pu)} style={s.puBtn}>
                  {pu === '50:50' && '🌗 50:50'}
                  {pu === 'freeze' && '❄️ הקפאה'}
                  {pu === 'slow-mo' && '🐢 האטה'}
               </button>
            ))}
          </div>
        )}

        <div style={s.questionCard}>
          <h2 style={s.questionText}>{question.text}</h2>
        </div>

        <div style={s.optionsGrid}>
          {isFrozen ? (
            <div style={s.frozenBox}>
              ❄️ הזמן קפא ל-10 שניות!<br/><br/>נצלו את הזמן כדי לחשוב על השאלה.
            </div>
          ) : (
            question.options.map((opt: string, i: number) => {
              const isSelectedByMe = votes[userId] === i;
              
              let bgColor = isSelectedByMe ? 'rgba(255,145,0,0.1)' : 'rgba(255,255,255,0.03)';
              let borderColor = isSelectedByMe ? '#FF9100' : 'rgba(255,255,255,0.15)';
              
              if (isRevealing) {
                if (i === question.correctIdx) {
                  bgColor = 'rgba(0, 229, 255, 0.15)'; 
                  borderColor = '#00E5FF';
                } else if (isSelectedByMe) {
                  bgColor = 'rgba(239, 68, 68, 0.15)'; 
                  borderColor = '#ef4444';
                }
              }
              
              if (hiddenOptions.includes(i)) {
                return <div key={i} style={{ ...s.optionBtn, opacity: 0, pointerEvents: 'none' }}><span style={s.optionText}>{opt}</span></div>;
              }

              return (
                <div 
                  key={i} 
                  onClick={() => handleVote(i)}
                  style={{ ...s.optionBtn, borderColor, backgroundColor: bgColor, transform: isSelectedByMe && !isRevealing ? 'scale(1.02)' : 'scale(1)' }}
                >
                  <span style={{...s.optionText, color: isRevealing && i === question.correctIdx ? '#00E5FF' : 'white'}}>{opt}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div style={s.footer}>
        <button 
          onClick={handleSubmit} 
          disabled={votes[userId] === undefined || isRevealing || isFrozen}
          style={votes[userId] !== undefined ? s.submitBtn : s.submitBtnDisabled}
        >
          {isRevealing ? "בודק..." : (isFrozen ? "קפוא ❄️" : "סופי!")}
        </button>
      </div>

    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', padding: '15px', direction: 'rtl', alignItems: 'center', boxSizing: 'border-box', overflow: 'hidden' },
  clockContainer: { position: 'relative', width: '120px', height: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: '10px' },
  clockTime: { position: 'absolute', fontSize: '2.8rem', fontWeight: '900', color: 'white', fontFamily: 'monospace' },
  contentArea: { flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '600px', overflowY: 'auto', gap: '15px', padding: '10px 5px', boxSizing: 'border-box' },
  powerUpsContainer: { display: 'flex', gap: '10px', justifyContent: 'flex-start', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '5px', flexShrink: 0, width: '100%' },
  puBtn: { flexShrink: 0, backgroundColor: 'rgba(255,145,0,0.1)', border: '1px solid #FF9100', borderRadius: '10px', color: '#FF9100', padding: '8px 12px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' },
  questionCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '20px', padding: '20px', textAlign: 'center', border: '1px solid rgba(0,229,255,0.1)', flexShrink: 0, boxShadow: '0 4px 15px rgba(0,0,0,0.2)' },
  questionText: { fontSize: '1.3rem', fontWeight: 'bold', color: '#FF9100', lineHeight: '1.4', margin: 0 },
  optionsGrid: { display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 },
  optionBtn: { position: 'relative', border: '2px solid', borderRadius: '15px', padding: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', boxSizing: 'border-box' },
  optionText: { fontSize: '1.1rem', fontWeight: 'bold' },
  frozenBox: { backgroundColor: 'rgba(0, 229, 255, 0.05)', border: '2px dashed #00E5FF', borderRadius: '15px', padding: '25px', color: '#00E5FF', fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center', boxSizing: 'border-box' },
  footer: { width: '100%', maxWidth: '600px', padding: '10px 0', flexShrink: 0, boxSizing: 'border-box' },
  submitBtn: { width: '100%', height: '65px', backgroundColor: '#FF9100', color: '#05081c', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '1.5rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(255,145,0,0.4)', transition: 'transform 0.2s' },
  submitBtnDisabled: { width: '100%', height: '65px', backgroundColor: '#1a1d2e', color: '#4b5563', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '15px', fontWeight: '900', fontSize: '1.2rem', cursor: 'not-allowed' }
};