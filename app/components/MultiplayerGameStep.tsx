"use client";
import React from "react";
import { s } from "./MultiplayerGameStep.styles";
import { useMultiplayerStepLogic } from "./useMultiplayerStepLogic";

export default function MultiplayerGameStep(props: any) {
  // שאיבת כל הלוגיקה והנתונים מה-Hook המפוצל
  const {
    myTeamName,
    myTeamPlayers,
    timeLeft,
    isLocked,
    isFrozen,
    freezeCountdown,
    hiddenOptions,
    question,
    votes,
    handlePowerUpClick,
    handleVote
  } = useMultiplayerStepLogic(props);

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

      {/* שעון העצר */}
      <div style={s.clockContainer}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <circle 
            cx="60" cy="60" r={radius} fill="none" stroke={clockColor} strokeWidth="8" 
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" 
            transform="rotate(-90 60 60)" 
            style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 5px ${clockColor})` }} 
          />
        </svg>
        <div style={s.clockTime}>{timeLeft}</div>
      </div>

      <div style={s.contentArea}>
        {/* שורת כוחות עזר */}
        <div style={s.powerUpsRow}>
          {['50:50', 'freeze', 'slow-mo'].map(type => {
            const count = (props.roomData.powerUps?.[myTeamName] || []).filter((p: string) => p === type).length;
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
                  animation: (isAvailable && !isLocked) ? 'pu-pulse 2s infinite ease-in-out' : 'none'
                }}
              >
                <span style={s.puIcon}>{type === '50:50' ? '🌗' : type === 'freeze' ? '❄️' : '🐢'}</span>
                <span style={s.puCount}>x{count}</span>
              </button>
            );
          })}
        </div>

        {/* כרטיס השאלה */}
        <div style={s.questionCard}>
          <h2 style={s.questionText}>{question.text}</h2>
        </div>

        {/* גריד התשובות */}
        <div style={s.optionsGrid}>
          {isFrozen ? (
            <div style={s.frozenBox}>
              <span style={{ fontSize: '2.5rem', marginBottom: '5px' }}>❄️</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#00E5FF' }}>זמן קפוא!</span>
              <span style={{ fontSize: '7rem', fontWeight: '900', color: '#00E5FF' }}>{freezeCountdown}</span>
            </div>
          ) : (
            question.options.map((opt: string, i: number) => {
              const votersForThis = myTeamPlayers.filter((p: any) => votes[p.id] === i);
              const isSelectedByMe = votes[props.userId] === i;
              if (hiddenOptions.includes(i)) return <div key={i} style={{ ...s.optionBtn, opacity: 0, pointerEvents: 'none' }} />;
              
              return (
                <div 
                  key={i} 
                  onClick={() => handleVote(i)} 
                  style={{ 
                    ...s.optionBtn, 
                    borderColor: isSelectedByMe ? (isLocked ? '#10b981' : '#FF9100') : 'rgba(255,255,255,0.15)', 
                    backgroundColor: isSelectedByMe ? (isLocked ? 'rgba(16,185,129,0.1)' : 'rgba(255,145,0,0.1)') : 'transparent', 
                    cursor: isLocked ? 'default' : 'pointer' 
                  }}
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

      {/* פוטר וסטטוס קבוצה */}
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
        
        <div style={isLocked ? s.lockBadgeActive : s.lockBadgePending}>
          {isLocked ? "ננעלנו! ממתינים לשאר הקבוצות... ⏳" : "מנסים להגיע להסכמה..."}
        </div>
      </div>
    </div>
  );
}