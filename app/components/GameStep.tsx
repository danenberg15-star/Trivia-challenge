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

export default function GameStep({ roomData, userId, updateRoom, handleAnswer }: any) {
  const isIndividual = roomData.gameMode === "individual";
  const me = roomData.players.find((p: any) => p.id === userId);
  const myTeamName = isIndividual ? me.name : roomData.teamNames[me.teamIdx];
  const myTeamPlayers = isIndividual ? [me] : roomData.players.filter((p: any) => p.teamIdx === me.teamIdx);
  
  const [timeLeft, setTimeLeft] = useState(roomData.timeBanks[myTeamName] || 15);
  const [isRevealing, setIsRevealing] = useState(false);
  
  // Power-Ups States
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isSlowMo, setIsSlowMo] = useState(false);

  // סנכרון זמן ואיפוס כלים במעבר שאלה
  useEffect(() => {
    setTimeLeft(roomData.timeBanks[myTeamName] || 15);
    setIsRevealing(false);
    setHiddenOptions([]);
    setIsFrozen(false);
    setIsSlowMo(false);
  }, [roomData.currentQuestionIdx]);

  // טיימר חכם שתומך בהאטה ובהקפאה
  useEffect(() => {
    if (timeLeft <= 0 || isRevealing || isFrozen) return;
    const delay = isSlowMo ? 2000 : 1000;
    const t = setInterval(() => setTimeLeft((prev: number) => prev - 1), delay);
    return () => clearInterval(t);
  }, [timeLeft, isRevealing, isFrozen, isSlowMo]);

  // לוגיקת קושי דינמית
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

  const levelQuestions = ALL_QUESTIONS.filter((q: QuestionType) => q.level === targetLevel);
  const availableQuestions = levelQuestions.length > 0 ? levelQuestions : ALL_QUESTIONS; 
  
  // אלגוריתם ערבוב שאלות מושלם - השאלה הראשונה תמיד תהיה שונה!
  const seed = roomData.seed || 37;
  const qIdx = (((roomData.currentQuestionIdx || 0) + 1) * seed) % availableQuestions.length;
  const question: QuestionType = availableQuestions[qIdx];

  const votes = roomData.votes || {};

  // שליפת הכלים שנמצאים בבסיס הנתונים
  const myPowerUps = Array.isArray(roomData.powerUps?.[myTeamName])
    ? roomData.powerUps[myTeamName]
    : Object.values(roomData.powerUps?.[myTeamName] || {});

  // פונקציה לצריכת בונוס מול פיירבייס
  const handlePowerUpClick = (pu: string) => {
    const safePowerUpsObj = roomData.powerUps || {};
    let currentPUs = safePowerUpsObj[myTeamName] || [];
    if (!Array.isArray(currentPUs)) currentPUs = Object.values(currentPUs);
    
    const idx = currentPUs.indexOf(pu);
    if (idx > -1) {
      const newPUs = [...currentPUs];
      newPUs.splice(idx, 1);
      updateRoom({ powerUps: { ...safePowerUpsObj, [myTeamName]: newPUs } });
    }

    // הפעלת האפקט הלוקאלי
    if (pu === '50:50') {
      const incorrects = [0, 1, 2, 3].filter(i => i !== question.correctIdx);
      incorrects.sort(() => Math.random() - 0.5);
      setHiddenOptions([incorrects[0], incorrects[1]]);
    } else if (pu === 'freeze') {
      setIsFrozen(true);
      setTimeout(() => setIsFrozen(false), 10000); // הפשרת זמן אחרי 10 שניות
    } else if (pu === 'slow-mo') {
      setIsSlowMo(true);
    }
  };

  const handleVote = (optIdx: number) => {
    if (isRevealing || isFrozen) return; 
    let newVotes = { ...votes, [userId]: optIdx };
    if (!isIndividual && (roomData.id === 'עומר' || roomData.id === 'qa_omer_room')) {
      myTeamPlayers.forEach((p: any) => { if (p.isBot) newVotes[p.id] = optIdx; });
    }
    updateRoom({ votes: newVotes });
  };

  const myTeamVotes = myTeamPlayers.map((p: any) => votes[p.id]);
  const allVoted = myTeamVotes.every((v: any) => v !== undefined);
  const firstVote = myTeamVotes[0];
  const allAgreed = allVoted && myTeamVotes.every((v: any) => v === firstVote);

  const handleSubmit = () => {
    if (!isIndividual && !allAgreed) return;
    const finalAnswer = isIndividual ? votes[userId] : firstVote;
    const isCorrect = finalAnswer === question.correctIdx;
    
    setIsRevealing(true);
    setTimeout(() => {
      handleAnswer(isCorrect, timeLeft);
    }, 1500);
  };

  const maxTime = isIndividual ? 60 : 120;
  const progress = Math.min(Math.max(timeLeft / maxTime, 0), 1);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress * circumference);

  // חיווי ויזואלי של צבע השעון לפי כלי עזר
  const clockColor = isFrozen ? "#3b82f6" : (isSlowMo ? "#10b981" : "#ef4444");

  return (
    <div style={s.layout}>
      
      {/* Athlete Clock UI */}
      <div style={s.clockContainer}>
        <svg width="150" height="150" viewBox="0 0 150 150">
          <circle cx="75" cy="75" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
          <circle 
            cx="75" cy="75" r={radius} fill="none" stroke={clockColor} strokeWidth="10" 
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform="rotate(-90 75 75)" 
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div style={s.clockTime}>{timeLeft}</div>
      </div>

      {/* תצוגת הבונוסים (אם קיימים) */}
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
            ❄️ הזמן קפא ל-10 שניות!<br/><br/>נצלו את הזמן כדי לחשוב על השאלה. התשובות יחשפו בקרוב...
          </div>
        ) : (
          question.options.map((opt: string, i: number) => {
            const votersForThis = myTeamPlayers.filter((p: any) => votes[p.id] === i);
            const isSelectedByMe = votes[userId] === i;
            
            let bgColor = isSelectedByMe ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)';
            let borderColor = isSelectedByMe ? '#ffd700' : 'rgba(255,255,255,0.2)';
            
            if (isRevealing) {
              if (i === question.correctIdx) {
                bgColor = 'rgba(16, 185, 129, 0.2)'; 
                borderColor = '#10b981';
              } else if (isSelectedByMe) {
                bgColor = 'rgba(239, 68, 68, 0.2)'; 
                borderColor = '#ef4444';
              }
            }
            
            // הסתרת אופציות במקרה של שימוש ב-50:50
            if (hiddenOptions.includes(i)) {
              return <div key={i} style={{ ...s.optionBtn, opacity: 0, pointerEvents: 'none' }}><span style={s.optionText}>{opt}</span></div>;
            }

            return (
              <div 
                key={i} 
                onClick={() => handleVote(i)}
                style={{ ...s.optionBtn, borderColor, backgroundColor: bgColor }}
              >
                <span style={s.optionText}>{opt}</span>
                {!isIndividual && votersForThis.length > 0 && (
                  <div style={s.votersContainer}>
                    {votersForThis.map((p: any) => (
                      <div key={p.id} style={{ ...s.voterDot, backgroundColor: p.color }} title={p.name} />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <button 
        onClick={handleSubmit} 
        disabled={(isIndividual ? votes[userId] === undefined : !allAgreed) || isRevealing || isFrozen}
        style={(isIndividual ? votes[userId] !== undefined : allAgreed) ? s.submitBtn : s.submitBtnDisabled}
      >
        {isRevealing ? "בודק..." : (isFrozen ? "קפוא ❄️" : (isIndividual ? "סופי!" : (allAgreed ? "ננעלנו - סופי!" : "מחכים להסכמה...")))}
      </button>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', padding: '20px', direction: 'rtl', alignItems: 'center' },
  clockContainer: { position: 'relative', width: '150px', height: '150px', margin: '5px auto', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  clockTime: { position: 'absolute', fontSize: '3.5rem', fontWeight: '900', color: 'white', fontFamily: 'monospace' },
  powerUpsContainer: { display: 'flex', gap: '10px', marginBottom: '15px', justifyContent: 'center', flexWrap: 'wrap' },
  puBtn: { backgroundColor: 'rgba(255,215,0,0.1)', border: '1px solid #ffd700', borderRadius: '10px', color: '#ffd700', padding: '8px 15px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' },
  questionCard: { width: '100%', maxWidth: '600px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '20px', textAlign: 'center', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.1)' },
  questionText: { fontSize: '1.4rem', fontWeight: 'bold', color: '#ffd700', lineHeight: '1.4', margin: 0 },
  optionsGrid: { display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '600px', flex: 1 },
  optionBtn: { position: 'relative', border: '2px solid', borderRadius: '15px', padding: '18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' },
  optionText: { fontSize: '1.1rem', fontWeight: 'bold' },
  frozenBox: { backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '2px dashed #3b82f6', borderRadius: '15px', padding: '30px', color: '#3b82f6', fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center', width: '100%', boxSizing: 'border-box', marginTop: '20px' },
  votersContainer: { display: 'flex', gap: '5px' },
  voterDot: { width: '12px', height: '12px', borderRadius: '50%', border: '1px solid white' },
  submitBtn: { width: '100%', maxWidth: '600px', height: '65px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '1.5rem', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 15px rgba(239,68,68,0.4)' },
  submitBtnDisabled: { width: '100%', maxWidth: '600px', height: '65px', backgroundColor: '#334155', color: '#94a3b8', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '1.2rem', cursor: 'not-allowed', marginTop: '10px' }
};