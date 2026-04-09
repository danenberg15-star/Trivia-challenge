"use client";
import React, { useState, useEffect, useMemo } from "react";

const AthleteClock = ({ timeLeft, maxTime }: { timeLeft: number, maxTime: number }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = (timeLeft / maxTime) * circumference;
  const handRotation = (timeLeft % 60) * 6;

  return (
    <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="160" height="160" style={{ transform: 'scaleX(-1)' }}>
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
        <circle 
          cx="80" cy="80" r={radius} fill="none" 
          stroke={timeLeft < 10 ? "#ef4444" : "#ffd700"} 
          strokeWidth="8" 
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s linear' }}
          transform="rotate(-90 80 80)"
        />
        <line x1="80" y1="80" x2="80" y2="20" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"
          style={{ transform: `rotate(${handRotation}deg)`, transformOrigin: '80px 80px', transition: 'transform 1s linear' }} 
        />
      </svg>
      <div style={{ position: 'absolute', fontSize: '2.5rem', fontWeight: '900', color: 'white' }}>{Math.floor(timeLeft)}</div>
    </div>
  );
};

export default function GameStep({ roomData, userId, updateRoom, handleAnswer }: any) {
  const me = roomData.players.find((p: any) => p.id === userId);
  const myTeamIdx = me?.teamIdx || 0;
  const [localTime, setLocalTime] = useState(roomData.gameMode === 'individual' ? 10 : 20);

  const question = {
    text: "איזו מדינה תארח את המונדיאל בשנת 2026?",
    options: ["קטר", "ברזיל", "ארה\"ב, קנדה ומקסיקו", "צרפת"],
    correctIdx: 2
  };

  const shuffledOptions = useMemo(() => {
    return question.options.map((opt, i) => ({ text: opt, originalIdx: i }))
      .sort(() => Math.random() - 0.5);
  }, [roomData.currentQuestionIdx]);

  const teamVotes = roomData.votes?.[myTeamIdx] || {};
  const myTeamPlayers = roomData.players.filter((p: any) => p.teamIdx === myTeamIdx);
  
  // לוגיקת בוטים - הצבעה אוטומטית בחדר QA
  useEffect(() => {
    if (roomData.id === 'עומר' || roomData.players.some((p: any) => p.isBot)) {
      const bots = roomData.players.filter((p: any) => p.isBot);
      const newVotes = { ...roomData.votes };
      let changed = false;

      bots.forEach((bot: any) => {
        const botTeamIdx = bot.teamIdx;
        if (!newVotes[botTeamIdx]) newVotes[botTeamIdx] = {};
        
        if (botTeamIdx === myTeamIdx && teamVotes[userId] !== undefined) {
          if (newVotes[botTeamIdx][bot.id] !== teamVotes[userId]) {
            newVotes[botTeamIdx][bot.id] = teamVotes[userId];
            changed = true;
          }
        } 
        else if (botTeamIdx !== myTeamIdx && newVotes[botTeamIdx][bot.id] === undefined) {
          newVotes[botTeamIdx][bot.id] = Math.floor(Math.random() * 4);
          changed = true;
        }
      });

      if (changed) {
        updateRoom({ votes: newVotes });
      }
    }
  }, [teamVotes[userId], roomData.votes, roomData.id]);

  const everyoneAgreed = myTeamPlayers.length > 0 && 
    myTeamPlayers.every((p: any) => teamVotes[p.id] !== undefined && teamVotes[p.id] === teamVotes[myTeamPlayers[0].id]);

  const handleVote = (idx: number) => {
    const newVotes = { ...roomData.votes };
    if (!newVotes[myTeamIdx]) newVotes[myTeamIdx] = {};
    newVotes[myTeamIdx][userId] = idx;
    updateRoom({ votes: newVotes });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setLocalTime(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={s.layout}>
      <div style={s.topBar}>
        <AthleteClock timeLeft={localTime} maxTime={roomData.gameMode === 'individual' ? 60 : 120} />
      </div>

      <div style={s.questionCard}>
        <h2 style={s.questionText}>{question.text}</h2>
      </div>

      <div style={s.grid}>
        {shuffledOptions.map((opt) => {
          const voters = myTeamPlayers.filter((p: any) => teamVotes[p.id] === opt.originalIdx);
          const isSelectedByMe = teamVotes[userId] === opt.originalIdx;
          
          return (
            <button key={opt.originalIdx} onClick={() => handleVote(opt.originalIdx)} style={{
              ...s.optionBtn,
              border: voters.length > 0 ? `3px dashed ${voters[0].color}` : '2px solid rgba(255,255,255,0.1)',
              backgroundColor: isSelectedByMe ? 'rgba(255,215,0,0.1)' : '#1a1d2e'
            }}>
              {opt.text}
              <div style={s.voterDots}>
                {voters.map((p: any) => <div key={p.id} style={{...s.dot, backgroundColor: p.color}} />)}
              </div>
            </button>
          );
        })}
      </div>

      <div style={s.powerUps}>
        <button style={s.powerBtn}>❄️ הקפאה</button>
        <button style={s.powerBtn}>🌓 50:50</button>
        <button style={s.powerBtn}>🐢 האטה</button>
      </div>

      <button 
        disabled={!everyoneAgreed}
        onClick={() => handleAnswer(teamVotes[userId] === question.correctIdx)}
        style={{...s.finalBtn, backgroundColor: everyoneAgreed ? '#10b981' : '#334155'}}
      >
        {everyoneAgreed ? "סופי! ✅" : "מחכים להסכמה..."}
      </button>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', padding: '20px', gap: '20px', backgroundColor: '#05081c', color: 'white', direction: 'rtl' },
  topBar: { display: 'flex', justifyContent: 'center' },
  questionCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '30px', padding: '30px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' },
  questionText: { fontSize: '1.8rem', fontWeight: 'bold', margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', flex: 1 },
  optionBtn: { position: 'relative', borderRadius: '20px', fontSize: '1.2rem', fontWeight: 'bold', color: 'white', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' },
  voterDots: { position: 'absolute', bottom: '10px', display: 'flex', gap: '5px' },
  dot: { width: '10px', height: '10px', borderRadius: '50%' },
  powerUps: { display: 'flex', gap: '10px' },
  powerBtn: { flex: 1, height: '50px', borderRadius: '15px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '1rem' },
  finalBtn: { height: '70px', borderRadius: '25px', border: 'none', color: 'white', fontSize: '1.5rem', fontWeight: '900', cursor: 'pointer' }
};