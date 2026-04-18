"use client";
import React, { useState, useEffect, useRef } from "react";
import questionsData from "../../src/lib/questions.json";

interface QuestionType {
  level: number;
  text: string;
  options: string[];
  correctIdx: number;
}

const ALL_QUESTIONS = questionsData as QuestionType[];

export default function MultiplayerGameStep({ roomData, userId, updateRoom, handleAnswer, onDirectStepChange }: any) {
  const me = roomData.players.find((p: any) => p.id === userId);
  const myTeamName = roomData.teamNames[me.teamIdx];
  const myTeamPlayers = roomData.players.filter((p: any) => p.teamIdx === me.teamIdx);
  
  const [timeLeft, setTimeLeft] = useState<number>(roomData.timeBanks[myTeamName] || 15);
  const [hasFailed, setHasFailed] = useState(false);
  const [isReadingDelay, setIsReadingDelay] = useState(true);
  
  const currentEffect = roomData.teamEffects?.[myTeamName] || {};
  const isEffectActive = currentEffect.qIdx === roomData.currentQuestionIdx;
  const isFrozen = isEffectActive && currentEffect.type === 'freeze' && Date.now() < currentEffect.expiresAt;
  const isSlowMo = isEffectActive && currentEffect.type === 'slow-mo';
  const hiddenOptions = (isEffectActive && currentEffect.type === '50:50') ? currentEffect.hidden : [];

  // תוספת: סטייט למדידת טיימר ההקפאה החי (במשחק הקבוצתי)
  const [freezeCountdown, setFreezeCountdown] = useState(0);

  useEffect(() => {
    setTimeLeft(roomData.timeBanks[myTeamName] || 15);
    setHasFailed(false);
    setIsReadingDelay(true); 
  }, [roomData.currentQuestionIdx, myTeamName]); 

  useEffect(() => {
    if (!isReadingDelay) return;
    const delayTimer = setTimeout(() => setIsReadingDelay(false), 2000);
    return () => clearTimeout(delayTimer);
  }, [isReadingDelay, roomData.currentQuestionIdx]);

  useEffect(() => {
    if (timeLeft <= 0 || isFrozen || hasFailed || isReadingDelay) return;
    const delay = isSlowMo ? 2000 : 1000;
    const t = setInterval(() => setTimeLeft((prev: number) => prev - 1), delay);
    return () => clearInterval(t);
  }, [timeLeft, isFrozen, isSlowMo, hasFailed, isReadingDelay]);

  // לוגיקת טיימר ההקפאה הענק
  useEffect(() => {
    let interval: any;
    if (isFrozen && currentEffect.expiresAt) {
      const calculateRemain = () => Math.max(0, Math.ceil((currentEffect.expiresAt - Date.now()) / 1000));
      setFreezeCountdown(calculateRemain());
      interval = setInterval(() => {
        setFreezeCountdown(calculateRemain());
      }, 500); // מתעדכן פעמיים בשנייה כדי להישאר מסונכרן בדיוק
    }
    return () => clearInterval(interval);
  }, [isFrozen, currentEffect.expiresAt]);

  useEffect(() => {
    if (timeLeft <= 0 && !hasFailed) {
      setHasFailed(true);
      if (onDirectStepChange) onDirectStepChange(9); 
      else handleAnswer(false, 0, ""); 
    }
  }, [timeLeft, hasFailed, onDirectStepChange, handleAnswer]);

  const difficulty = roomData.difficulty || 'dynamic';
  const timeBanksArray = Object.values(roomData.timeBanks || {}) as number[];
  const maxTimeInGame = timeBanksArray.length > 0 ? Math.max(...timeBanksArray) : 15;

  let targetLevel = 1;
  if (difficulty === 'easy') targetLevel = maxTimeInGame <= 60 ? 1 : ((roomData.currentQuestionIdx % 2) + 1); 
  else if (difficulty === 'hard') targetLevel = maxTimeInGame <= 60 ? 3 : 4;
  else {
    if (maxTimeInGame <= 40) targetLevel = 1;
    else if (maxTimeInGame <= 80) targetLevel = 2;
    else if (maxTimeInGame <= 105) targetLevel = 3;
    else targetLevel = 4;
  }

  const levelPool = ALL_QUESTIONS.filter((q: QuestionType) => q.level === targetLevel);
  const askedTexts = roomData.askedQuestions || [];
  let filteredPool = levelPool.filter(q => !askedTexts.includes(q.text));
  if (filteredPool.length === 0) filteredPool = levelPool;

  const seed = roomData.seed || 37;
  const qIdx = (((roomData.currentQuestionIdx || 0) + 1) * seed) % filteredPool.length;
  const question: QuestionType = filteredPool[qIdx];

  const handlePowerUpClick = (pu: string) => {
    const safePowerUpsObj = roomData.powerUps || {};
    let myPowerUps = [...(safePowerUpsObj[myTeamName] || [])];
    const idx = myPowerUps.indexOf(pu);
    if (idx > -1) {
      myPowerUps.splice(idx, 1);
      let effectData: any = { type: pu, qIdx: roomData.currentQuestionIdx };
      if (pu === '50:50') {
        const incorrects = [0, 1, 2, 3].filter(i => i !== question.correctIdx);
        incorrects.sort(() => Math.random() - 0.5);
        effectData.hidden = [incorrects[0], incorrects[1]];
      } else if (pu === 'freeze') {
        effectData.expiresAt = Date.now() + 10000;
      }
      updateRoom({ 
        powerUps: { ...safePowerUpsObj, [myTeamName]: myPowerUps },
        teamEffects: { ...(roomData.teamEffects || {}), [myTeamName]: effectData }
      });
    }
  };

  const handleVote = (optIdx: number) => {
    if (isFrozen || hasFailed) return; 
    let newVotes = { ...(roomData.votes || {}), [userId]: optIdx };
    if (roomData.id === 'עומר' || roomData.id === 'qa_omer_room') {
      myTeamPlayers.forEach((p: any) => { if (p.isBot) newVotes[p.id] = optIdx; });
    }
    updateRoom({ votes: newVotes });
  };

  const roomDataRef = useRef(roomData);
  useEffect(() => { roomDataRef.current = roomData; }, [roomData]);

  useEffect(() => {
    if ((roomData.id === 'עומר' || roomData.id === 'qa_omer_room') && !isFrozen && !hasFailed) {
      const botTimer = setTimeout(() => {
        const currentRoom = roomDataRef.current;
        if (currentRoom.step !== 5) return;
        
        const botTeamIdx = 1; 
        const botPlayers = currentRoom.players.filter((p: any) => p.teamIdx === botTeamIdx && p.isBot);
        
        if (botPlayers.length > 0) {
          const isCorrect = currentRoom.currentQuestionIdx % 2 === 0;
          const botChoice = isCorrect ? question.correctIdx : (question.correctIdx + 1) % 4;
          
          let newVotes = { ...(currentRoom.votes || {}) };
          botPlayers.forEach((p: any) => { newVotes[p.id] = botChoice; });
          
          updateRoom({ votes: newVotes });
        }
      }, 7000); 
      return () => clearTimeout(botTimer);
    }
  }, [roomData.currentQuestionIdx, roomData.id, isFrozen, hasFailed, question.correctIdx]);

  const votes = roomData.votes || {};
  const myTeamVotes = myTeamPlayers.map((p: any) => votes[p.id]);
  const allVoted = myTeamVotes.every((v: any) => v !== undefined);
  const firstVote = myTeamVotes[0];
  const allAgreed = allVoted && myTeamVotes.every((v: any) => v === firstVote);

  const handleSubmit = () => {
    if (!allAgreed) return;
    handleAnswer(firstVote === question.correctIdx, timeLeft, question);
  };

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(timeLeft / 120, 0), 1);
  const strokeDashoffset = circumference - (progress * circumference);
  const clockColor = isFrozen ? "#00E5FF" : (isSlowMo ? "#FF9100" : "#ef4444");

  return (
    <div style={s.layout}>
      <div style={s.clockContainer}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <circle cx="60" cy="60" r={radius} fill="none" stroke={clockColor} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform="rotate(-90 60 60)" style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 5px ${clockColor})` }} />
        </svg>
        <div style={s.clockTime}>{timeLeft}</div>
      </div>

      <div style={s.contentArea}>
        <div style={s.powerUpsRow}>
          {['50:50', 'freeze', 'slow-mo'].map(type => {
            const count = (roomData.powerUps?.[myTeamName] || []).filter((p: string) => p === type).length;
            return (
              <button 
                key={type} 
                onClick={() => handlePowerUpClick(type)} 
                disabled={count === 0} 
                style={{ ...s.puBtn, opacity: count > 0 ? 1 : 0.3 }}
              >
                <span style={s.puIcon}>
                  {type === '50:50' ? '🌗' : type === 'freeze' ? '❄️' : '🐢'}
                </span>
                <span style={s.puCount}>x{count}</span>
              </button>
            );
          })}
        </div>

        <div style={s.questionCard}><h2 style={s.questionText}>{question.text}</h2></div>

        <div style={s.optionsGrid}>
          {isFrozen ? (
            <div style={s.frozenBox}>
              <span style={{ fontSize: '2.5rem', marginBottom: '5px', display: 'block' }}>❄️</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#00E5FF', marginBottom: '10px', display: 'block' }}>זמן קפוא!</span>
              <span style={{ fontSize: '7rem', fontWeight: '900', color: '#00E5FF', lineHeight: 1, textShadow: '0 0 20px rgba(0,229,255,0.8)', display: 'block' }}>
                {freezeCountdown}
              </span>
            </div>
          ) : (
            question.options.map((opt: string, i: number) => {
              const votersForThis = myTeamPlayers.filter((p: any) => votes[p.id] === i);
              const isSelectedByMe = votes[userId] === i;
              if (hiddenOptions.includes(i)) return <div key={i} style={{ ...s.optionBtn, opacity: 0, pointerEvents: 'none' }} />;
              return (
                <div key={i} onClick={() => handleVote(i)} style={{ ...s.optionBtn, borderColor: isSelectedByMe ? '#FF9100' : 'rgba(255,255,255,0.15)', backgroundColor: isSelectedByMe ? 'rgba(255,145,0,0.1)' : 'transparent' }}>
                  <span style={s.optionText}>{opt}</span>
                  <div style={s.votersContainer}>
                    {votersForThis.map((p: any) => <div key={p.id} style={{ ...s.voterDot, backgroundColor: p.color, boxShadow: `0 0 5px ${p.color}` }} />)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div style={s.footer}>
        <div style={s.rosterContainer}>
          <div style={s.rosterLabel}>סטטוס קבוצה:</div>
          <div style={s.rosterGrid}>
            {myTeamPlayers.map((p: any) => (
              <div key={p.id} style={s.rosterItem}>
                <div style={{...s.rosterDot, backgroundColor: p.color}} />
                <span style={s.rosterName}>{p.name}</span>
                <span style={s.rosterStatus}>{votes[p.id] !== undefined ? '✅' : '⏳'}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={handleSubmit} disabled={!allAgreed || isFrozen} style={allAgreed ? s.submitBtn : s.submitBtnDisabled}>
          {isFrozen ? "קפוא ❄️" : (allAgreed ? "ננעלנו - סופי!" : "מחכים להסכמה...")}
        </button>
      </div>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', padding: '15px', direction: 'rtl', alignItems: 'center', boxSizing: 'border-box', overflow: 'hidden' },
  clockContainer: { position: 'relative', width: '120px', height: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: '5px' },
  clockTime: { position: 'absolute', fontSize: '2.8rem', fontWeight: '900', color: 'white', fontFamily: 'monospace' },
  contentArea: { flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '600px', overflowY: 'auto', gap: '15px', padding: '10px 5px', boxSizing: 'border-box' },
  powerUpsRow: { display: 'flex', justifyContent: 'space-between', width: '100%', gap: '10px', marginBottom: '10px', flexShrink: 0 },
  puBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', padding: '12px 5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', color: 'white', transition: 'all 0.2s ease' },
  puIcon: { fontSize: '1.4rem' },
  puCount: { fontSize: '1.1rem', fontWeight: 'bold' },
  questionCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '20px', padding: '20px', textAlign: 'center', border: '1px solid rgba(0,229,255,0.1)', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' },
  questionText: { fontSize: '1.3rem', fontWeight: 'bold', color: '#FF9100', lineHeight: '1.4' },
  optionsGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  optionBtn: { border: '2px solid', borderRadius: '15px', padding: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' },
  optionText: { fontSize: '1.1rem', fontWeight: 'bold' },
  frozenBox: { backgroundColor: 'rgba(0, 229, 255, 0.05)', border: '2px dashed #00E5FF', borderRadius: '15px', padding: '25px', color: '#00E5FF', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
  votersContainer: { display: 'flex', gap: '5px' },
  voterDot: { width: '12px', height: '12px', borderRadius: '50%', border: '1px solid white' },
  footer: { width: '100%', maxWidth: '600px', padding: '5px 0 10px 0', display: 'flex', flexDirection: 'column', gap: '10px' },
  rosterContainer: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '10px', border: '1px solid rgba(255,255,255,0.05)' },
  rosterLabel: { fontSize: '0.85rem', color: '#FF9100', fontWeight: 'bold', marginBottom: '8px' },
  rosterGrid: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  rosterItem: { display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(0,0,0,0.3)', padding: '5px 10px', borderRadius: '8px', fontSize: '0.9rem' },
  rosterDot: { width: '10px', height: '10px', borderRadius: '50%' },
  rosterName: { color: 'white' },
  rosterStatus: { marginLeft: '5px' },
  submitBtn: { width: '100%', height: '65px', backgroundColor: '#FF9100', color: '#05081c', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '1.5rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(255,145,0,0.4)' },
  submitBtnDisabled: { width: '100%', height: '65px', backgroundColor: '#1a1d2e', color: '#4b5563', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '15px', fontWeight: '900', fontSize: '1.2rem' }
};