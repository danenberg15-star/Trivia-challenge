"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
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
  const [isLocked, setIsLocked] = useState(false); 

  // חיווי על כוחות עזר פעילים
  const currentEffect = roomData.teamEffects?.[myTeamName] || {};
  const isEffectActive = currentEffect.qIdx === roomData.currentQuestionIdx;
  const isFrozen = isEffectActive && currentEffect.type === 'freeze' && Date.now() < currentEffect.expiresAt;
  const isSlowMo = isEffectActive && currentEffect.type === 'slow-mo';
  const hiddenOptions = (isEffectActive && currentEffect.type === '50:50') ? currentEffect.hidden : [];

  const [freezeCountdown, setFreezeCountdown] = useState(0);
  
  // Ref לניהול מענה בוטים - מונע כפילויות ומאפשר סנכרון רב-קבוצתי
  const botHandledRef = useRef<number>(-1);
  const roomDataRef = useRef(roomData);
  
  useEffect(() => {
    roomDataRef.current = roomData;
  }, [roomData]);

  // אתחול שאלה חדשה
  useEffect(() => {
    setTimeLeft(roomData.timeBanks[myTeamName] || 15);
    setHasFailed(false);
    setIsReadingDelay(true); 
    setIsLocked(false);
  }, [roomData.currentQuestionIdx, myTeamName]); 

  // השהיית קריאה (2 שניות)
  useEffect(() => {
    if (!isReadingDelay) return;
    const delayTimer = setTimeout(() => setIsReadingDelay(false), 2000);
    return () => clearTimeout(delayTimer);
  }, [isReadingDelay, roomData.currentQuestionIdx]);

  // ניהול טיימר מקומי
  useEffect(() => {
    if (timeLeft <= 0 || isFrozen || hasFailed || isReadingDelay || isLocked) return;
    const delay = isSlowMo ? 2000 : 1000;
    const t = setInterval(() => setTimeLeft((prev: number) => prev - 1), delay);
    return () => clearInterval(t);
  }, [timeLeft, isFrozen, isSlowMo, hasFailed, isReadingDelay, isLocked]);

  // לוגיקת בחירת שאלה ליניארית (1-2 רמה 1, 3-4 רמה 2, 5+ רמה 3+4)
  const question = useMemo(() => {
    const qIdx = roomData.currentQuestionIdx || 0;
    let pool: QuestionType[] = [];

    if (qIdx < 2) {
      pool = ALL_QUESTIONS.filter(q => q.level === 1);
    } else if (qIdx < 4) {
      pool = ALL_QUESTIONS.filter(q => q.level === 2);
    } else {
      pool = ALL_QUESTIONS.filter(q => q.level === 3 || q.level === 4);
    }

    const askedTexts = roomData.askedQuestions || [];
    let filteredPool = pool.filter(q => !askedTexts.includes(q.text));
    if (filteredPool.length === 0) filteredPool = pool;

    const seed = roomData.seed || 37;
    const finalIdx = (seed + qIdx) % filteredPool.length;
    return filteredPool[finalIdx];
  }, [roomData.currentQuestionIdx, roomData.askedQuestions, roomData.seed]);

  // ניהול ספירה לאחור של הקפאה
  useEffect(() => {
    let interval: any;
    if (isFrozen && currentEffect.expiresAt) {
      const calculateRemain = () => Math.max(0, Math.ceil((currentEffect.expiresAt - Date.now()) / 1000));
      setFreezeCountdown(calculateRemain());
      interval = setInterval(() => setFreezeCountdown(calculateRemain()), 500); 
    }
    return () => clearInterval(interval);
  }, [isFrozen, currentEffect.expiresAt]);

  /**
   * לוגיקת בוטים משופרת לריבוי קבוצות (חדר עומר):
   * המערכת סורקת את כל הקבוצות. כל קבוצה שאין בה שחקן אנושי תענה אוטומטית.
   */
  useEffect(() => {
    const currentQ = roomData.currentQuestionIdx || 0;
    const roomName = (roomData.id || "").toString().trim();
    const isQA = roomName === "עומר" || roomName === "qa_omer_room";

    if (isQA && !isReadingDelay && botHandledRef.current !== currentQ) {
      const timer = setTimeout(() => {
        const latestRoom = roomDataRef.current;
        if (latestRoom.step !== 5 || botHandledRef.current === currentQ) return;
        
        botHandledRef.current = currentQ;
        const shouldBeCorrect = (currentQ % 2 === 0);
        const botChoice = shouldBeCorrect ? question.correctIdx : (question.correctIdx + 1) % 4;
        
        // מציאת כל האינדקסים של הקבוצות שאין בהן שחקנים אנושיים
        const allTeamIndices = latestRoom.teamNames.map((_: any, i: number) => i);
        const humanTeamIndices = Array.from(new Set(latestRoom.players.filter((p: any) => !p.isBot).map((p: any) => p.teamIdx)));
        const botOnlyTeamIndices = allTeamIndices.filter((idx: number) => !humanTeamIndices.includes(idx));

        let newVotes = { ...(latestRoom.votes || {}) };

        botOnlyTeamIndices.forEach((tIdx: number) => {
          const teamName = latestRoom.teamNames[tIdx];
          const teamBots = latestRoom.players.filter((p: any) => p.teamIdx === tIdx && p.isBot);
          
          // הצבעת בוטים
          teamBots.forEach((p: any) => { newVotes[p.id] = botChoice; });
          
          // שליחת תשובה לכל קבוצת בוטים בנפרד (נועל את הקבוצה ב-DB)
          handleAnswer(shouldBeCorrect, 15, question, teamName);
        });
        
        updateRoom({ votes: newVotes });
      }, 3000); // 3 שניות מענה + 2 שניות השהיית קריאה = 5 שניות

      return () => clearTimeout(timer);
    }
  }, [roomData.currentQuestionIdx, isReadingDelay, question, roomData.id, handleAnswer, updateRoom]);

  // לוגיקת קונצנזוס (נעילה אוטומטית)
  const votes = roomData.votes || {};
  const myTeamVotes = myTeamPlayers.map((p: any) => votes[p.id]);
  const allVoted = myTeamVotes.every((v: any) => v !== undefined);
  const firstVote = myTeamVotes[0];
  const allAgreed = allVoted && myTeamVotes.every((v: any) => v === firstVote);

  useEffect(() => {
    if (allAgreed && !isLocked && !isReadingDelay) {
      setIsLocked(true);
      handleAnswer(firstVote === question.correctIdx, timeLeft, question);
    }
  }, [allAgreed, isLocked, isReadingDelay, firstVote, question, timeLeft, handleAnswer]);

  // טיפול בפסילת זמן
  useEffect(() => {
    if (timeLeft <= 0 && !hasFailed && !isLocked) {
      setHasFailed(true);
      handleAnswer(false, 0, question); 
    }
  }, [timeLeft, hasFailed, isLocked, handleAnswer, question]);

  const handlePowerUpClick = (pu: string) => {
    if (isLocked) return;
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
    if (isFrozen || hasFailed || isLocked) return; 
    let newVotes = { ...(roomData.votes || {}), [userId]: optIdx };
    // בחדר עומר הבוטים שבקבוצה שלי (אם יש) מצביעים איתי
    if (roomData.id === 'עומר' || roomData.id === 'qa_omer_room') {
      myTeamPlayers.forEach((p: any) => { if (p.isBot) newVotes[p.id] = optIdx; });
    }
    updateRoom({ votes: newVotes });
  };

  // עיצוב השעון
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(timeLeft / 120, 0), 1);
  const strokeDashoffset = circumference - (progress * circumference);
  const clockColor = isFrozen ? "#00E5FF" : (timeLeft < 5 ? "#ef4444" : "#FF9100");

  return (
    <div style={s.layout}>
      <style>{`
        @keyframes pu-pulse {
          0% { transform: scale(1); box-shadow: 0 0 5px rgba(255, 145, 0, 0.4); }
          50% { transform: scale(1.03); box-shadow: 0 0 20px rgba(255, 145, 0, 0.7); }
          100% { transform: scale(1); box-shadow: 0 0 5px rgba(255, 145, 0, 0.4); }
        }
      `}</style>

      {/* אזור השעון */}
      <div style={s.clockContainer}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <circle 
            cx="60" cy="60" r={radius} fill="none" stroke={clockColor} strokeWidth="8" 
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round" transform="rotate(-90 60 60)" 
            style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 5px ${clockColor})` }} 
          />
        </svg>
        <div style={s.clockTime}>{timeLeft}</div>
      </div>

      <div style={s.contentArea}>
        {/* שורת כוחות עזר */}
        <div style={s.powerUpsRow}>
          {['50:50', 'freeze', 'slow-mo'].map(type => {
            const count = (roomData.powerUps?.[myTeamName] || []).filter((p: string) => p === type).length;
            const isAvailable = count > 0;
            return (
              <button 
                key={type} 
                onClick={() => handlePowerUpClick(type)} 
                disabled={!isAvailable || isLocked} 
                style={{ 
                  ...s.puBtn, 
                  opacity: isAvailable ? 1 : 0.2,
                  borderColor: isAvailable ? '#FF9100' : 'rgba(255,255,255,0.1)',
                  backgroundColor: isAvailable ? 'rgba(255,145,0,0.1)' : 'rgba(255,255,255,0.05)',
                  animation: (isAvailable && !isLocked) ? 'pu-pulse 2s infinite ease-in-out' : 'none',
                  borderWidth: isAvailable ? '2px' : '1px'
                }}
              >
                <span style={{ ...s.puIcon, fontSize: isAvailable ? '1.6rem' : '1.4rem' }}>
                  {type === '50:50' ? '🌗' : type === 'freeze' ? '❄️' : '🐢'}
                </span>
                <span style={{ ...s.puCount, color: isAvailable ? '#FF9100' : 'white' }}>x{count}</span>
              </button>
            );
          })}
        </div>

        {/* כרטיס שאלה */}
        <div style={s.questionCard}>
          <h2 style={s.questionText}>{question.text}</h2>
        </div>

        {/* גריד תשובות */}
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
              
              let borderColor = isSelectedByMe ? '#FF9100' : 'rgba(255,255,255,0.15)';
              let bgColor = isSelectedByMe ? 'rgba(255,145,0,0.1)' : 'transparent';
              
              if (isLocked && isSelectedByMe) {
                borderColor = '#10b981';
                bgColor = 'rgba(16,185,129,0.1)';
              }

              return (
                <div 
                  key={i} 
                  onClick={() => handleVote(i)} 
                  style={{ ...s.optionBtn, borderColor, backgroundColor: bgColor, cursor: isLocked ? 'default' : 'pointer' }}
                >
                  <span style={s.optionText}>{opt}</span>
                  <div style={s.votersContainer}>
                    {votersForThis.map((p: any) => (
                      <div key={p.id} style={{ ...s.voterDot, backgroundColor: p.color, boxShadow: `0 0 5px ${p.color}` }} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* פוטר סטטוס */}
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
        
        {/* חיווי נעילה במקום כפתור ידני */}
        <div style={isLocked ? s.lockBadgeActive : s.lockBadgePending}>
          {isLocked ? "ננעלנו! ממתינים לשאר הקבוצות... ⏳" : "מנסים להגיע להסכמה..."}
        </div>
      </div>
    </div>
  );
}

const s: any = {
  layout: { 
    display: 'flex', 
    flexDirection: 'column', 
    height: '100dvh', 
    backgroundColor: '#05081c', 
    color: 'white', 
    padding: '15px', 
    direction: 'rtl', 
    alignItems: 'center', 
    boxSizing: 'border-box', 
    overflow: 'hidden' 
  },
  clockContainer: { 
    position: 'relative', 
    width: '120px', 
    height: '120px', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    flexShrink: 0, 
    marginTop: '5px' 
  },
  clockTime: { 
    position: 'absolute', 
    fontSize: '2.8rem', 
    fontWeight: '900', 
    color: 'white', 
    fontFamily: 'monospace' 
  },
  contentArea: { 
    flex: 1, 
    display: 'flex', 
    flexDirection: 'column', 
    width: '100%', 
    maxWidth: '600px', 
    overflowY: 'auto', 
    gap: '15px', 
    padding: '10px 5px', 
    boxSizing: 'border-box' 
  },
  powerUpsRow: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    width: '100%', 
    gap: '12px', 
    marginBottom: '10px', 
    flexShrink: 0 
  },
  puBtn: { 
    flex: 1, 
    border: '1px solid', 
    borderRadius: '15px', 
    padding: '12px 5px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '8px', 
    cursor: 'pointer', 
    color: 'white', 
    transition: 'all 0.3s ease' 
  },
  puIcon: { fontSize: '1.4rem' },
  puCount: { fontSize: '1.1rem', fontWeight: 'bold' },
  questionCard: { 
    backgroundColor: 'rgba(255,255,255,0.02)', 
    borderRadius: '20px', 
    padding: '20px', 
    textAlign: 'center', 
    border: '1px solid rgba(0,229,255,0.1)', 
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)' 
  },
  questionText: { fontSize: '1.3rem', fontWeight: 'bold', color: '#FF9100', lineHeight: '1.4' },
  optionsGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  optionBtn: { 
    border: '2px solid', 
    borderRadius: '15px', 
    padding: '15px', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    transition: 'all 0.2s',
    minHeight: '60px'
  },
  optionText: { fontSize: '1.1rem', fontWeight: 'bold' },
  frozenBox: { 
    backgroundColor: 'rgba(0, 229, 255, 0.05)', 
    border: '2px dashed #00E5FF', 
    borderRadius: '15px', 
    padding: '25px', 
    color: '#00E5FF', 
    textAlign: 'center', 
    display: 'flex', 
    flexDirection: 'column', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  votersContainer: { display: 'flex', gap: '5px' },
  voterDot: { width: '12px', height: '12px', borderRadius: '50%', border: '1px solid white' },
  footer: { 
    width: '100%', 
    maxWidth: '600px', 
    padding: '5px 0 10px 0', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '10px' 
  },
  rosterContainer: { 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: '12px', 
    padding: '10px', 
    border: '1px solid rgba(255,255,255,0.05)' 
  },
  rosterLabel: { fontSize: '0.85rem', color: '#FF9100', fontWeight: 'bold', marginBottom: '8px' },
  rosterGrid: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  rosterItem: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '5px', 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    padding: '5px 10px', 
    borderRadius: '8px', 
    fontSize: '0.9rem' 
  },
  rosterDot: { width: '10px', height: '10px', borderRadius: '50%' },
  rosterName: { color: 'white' },
  rosterStatus: { marginLeft: '5px' },
  lockBadgeActive: { 
    width: '100%', 
    padding: '18px', 
    backgroundColor: 'rgba(16,185,129,0.2)', 
    color: '#10b981', 
    border: '2px solid #10b981', 
    borderRadius: '15px', 
    fontWeight: '900', 
    fontSize: '1.2rem', 
    textAlign: 'center',
    boxShadow: '0 0 20px rgba(16,185,129,0.3)'
  },
  lockBadgePending: { 
    width: '100%', 
    padding: '18px', 
    backgroundColor: '#1a1d2e', 
    color: '#94a3b8', 
    border: '1px solid rgba(255,255,255,0.05)', 
    borderRadius: '15px', 
    fontWeight: '700', 
    fontSize: '1.1rem',
    textAlign: 'center'
  }
};