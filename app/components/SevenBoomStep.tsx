"use client";
import React, { useState, useMemo } from "react";

export default function SevenBoomStep({ roomData, userId, updateRoom, handleAction, onExit }: any) {
  const [showExplanation, setShowExplanation] = useState(true);
  const [wordsCount, setWordsCount] = useState(0);

  const currentP = roomData.players[roomData.currentTurnIdx];
  const isIDescriber = currentP.id === userId;
  const me = roomData.players.find((p: any) => p.id === userId);

  const myDisplayScore = useMemo(() => {
    if (roomData.gameMode === 'individual') return roomData.totalScores[me?.name] || 0;
    const myTeamName = roomData.teamNames[me?.teamIdx];
    return roomData.totalScores[myTeamName] || 0;
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
      key = mod < 3 ? "JUNIOR" : (mod < 9 ? "TEEN" : "ADULT");
    } else {
      const mod = totalIdx % 10;
      key = mod < 2 ? "JUNIOR" : (mod < 4 ? "TEEN" : "ADULT");
    }

    const pool = roomData.shuffledPools?.[key] || [];
    const index = idxs[key] || 0;
    
    const showImage = age <= 12 || difficulty === "easy";

    return { 
      ...(pool[index % (pool.length || 1)] || { word: "טוען...", en: "" }), 
      showImage
    };
  }, [roomData.currentTurnIdx, roomData.poolIndices, roomData.shuffledPools, roomData.difficulty, currentP.age]);

  const handleCorrect = (teamName: string) => {
    handleAction(teamName, 2);
    if (wordsCount + 1 >= 7) updateRoom({ step: 6 });
    else setWordsCount(prev => prev + 1);
  };

  const handleSkip = () => {
    handleAction("SKIP");
    if (wordsCount + 1 >= 7) updateRoom({ step: 6 });
    else setWordsCount(prev => prev + 1);
  };

  if (showExplanation) {
    return (
      <div style={{...s.layout, justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
        <div style={{...s.pauseBox, height: 'auto', padding: '40px 20px', maxWidth: '400px'}}>
          <h1 style={{ color: '#ffd700', fontSize: '3rem', fontWeight: '900', marginBottom: '20px' }}>7 בום! 💣</h1>
          <div style={{ color: 'white', fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '30px' }}>
            <p><strong>בשלב זה אין טיימר!</strong></p>
            <p>עליכם לתאר 7 מילים.</p>
            <p>כל הקבוצות יכולות לנחש. **כל ניחוש נכון שווה 2 נקודות!**</p>
          </div>
          <button onClick={() => setShowExplanation(false)} style={s.resume}>הבנתי, בואו נתחיל!</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.layout}>
      <div style={s.header}>
        <div style={s.scoreBox}>🏆 {myDisplayScore}</div>
        <div style={{...s.timer, color: '#ffd700', fontSize: '1.5rem', width: 'max-content'}}>מילה {wordsCount + 1} / 7</div>
        <button onClick={onExit} style={s.icon}>✕</button>
      </div>
      <button onClick={handleSkip} style={s.skip}>דלג (1-)</button>
      <div style={s.center}>
          <div style={s.card}>
            {isIDescriber ? (
              <>
                {wordData.showImage && wordData.img && <div style={s.imgBox}><img src={wordData.img} alt="" style={s.img} /></div>}
                <div style={wordData.showImage ? s.heb : s.hebL}>{wordData.word}</div>
                <div style={wordData.showImage ? s.en : s.enL}>{wordData.en}</div>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: '#ffd700', fontSize: '2rem' }}>{currentP.name} מתאר/ת...</h2>
                <p style={{ opacity: 0.7 }}>כל הקבוצות יכולות לנחש!</p>
              </div>
            )}
          </div>
      </div>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <p style={{ textAlign: 'center', fontSize: '0.9rem', opacity: 0.8 }}>מי ניחש נכון? (2+)</p>
        <div style={s.grid}>
          {roomData.teamNames.slice(0, roomData.numTeams).map((n: string) => (
            <button key={n} onClick={() => handleCorrect(n)} style={s.target}>{n}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100%', padding: 'env(safe-area-inset-top) 20px 20px', gap: '10px', maxWidth: '600px', margin: '0 auto', direction: 'rtl' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '70px', position: 'relative' },
  scoreBox: { backgroundColor: 'rgba(255,215,0,0.15)', padding: '8px 15px', borderRadius: '15px', color: '#ffd700', fontWeight: '900', fontSize: '1.2rem' },
  timer: { fontSize: '2rem', fontWeight: '900', color: '#ffd700' },
  icon: { background: 'none', border: 'none', color: 'white', fontSize: '1.8rem' },
  skip: { width: '100%', minHeight: '55px', border: '2px dashed #ef4444', borderRadius: '15px', color: '#ef4444', fontWeight: 'bold', background: 'none' },
  center: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  card: { width: '100%', backgroundColor: '#1a1d2e', borderRadius: '35px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  imgBox: { height: '150px', marginBottom: '10px' },
  img: { height: '100%', objectFit: 'contain' },
  heb: { fontSize: '1.8rem', fontWeight: '900', wordBreak: 'break-word', textAlign: 'center' }, 
  hebL: { fontSize: '2.5rem', fontWeight: '900', wordBreak: 'break-word', textAlign: 'center' },
  en: { fontSize: '1.2rem', opacity: 0.6, wordBreak: 'break-word', textAlign: 'center' }, 
  enL: { fontSize: '1.5rem', opacity: 0.6, wordBreak: 'break-word', textAlign: 'center' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  target: { height: '60px', border: '2px solid #ffd700', borderRadius: '15px', color: '#ffd700', fontWeight: '900', background: 'none' },
  pauseBox: { backgroundColor: '#0f172a', borderRadius: '24px', padding: '25px', border: '1px solid #ffd700' },
  resume: { height: '55px', backgroundColor: '#ffd700', color: '#05081c', borderRadius: '15px', fontWeight: '900', border: 'none', width: '100%' }
};