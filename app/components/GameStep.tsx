"use client";
import React, { useMemo } from "react";

export default function GameStep({ roomData, localTimeLeft, userId, targets, updateRoom, handleAction, onExit }: any) {
  const currentP = roomData.players[roomData.currentTurnIdx];
  const isIDescriber = currentP.id === userId;
  const me = roomData.players.find((p: any) => p.id === userId);

  const isTeammate = roomData.gameMode === 'team' && me?.teamIdx === currentP.teamIdx;

  const myDisplayScore = useMemo(() => {
    if (roomData.gameMode === 'individual') {
      return roomData.totalScores[me?.name] || 0;
    } else {
      const myTeamName = roomData.teamNames[me?.teamIdx];
      return roomData.totalScores[myTeamName] || 0;
    }
  }, [roomData.totalScores, roomData.gameMode, me]);

  const wordData = useMemo(() => {
    const age = parseInt(currentP.age) || 21;
    const difficulty = roomData.difficulty || "age-appropriate";
    const idxs = roomData.poolIndices || { KIDS: 0, JUNIOR: 0, TEEN: 0, ADULT: 0 };
    const totalIdx = (idxs.KIDS + idxs.JUNIOR + idxs.TEEN + idxs.ADULT);
    
    let key: "KIDS" | "JUNIOR" | "TEEN" | "ADULT";

    if (difficulty === "easy") {
      key = (totalIdx % 2 === 0) ? "KIDS" : "JUNIOR";
    } else if (age <= 6) {
      key = (totalIdx % 5 < 4) ? "KIDS" : "JUNIOR";
    } else if (age <= 12) {
      key = (totalIdx % 10 < 1) ? "KIDS" : "JUNIOR";
    } else if (age <= 20) {
      const mod = totalIdx % 10;
      if (mod < 3) key = "JUNIOR";
      else if (mod < 9) key = "TEEN";
      else key = "ADULT";
    } else {
      const mod = totalIdx % 10;
      if (mod < 2) key = "JUNIOR";
      else if (mod < 4) key = "TEEN";
      else key = "ADULT";
    }

    const pool = roomData.shuffledPools?.[key] || [];
    const index = idxs[key] || 0;
    
    const showImage = age <= 12 || difficulty === "easy";
    
    return { 
      ...(pool[index % (pool.length || 1)] || { word: "טוען...", en: "" }), 
      showImage
    };
  }, [roomData.currentTurnIdx, roomData.poolIndices, roomData.shuffledPools, roomData.difficulty, currentP.age]);

  // פונקציית העזר להשהיית/המשך המשחק המסונכרנת
  const togglePause = () => {
    if (roomData.isPaused) {
      updateRoom({ isPaused: false, turnEndTime: Date.now() + ((roomData.pausedTimeLeft || 0) * 1000) });
    } else {
      updateRoom({ isPaused: true, pausedTimeLeft: localTimeLeft });
    }
  };

  if (!isIDescriber) {
    return (
      <div style={s.layout}>
        <div style={s.header}>
          <div style={s.scoreBox}>🏆 {myDisplayScore}</div>
          <div style={s.timer}>{localTimeLeft}</div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={togglePause} style={s.icon}>
              {roomData.isPaused ? '▶️' : '⏸️'}
            </button>
            <button onClick={onExit} style={s.icon}>✕</button>
          </div>
        </div>

        <div style={s.center}>
          {roomData.isPaused ? (
            <div style={s.pauseBox}>
              <h3 style={{ color: '#ffd700', textAlign: 'center' }}>ניהול ניקוד</h3>
              <div style={s.scroll}>
                {(roomData.gameMode === 'individual' ? roomData.players.map((p: any) => p.name) : roomData.teamNames.slice(0, roomData.numTeams)).map((n: string) => (
                  <div key={n} style={s.row}>
                    <span>{n}</span>
                    <div style={s.rowBtn}>
                      <button style={s.miniBtn} onClick={() => { 
                        const sc = {...roomData.totalScores}; 
                        sc[n] = (sc[n] || 0) - 1; 
                        updateRoom({totalScores: sc}); 
                      }}>-</button>
                      <span style={{ minWidth: '30px', textAlign: 'center' }}>{roomData.totalScores[n] || 0}</span>
                      <button style={s.miniBtn} onClick={() => { 
                        const sc = {...roomData.totalScores}; 
                        sc[n] = (sc[n] || 0) + 1; 
                        updateRoom({totalScores: sc}); 
                      }}>+</button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={togglePause} style={s.resume}>המשך</button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '0 20px', width: '100%' }}>
              {roomData.gameMode === 'team' ? (
                isTeammate ? (
                  <>
                    <h2 style={{ color: '#ffd700', fontSize: '2rem', fontWeight: '900', marginBottom: '15px' }}>
                      תהיו קשובים ל-{currentP.name} מקבוצתכם שמתאר/ת את המילה!
                    </h2>
                  </>
                ) : (
                  <>
                    <h2 style={{ color: '#ffd700', fontSize: '1.4rem', marginBottom: '20px' }}>
                      {currentP.name} מ-{roomData.teamNames[currentP.teamIdx]} מנסה לתאר את המילה:
                    </h2>
                    <div style={{ backgroundColor: '#1a1d2e', padding: '30px', borderRadius: '35px', border: '2px solid #ffd700' }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>{wordData.word}</div>
                      <div style={{ fontSize: '1.5rem', opacity: 0.6 }}>({wordData.en})</div>
                    </div>
                  </>
                )
              ) : (
                <>
                  <h2 style={{ color: '#ffd700', fontSize: '2rem' }}>{currentP.name} מתאר/ת...</h2>
                  <p style={{ opacity: 0.7 }}>היו מוכנים לנחש!</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={s.layout}>
      <div style={s.header}>
        <div style={s.scoreBox}>🏆 {myDisplayScore}</div>
        <div style={s.timer}>{localTimeLeft}</div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={togglePause} style={s.icon}>
            {roomData.isPaused ? '▶️' : '⏸️'}
          </button>
          <button onClick={onExit} style={s.icon}>✕</button>
        </div>
      </div>
      
      <button onClick={() => handleAction("SKIP")} style={s.skip}>דלג (1-)</button>

      <div style={s.center}>
        {roomData.isPaused ? (
          <div style={s.pauseBox}>
            <h3 style={{ color: '#ffd700', textAlign: 'center' }}>ניהול ניקוד</h3>
            <div style={s.scroll}>
              {(roomData.gameMode === 'individual' ? roomData.players.map((p: any) => p.name) : roomData.teamNames.slice(0, roomData.numTeams)).map((n: string) => (
                <div key={n} style={s.row}>
                  <span>{n}</span>
                  <div style={s.rowBtn}>
                    <button style={s.miniBtn} onClick={() => { 
                      const sc = {...roomData.totalScores}; 
                      sc[n] = (sc[n] || 0) - 1; 
                      updateRoom({totalScores: sc}); 
                    }}>-</button>
                    <span style={{ minWidth: '30px', textAlign: 'center' }}>{roomData.totalScores[n] || 0}</span>
                    <button style={s.miniBtn} onClick={() => { 
                      const sc = {...roomData.totalScores}; 
                      sc[n] = (sc[n] || 0) + 1; 
                      updateRoom({totalScores: sc}); 
                    }}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={togglePause} style={s.resume}>המשך</button>
          </div>
        ) : (
          <div style={s.card}>
            {wordData.showImage ? (
              <>
                {wordData.img && <div style={s.imgBox}><img src={wordData.img} alt="" style={s.img} /></div>}
                <div style={s.heb}>{wordData.word}</div>
                <div style={s.en}>{wordData.en}</div>
              </>
            ) : (
              <>
                <div style={s.hebL}>{wordData.word}</div>
                <div style={s.enL}>{wordData.en}</div>
              </>
            )}
          </div>
        )}
      </div>

      {!roomData.isPaused && (
        <div style={s.grid}>
          {targets.map((n: string) => (
            <button key={n} onClick={() => handleAction(n)} style={s.target}>{n} (1+)</button>
          ))}
        </div>
      )}
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100%', padding: 'env(safe-area-inset-top) 20px 20px', gap: '10px', maxWidth: '600px', margin: '0 auto', direction: 'rtl' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '70px', position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  scoreBox: { backgroundColor: 'rgba(255,215,0,0.15)', padding: '8px 15px', borderRadius: '15px', color: '#ffd700', fontWeight: '900', fontSize: '1.2rem', minWidth: '70px', textAlign: 'center' },
  timer: { fontSize: '2.5rem', fontWeight: '900', color: '#ef4444', position: 'absolute', left: '50%', transform: 'translateX(-50%)' },
  icon: { background: 'none', border: 'none', color: 'white', fontSize: '1.8rem', cursor: 'pointer', padding: '5px' },
  skip: { width: '100%', height: '55px', border: '2px dashed #ef4444', borderRadius: '15px', color: '#ef4444', fontWeight: 'bold', background: 'none', cursor: 'pointer', fontSize: '1.1rem' },
  center: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '10px 0' },
  card: { width: '100%', maxWidth: '320px', height: '100%', maxHeight: '280px', backgroundColor: '#1a1d2e', borderRadius: '35px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', overflow: 'hidden' },
  imgBox: { width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', overflow: 'hidden' },
  img: { width: '100%', height: '100%', objectFit: 'contain' },
  heb: { fontSize: '1.8rem', fontWeight: '900', textAlign: 'center', wordBreak: 'break-word' }, 
  en: { fontSize: '1.3rem', opacity: 0.6, textAlign: 'center', wordBreak: 'break-word' },
  hebL: { fontSize: '2.5rem', fontWeight: '900', textAlign: 'center', wordBreak: 'break-word' }, 
  enL: { fontSize: '1.6rem', opacity: 0.6, textAlign: 'center', wordBreak: 'break-word' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', paddingBottom: '10px' },
  target: { height: '75px', border: '2px solid #ffd700', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: '900', backgroundColor: 'rgba(255,215,0,0.05)', color: '#ffd700', cursor: 'pointer' },
  pauseBox: { width: '100%', height: '100%', backgroundColor: '#1a1d2e', borderRadius: '35px', padding: '20px', display: 'flex', flexDirection: 'column' },
  scroll: { flex: 1, overflowY: 'auto', margin: '10px 0' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #333', alignItems: 'center' },
  rowBtn: { display: 'flex', gap: '15px', alignItems: 'center' },
  miniBtn: { width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #ffd700', background: 'none', color: '#ffd700', cursor: 'pointer' },
  resume: { height: '50px', backgroundColor: '#ffd700', color: '#05081c', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', border: 'none', marginTop: '10px' }
};