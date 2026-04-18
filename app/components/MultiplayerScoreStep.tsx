"use client";
import React, { useEffect, useState, useRef } from "react";

export default function MultiplayerScoreStep({ roomData, userId, updateRoom, onNext }: any) {
  const [showReveal, setShowReveal] = useState(false);
  const [displayTimes, setDisplayTimes] = useState<any>(null);
  const hasInitialized = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const me = roomData.players.find((p: any) => p.id === userId);
  const myTeamName = roomData.teamNames[me.teamIdx];
  const teamNames = roomData.teamNames || [];
  const roundResults = roomData.roundResults || {};
  const lastQuestion = roomData.lastQuestion;

  const readyTeams = roomData.readyTeams || {};
  const isMyTeamReady = !!readyTeams[myTeamName];
  const allReady = teamNames.every((name: string) => !!readyTeams[name]);

  useEffect(() => {
    if (hasInitialized.current) return;

    // 1. אתחול זמנים לתצוגה (הערך לפני הבונוס/קנס)
    const initialTimes: any = {};
    teamNames.forEach((name: string) => {
      const result = roundResults[name];
      if (result && result.answered) {
        initialTimes[name] = result.finalTime - (result.isCorrect ? 10 : -7);
      } else {
        initialTimes[name] = roomData.timeBanks[name] || 0;
      }
    });
    
    setDisplayTimes(initialTimes);
    hasInitialized.current = true;

    // 2. השמעת סאונד - Cheer אם מישהו צדק, Boo אם כולם טעו
    const anyoneCorrect = Object.values(roundResults).some((r: any) => r.isCorrect);
    if (typeof Audio !== "undefined") {
      audioRef.current = new Audio(anyoneCorrect ? '/Cheer.m4a' : '/Boo.m4a');
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(() => {});
    }

    // 3. חשיפת התוצאה לאחר שנייה
    const timer = setTimeout(() => {
      setShowReveal(true);
      setDisplayTimes(roomData.timeBanks);
    }, 1000);

    return () => clearTimeout(timer);
  }, [roomData.timeBanks, roundResults, teamNames]);

  /**
   * תיקון לריבוי קבוצות בחדר עומר:
   * כל קבוצה שאינה קבוצת השחקן (כלומר קבוצות בוטים) הופכת למוכנה אוטומטית.
   */
  useEffect(() => {
    const roomName = (roomData.id || "").toString().trim();
    const isQA = roomName === "עומר" || roomName === "qa_omer_room";
    
    if (isQA && showReveal) {
      const timer = setTimeout(() => {
        const newReady = { ...readyTeams };
        let changed = false;

        teamNames.forEach((name: string) => {
          // ב-QA, כל קבוצה שהיא לא הקבוצה של המשתמש נחשבת לקבוצת בוטים
          if (name !== myTeamName && !newReady[name]) {
            newReady[name] = true;
            changed = true;
          }
        });

        if (changed) {
          updateRoom({ readyTeams: newReady });
        }
      }, 3000); 

      return () => clearTimeout(timer);
    }
  }, [showReveal, roomData.id, teamNames, myTeamName, readyTeams, updateRoom]);

  const handleReady = () => {
    updateRoom({
      readyTeams: { ...readyTeams, [myTeamName]: true }
    });
  };

  useEffect(() => {
    if (allReady) {
      const timer = setTimeout(() => {
        onNext();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [allReady, onNext]);

  if (!displayTimes) return null;

  return (
    <div style={s.overlay}>
      <div style={s.container}>
        <div style={s.header}>
          <h1 style={s.title}>צ'ק-אין תוצאות</h1>
          {lastQuestion && (
            <div style={s.questionInfo}>
              <p style={s.questionText}>{lastQuestion.text}</p>
              <div style={s.correctBadge}>
                תשובה נכונה: <span style={s.answerVal}>{lastQuestion.options[lastQuestion.correctIdx]}</span>
              </div>
            </div>
          )}
        </div>

        <div style={s.teamsGrid}>
          {teamNames.map((name: string) => {
            const result = roundResults[name];
            const isCorrect = result?.isCorrect;
            const timeDiff = isCorrect ? "+10" : "-7";
            
            return (
              <div key={name} style={{
                ...s.teamCard,
                borderColor: !showReveal ? 'rgba(255,255,255,0.1)' : (isCorrect ? '#10b981' : '#ef4444'),
                backgroundColor: !showReveal ? 'rgba(255,255,255,0.02)' : (isCorrect ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)')
              }}>
                <div style={s.teamName}>{name}</div>
                
                <div style={s.timeDisplay}>
                  <div style={s.timeNum}>{displayTimes[name]}</div>
                  {showReveal && (
                    <div style={{ ...s.timeDiff, color: isCorrect ? '#10b981' : '#ef4444' }}>
                      {timeDiff}
                    </div>
                  )}
                </div>

                <div style={s.statusIcon}>
                  {!showReveal ? "⏳" : (isCorrect ? "✅ צדקו!" : "❌ טעו...")}
                </div>
              </div>
            );
          })}
        </div>

        <div style={s.footer}>
          {!allReady ? (
            <button 
              onClick={handleReady} 
              disabled={isMyTeamReady} 
              style={isMyTeamReady ? s.btnDisabled : s.btnActive}
            >
              {isMyTeamReady ? "ממתינים לאחרים..." : "אני מוכן לשאלה הבאה"}
            </button>
          ) : (
            <div style={s.loadingNext}>מתכוננים לשאלה הבאה...</div>
          )}
        </div>
      </div>
    </div>
  );
}

const s: any = {
  overlay: { 
    position: 'fixed', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: '#05081c', 
    zIndex: 1000, 
    display: 'flex', 
    justifyContent: 'center', 
    padding: '20px', 
    overflowY: 'auto' 
  },
  container: { 
    width: '100%', 
    maxWidth: '600px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '30px' 
  },
  header: { 
    textAlign: 'center', 
    marginTop: '20px' 
  },
  title: { 
    fontSize: '2.2rem', 
    fontWeight: '900', 
    color: '#FF9100', 
    marginBottom: '15px' 
  },
  questionInfo: { 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    padding: '20px', 
    borderRadius: '20px', 
    border: '1px solid rgba(255,255,255,0.1)' 
  },
  questionText: { 
    fontSize: '1.1rem', 
    color: 'white', 
    marginBottom: '10px', 
    lineHeight: '1.4' 
  },
  correctBadge: { 
    fontSize: '0.9rem', 
    color: '#94a3b8' 
  },
  answerVal: { 
    color: '#00E5FF', 
    fontWeight: 'bold' 
  },
  teamsGrid: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', 
    gap: '15px' 
  },
  teamCard: { 
    border: '2px solid', 
    borderRadius: '25px', 
    padding: '20px', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    transition: 'all 0.5s ease' 
  },
  teamName: { 
    fontSize: '1.2rem', 
    fontWeight: 'bold', 
    color: 'white', 
    marginBottom: '10px' 
  },
  timeDisplay: { 
    position: 'relative', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '60px' 
  },
  timeNum: { 
    fontSize: '3rem', 
    fontWeight: '900', 
    fontFamily: 'monospace', 
    color: 'white' 
  },
  timeDiff: { 
    position: 'absolute', 
    top: '-15px', 
    right: '-25px', 
    fontSize: '1.2rem', 
    fontWeight: 'bold' 
  },
  statusIcon: { 
    marginTop: '10px', 
    fontSize: '1.1rem', 
    fontWeight: 'bold' 
  },
  footer: { 
    marginTop: 'auto', 
    paddingBottom: '30px' 
  },
  btnActive: { 
    width: '100%', 
    padding: '20px', 
    borderRadius: '18px', 
    border: 'none', 
    backgroundColor: '#FF9100', 
    color: '#05081c', 
    fontSize: '1.3rem', 
    fontWeight: 'bold', 
    cursor: 'pointer', 
    boxShadow: '0 5px 15px rgba(255,145,0,0.3)' 
  },
  btnDisabled: { 
    width: '100%', 
    padding: '20px', 
    borderRadius: '18px', 
    border: '1px solid rgba(255,255,255,0.1)', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    color: '#64748b', 
    fontSize: '1.1rem' 
  },
  loadingNext: { 
    textAlign: 'center', 
    color: '#FF9100', 
    fontSize: '1.2rem', 
    fontWeight: 'bold' 
  }
};