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

  // סנכרון זמן מחדש אם עברנו שאלה בסולו בלי לעזוב את המסך
  useEffect(() => {
    setTimeLeft(roomData.timeBanks[myTeamName] || 15);
    setIsRevealing(false);
  }, [roomData.currentQuestionIdx]);

  useEffect(() => {
    if (timeLeft <= 0 || isRevealing) return;
    const t = setInterval(() => setTimeLeft((prev: number) => prev - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, isRevealing]);

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
  
  // אלגוריתם ערבוב שאלות אחיד (Pseudo-Random)
  const seed = roomData.seed || 37;
  const qIdx = ((roomData.currentQuestionIdx || 0) * seed + 11) % availableQuestions.length;
  const question: QuestionType = availableQuestions[qIdx];

  const votes = roomData.votes || {};

  const handleVote = (optIdx: number) => {
    if (isRevealing) return; // לא ניתן לשנות בזמן חשיפה
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
    
    // משהים 1.5 שניות, מציגים נכון/לא נכון ואז ממשיכים
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

  return (
    <div style={s.layout}>
      <div style={s.clockContainer}>
        <svg width="150" height="150" viewBox="0 0 150 150">
          <circle cx="75" cy="75" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
          <circle 
            cx="75" cy="75" r={radius} fill="none" stroke="#ef4444" strokeWidth="10" 
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform="rotate(-90 75 75)" 
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div style={s.clockTime}>{timeLeft}</div>
      </div>

      <div style={s.questionCard}>
        <h2 style={s.questionText}>{question.text}</h2>
      </div>

      <div style={s.optionsGrid}>
        {question.options.map((opt: string, i: number) => {
          const votersForThis = myTeamPlayers.filter((p: any) => votes[p.id] === i);
          const isSelectedByMe = votes[userId] === i;
          
          let bgColor = isSelectedByMe ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)';
          let borderColor = isSelectedByMe ? '#ffd700' : 'rgba(255,255,255,0.2)';
          
          // לוגיקת צבעי החשיפה המיידית
          if (isRevealing) {
            if (i === question.correctIdx) {
              bgColor = 'rgba(16, 185, 129, 0.2)'; // ירוק לתשובה נכונה
              borderColor = '#10b981';
            } else if (isSelectedByMe) {
              bgColor = 'rgba(239, 68, 68, 0.2)'; // אדום אם בחרת טעות
              borderColor = '#ef4444';
            }
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
        })}
      </div>

      <button 
        onClick={handleSubmit} 
        disabled={(isIndividual ? votes[userId] === undefined : !allAgreed) || isRevealing}
        style={(isIndividual ? votes[userId] !== undefined : allAgreed) ? s.submitBtn : s.submitBtnDisabled}
      >
        {isRevealing ? "בודק..." : (isIndividual ? "סופי!" : (allAgreed ? "ננעלנו - סופי!" : "מחכים להסכמה..."))}
      </button>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', padding: '20px', direction: 'rtl', alignItems: 'center' },
  clockContainer: { position: 'relative', width: '150px', height: '150px', margin: '10px auto', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  clockTime: { position: 'absolute', fontSize: '3.5rem', fontWeight: '900', color: 'white', fontFamily: 'monospace' },
  questionCard: { width: '100%', maxWidth: '600px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '30px 20px', textAlign: 'center', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)' },
  questionText: { fontSize: '1.5rem', fontWeight: 'bold', color: '#ffd700', lineHeight: '1.4' },
  optionsGrid: { display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '600px', flex: 1 },
  optionBtn: { position: 'relative', border: '2px solid', borderRadius: '15px', padding: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' },
  optionText: { fontSize: '1.2rem', fontWeight: 'bold' },
  votersContainer: { display: 'flex', gap: '5px' },
  voterDot: { width: '12px', height: '12px', borderRadius: '50%', border: '1px solid white' },
  submitBtn: { width: '100%', maxWidth: '600px', height: '65px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '1.5rem', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 15px rgba(239,68,68,0.4)' },
  submitBtnDisabled: { width: '100%', maxWidth: '600px', height: '65px', backgroundColor: '#334155', color: '#94a3b8', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '1.2rem', cursor: 'not-allowed', marginTop: '10px' }
};