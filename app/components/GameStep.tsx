"use client";
import React, { useState, useEffect, useMemo } from "react";
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
  
  const [isReadingDelay, setIsReadingDelay] = useState(true);
  const [freezeTimer, setFreezeTimer] = useState(0);

  useEffect(() => {
    setTimeLeft(roomData.timeBanks[myTeamName] || 20);
    setIsRevealing(false);
    setHasFailed(false);
    setHiddenOptions([]);
    setIsFrozen(false);
    setIsSlowMo(false);
    setIsReadingDelay(true);
  }, [roomData.currentQuestionIdx, roomData.timeBanks, myTeamName]);

  useEffect(() => {
    if (!isReadingDelay) return;
    const delayTimer = setTimeout(() => {
      setIsReadingDelay(false);
    }, 2000);
    return () => clearTimeout(delayTimer);
  }, [isReadingDelay, roomData.currentQuestionIdx]);

  useEffect(() => {
    let t: any;
    if (isFrozen) {
      if (freezeTimer > 0) {
        t = setInterval(() => setFreezeTimer((prev) => prev - 1), 1000);
      } else {
        setIsFrozen(false); 
      }
    }
    return () => clearInterval(t);
  }, [isFrozen, freezeTimer]);

  const currentQuestion = useMemo(() => {
    const difficulty = roomData.difficulty || 'dynamic';
    const baseTime = roomData.timeBanks[myTeamName] || 20; 

    let targetLevel = 3;
    if (difficulty === 'easy') {
      targetLevel = baseTime <= 40 ? 1 : ((Math.sin(baseTime) > 0) ? 1 : 2);
    } else if (difficulty === 'hard') {
      targetLevel = baseTime <= 30 ? 3 : 4;
    } else {
      if (baseTime <= 10) targetLevel = 1;
      else if (baseTime <= 20) targetLevel = 2;
      else if (baseTime <= 35) targetLevel = 3;
      else if (baseTime > 45) targetLevel = 4;
      else targetLevel = 3; 
    }

    const levelPool = ALL_QUESTIONS.filter(q => q.level === targetLevel);
    const askedTexts = roomData.askedQuestions || [];
    let availableQuestions = levelPool.filter(q => !askedTexts.includes(q.text));
    
    if (availableQuestions.length === 0) {
      availableQuestions = levelPool; 
      if (availableQuestions.length === 0) availableQuestions = ALL_QUESTIONS;
    }
    
    const seed = roomData.seed || 37;
    const questionIdx = (seed + (roomData.currentQuestionIdx || 0)) % availableQuestions.length;
    return availableQuestions[questionIdx];
  }, [roomData.currentQuestionIdx, roomData.timeBanks, myTeamName, roomData.difficulty, roomData.seed, roomData.askedQuestions]);

  useEffect(() => {
    if (isRevealing || isFrozen || isReadingDelay) return;

    if (timeLeft <= 0) {
      setHasFailed(true);
      if (typeof Audio !== "undefined") {
        const audio = new Audio('/Boo.m4a');
        audio.volume = 0.9;
        audio.play().catch(() => {});
      }
      setTimeout(() => handleAnswer(false, 0, currentQuestion), 1000);
      return;
    }

    const tickRate = isSlowMo ? 2000 : 1000;
    const timer = setInterval(() => {
      setTimeLeft((prev: number) => Math.max(0, prev - 1));
    }, tickRate);

    return () => clearInterval(timer);
  }, [timeLeft, isRevealing, isFrozen, isSlowMo, isReadingDelay, handleAnswer, currentQuestion]);

  const onOptionClick = (idx: number) => {
    if (isRevealing || isFrozen) return;
    setIsRevealing(true);
    
    const isCorrect = idx === currentQuestion.correctIdx;
    
    if (typeof Audio !== "undefined") {
      const soundFile = isCorrect ? '/Cheer.m4a' : '/Boo.m4a';
      const audio = new Audio(soundFile);
      audio.volume = 0.9;
      audio.play().catch((e) => console.log("Audio play error", e));
    }

    if (!isCorrect) setHasFailed(true);
    
    setTimeout(() => handleAnswer(isCorrect, timeLeft, currentQuestion), 1500);
  };

  const usePowerUp = (type: string) => {
    const currentPUs = roomData.powerUps[myTeamName] || [];
    if (!currentPUs.includes(type)) return;

    const newPUs = [...currentPUs];
    newPUs.splice(newPUs.indexOf(type), 1);
    
    updateRoom({ powerUps: { ...roomData.powerUps, [myTeamName]: newPUs } });

    if (type === '50:50') {
      const wrongIndices = currentQuestion.options
        .map((_: any, i: number) => i)
        .filter((i: number) => i !== currentQuestion.correctIdx);
      const shuffled = wrongIndices.sort(() => 0.5 - Math.random());
      setHiddenOptions([shuffled[0], shuffled[1]]);
    } else if (type === 'freeze') {
      setIsFrozen(true);
      setFreezeTimer(10); 
    } else if (type === 'slow-mo') {
      setIsSlowMo(true);
    }
  };

  const maxTime = 60;
  const progress = Math.min(Math.max(timeLeft / maxTime, 0), 1);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress * circumference);
  const clockColor = isFrozen ? "#00E5FF" : (isSlowMo ? "#A855F7" : (timeLeft < 5 ? "#ef4444" : "#FF9100"));

  return (
    <div style={s.layout}>
      {/* הזרקת CSS לאנימציית הפעימה של הכוחות */}
      <style>{`
        @keyframes pu-pulse {
          0% { transform: scale(1); box-shadow: 0 0 5px rgba(255, 145, 0, 0.4); }
          50% { transform: scale(1.03); box-shadow: 0 0 20px rgba(255, 145, 0, 0.7); }
          100% { transform: scale(1); box-shadow: 0 0 5px rgba(255, 145, 0, 0.4); }
        }
      `}</style>

      <div style={s.clockContainer}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <circle cx="60" cy="60" r={radius} fill="none" stroke={clockColor} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform="rotate(-90 60 60)" style={{ transition: isSlowMo ? 'stroke-dashoffset 2s linear' : 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 8px ${clockColor})` }} />
        </svg>
        <div style={s.clockTime}>{Math.round(timeLeft)}</div>
        {isSlowMo && <div style={s.slowMoBadge}>SLOW MOTION</div>}
      </div>

      <div style={s.contentArea}>
        <div style={s.powerUpsRow}>
          {['50:50', 'freeze', 'slow-mo'].map(type => {
            const count = (roomData.powerUps[myTeamName] || []).filter((p: string) => p === type).length;
            const isAvailable = count > 0;
            
            return (
              <button 
                key={type} 
                onClick={() => usePowerUp(type)} 
                disabled={!isAvailable || isRevealing} 
                style={{ 
                  ...s.puBtn, 
                  opacity: isAvailable ? 1 : 0.2,
                  borderColor: isAvailable ? '#FF9100' : 'rgba(255,255,255,0.1)',
                  backgroundColor: isAvailable ? 'rgba(255,145,0,0.1)' : 'rgba(255,255,255,0.05)',
                  animation: isAvailable ? 'pu-pulse 2s infinite ease-in-out' : 'none',
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

        <div style={s.questionCard}>
          <h2 style={s.questionText}>{currentQuestion.text}</h2>
        </div>

        <div style={{ ...s.optionsGrid, visibility: isFrozen ? 'hidden' : 'visible' }}>
          {currentQuestion.options.map((opt, i) => {
            if (hiddenOptions.includes(i)) return <div key={i} style={s.hiddenPlaceholder} />;
            let borderColor = 'rgba(255,255,255,0.1)';
            let bgColor = 'rgba(255,255,255,0.05)';
            if (isRevealing) {
              if (i === currentQuestion.correctIdx) { borderColor = '#10b981'; bgColor = 'rgba(16,185,129,0.2)'; } 
              else if (hasFailed) { borderColor = '#ef4444'; bgColor = 'rgba(239,68,68,0.2)'; }
            }
            return (
              <button key={i} onClick={() => onOptionClick(i)} style={{ ...s.optionBtn, borderColor, backgroundColor: bgColor }}>
                <span style={s.optionText}>{opt}</span>
                {isRevealing && i === currentQuestion.correctIdx && <span>✅</span>}
              </button>
            );
          })}
        </div>
        
        {isFrozen && (
          <div style={s.freezeOverlay}>
            <span style={{ fontSize: '2.5rem', marginBottom: '5px' }}>❄️</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#00E5FF', marginBottom: '10px' }}>זמן קפוא!</span>
            <span style={{ fontSize: '7rem', fontWeight: '900', color: '#00E5FF', lineHeight: 1, textShadow: '0 0 20px rgba(0,229,255,0.8)' }}>
              {freezeTimer}
            </span>
          </div>
        )}
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
    marginTop: '10px' 
  },
  clockTime: { 
    position: 'absolute', 
    fontSize: '2.8rem', 
    fontWeight: '900', 
    color: 'white', 
    fontFamily: 'monospace' 
  },
  slowMoBadge: { 
    position: 'absolute', 
    bottom: '-20px', 
    fontSize: '0.7rem', 
    color: '#A855F7', 
    fontWeight: 'bold', 
    textTransform: 'uppercase', 
    letterSpacing: '1px' 
  },
  contentArea: { 
    position: 'relative', 
    flex: 1, 
    display: 'flex', 
    flexDirection: 'column', 
    width: '100%', 
    maxWidth: '600px', 
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
  puIcon: { 
    fontSize: '1.4rem' 
  },
  puCount: { 
    fontSize: '1.1rem', 
    fontWeight: 'bold' 
  },
  questionCard: { 
    backgroundColor: 'rgba(255,255,255,0.02)', 
    borderRadius: '20px', 
    padding: '20px', 
    textAlign: 'center', 
    border: '1px solid rgba(0,229,255,0.1)', 
    flexShrink: 0, 
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)' 
  },
  questionText: { 
    fontSize: '1.2rem', 
    fontWeight: 'bold', 
    color: '#FF9100', 
    lineHeight: '1.3', 
    margin: 0 
  },
  optionsGrid: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '10px', 
    flexShrink: 0,
    transition: 'opacity 0.3s ease'
  },
  optionBtn: { 
    border: '2px solid', 
    borderRadius: '15px', 
    padding: '15px', 
    cursor: 'pointer', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    transition: 'all 0.2s', 
    color: 'white', 
    textAlign: 'right', 
    backgroundColor: 'transparent' 
  },
  optionText: { 
    fontSize: '1.1rem', 
    fontWeight: 'bold' 
  },
  hiddenPlaceholder: { 
    height: '55px' 
  },
  freezeOverlay: { 
    position: 'absolute', 
    top: '50%', 
    left: '50%', 
    transform: 'translate(-50%, -50%)', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    pointerEvents: 'none',
    zIndex: 10
  }
};