"use client";
import React, { useState, useRef, useEffect } from "react";

export default function SetupStep({ roomData, userId, updateRoom, onStart }: any) {
  const [draggedPlayer, setDraggedPlayer] = useState<any>(null);
  const [hoveredTeam, setHoveredTeam] = useState<number | null>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const teamRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const gameMode = roomData.gameMode || "team";
  const difficulty = roomData.difficulty || "dynamic";
  const players = roomData.players || [];
  const teamNames = roomData.teamNames || ['קבוצה 1', 'קבוצה 2'];
  const numTeams = teamNames.length;

  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if (draggedPlayer) e.preventDefault();
    };
    document.addEventListener('touchmove', preventDefault, { passive: false });
    return () => document.removeEventListener('touchmove', preventDefault);
  }, [draggedPlayer]);

  const HEBREW_LETTERS = ["א'", "ב'", "ג'", "ד'"];

  const getNextTeamName = () => {
    for (let letter of HEBREW_LETTERS) {
      const nameToCheck = `קבוצה ${letter}`;
      if (!teamNames.includes(nameToCheck)) return nameToCheck;
    }
    return `קבוצה ?`;
  };

  const handleAddTeam = () => {
    if (numTeams >= 4) return;
    const newNames = [...teamNames, getNextTeamName()];
    const newTimeBanks = { ...roomData.timeBanks, [newNames[newNames.length - 1]]: 15 };
    const newPowerUps = { ...roomData.powerUps, [newNames[newNames.length - 1]]: [] };
    updateRoom({ teamNames: newNames, timeBanks: newTimeBanks, powerUps: newPowerUps });
  };

  const handleRemoveTeam = (idx: number) => {
    const newNames = [...teamNames];
    newNames.splice(idx, 1);
    const newPlayers = players.map((p: any) => p.teamIdx === idx ? { ...p, teamIdx: 0 } : (p.teamIdx > idx ? { ...p, teamIdx: p.teamIdx - 1 } : p));
    updateRoom({ teamNames: newNames, players: newPlayers });
  };

  const handlePlayerMove = (pId: string, tIdx: number) => {
    const newPlayers = players.map((p: any) => p.id === pId ? { ...p, teamIdx: tIdx } : p);
    updateRoom({ players: newPlayers });
  };

  // בדיקה אם יש קבוצה ריקה לחלוטין
  const hasEmptyTeam = Array.from({ length: numTeams }).some((_, i) =>
    players.filter((p: any) => p.teamIdx === i).length === 0
  );

  // שינינו למינימום 1 בכל קבוצה (היה 2)
  const canStart = gameMode === "individual" ? players.length >= 1 : 
    Array.from({ length: numTeams }).every((_, i) => players.filter((p: any) => p.teamIdx === i).length >= 1);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggedPlayer) return;
    if (ghostRef.current) {
      ghostRef.current.style.left = `${e.clientX - 60}px`;
      ghostRef.current.style.top = `${e.clientY - 25}px`;
    }
    let found: number | null = null;
    const count = gameMode === "team" ? numTeams : 1;
    for (let i = 0; i < count; i++) {
      const rect = teamRefs.current[i]?.getBoundingClientRect();
      if (rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        found = i;
        break;
      }
    }
    if (found !== hoveredTeam) setHoveredTeam(found);
  };

  const handleWhatsAppShare = () => {
    const shareUrl = `${window.location.origin}/?room=${roomData.id}`;
    const text = `בואו לשחק איתי טריוויה צ'אלנג'! קוד החדר הוא: ${roomData.id} \n ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div
      style={s.layout}
      onPointerMove={handlePointerMove}
      onPointerUp={() => {
        if (draggedPlayer && hoveredTeam !== null) handlePlayerMove(draggedPlayer.id, hoveredTeam);
        setDraggedPlayer(null); setHoveredTeam(null);
      }}
    >
      {/* Header */}
      <div style={s.header}>
        <div style={{ fontSize: '1.2rem' }}>
          קוד חדר: <span style={{ color: '#FF9100', fontWeight: '900', fontSize: '1.8rem' }}>{roomData.id}</span>
        </div>
        <button onClick={handleWhatsAppShare} style={s.waBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 0 5.415 0 12.051c0 2.12.553 4.189 1.601 6.01L0 24l6.135-1.61a11.815 11.815 0 005.912 1.583h.005c6.635 0 12.05-5.417 12.05-12.052a11.75 11.75 0 00-3.528-8.52z"/></svg>
        </button>
      </div>

      {/* Settings Block - חשוף לכולם */}
      <div style={s.settingsBlock}>
        <div style={s.settingRow}>
          <div style={s.settingLabel}>מצב משחק:</div>
          <div style={s.toggles}>
            <button onClick={() => updateRoom({ gameMode: 'individual' })} style={{ ...s.toggleBtn, ...(gameMode === "individual" ? s.toggleBtnActive : {}) }}>יחידים</button>
            <button onClick={() => updateRoom({ gameMode: 'team' })} style={{ ...s.toggleBtn, ...(gameMode === "team" ? s.toggleBtnActive : {}) }}>קבוצות</button>
          </div>
        </div>
        <div style={s.settingRow}>
          <div style={s.settingLabel}>רמת קושי:</div>
          <div style={s.toggles}>
            <button onClick={() => updateRoom({ difficulty: 'easy' })} style={{ ...s.toggleBtn, ...(difficulty === "easy" ? s.toggleBtnActive : {}) }}>קל</button>
            <button onClick={() => updateRoom({ difficulty: 'dynamic' })} style={{ ...s.toggleBtn, ...((difficulty === "dynamic" || difficulty === "medium") ? s.toggleBtnActive : {}) }}>משתנה</button>
            <button onClick={() => updateRoom({ difficulty: 'hard' })} style={{ ...s.toggleBtn, ...(difficulty === "hard" ? s.toggleBtnActive : {}) }}>קשה</button>
          </div>
        </div>
      </div>

      {/* Players Grid */}
      <div style={{ ...s.grid, gridTemplateColumns: gameMode === "team" ? '1fr 1fr' : '1fr' }}>
        {Array.from({ length: gameMode === "team" ? numTeams : 1 }).map((_, tIdx) => {
          const teamPlayers = players.filter((p: any) => gameMode === "individual" || p.teamIdx === tIdx);
          return (
            <div key={tIdx} ref={el => { teamRefs.current[tIdx] = el; }} style={{
              ...s.teamBox,
              // הוספת הכתום כשמרחפים על הקבוצה
              ...(hoveredTeam === tIdx ? { borderColor: '#FF9100', backgroundColor: 'rgba(255,145,0,0.1)' } : {})
            }}>
              <div style={s.teamHeader}>
                {gameMode === "team" ? teamNames[tIdx] : "משתתפים"}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '5px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {teamPlayers.map((p: any) => (
                  <div
                    key={p.id}
                    onPointerDown={(e) => {
                      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
                      setDraggedPlayer(p);
                    }}
                    style={{ ...s.playerCard, cursor: 'grab' }}
                  >
                    {p.name} {p.id === userId ? "(את/ה)" : ""}
                  </div>
                ))}
                {gameMode === "team" && numTeams > 2 && teamPlayers.length === 0 && (
                  <button onClick={() => handleRemoveTeam(tIdx)} style={s.minusBtn}>- הסר קבוצה</button>
                )}
              </div>
            </div>
          );
        })}
        
        {/* כפתור יצירת קבוצה מופיע רק כשאין קבוצות ריקות */}
        {gameMode === "team" && numTeams < 4 && !hasEmptyTeam && (
          <button onClick={handleAddTeam} style={{ ...s.teamBox, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', borderColor: 'rgba(255,255,255,0.2)' }}>
            <span style={{ fontSize: '2rem', color: '#FF9100' }}>+</span>
          </button>
        )}
      </div>

      {/* Footer - חשוף וזמין לכולם */}
      <div style={{ width: '100%', marginTop: '10px' }}>
        {!canStart && gameMode === "team" && <p style={{ color: '#ef4444', fontSize: '0.9rem', textAlign: 'center', margin: '5px 0' }}>לפחות שחקן 1 בכל קבוצה כדי להתחיל</p>}
        <button onClick={onStart} disabled={!canStart} style={canStart ? s.primaryBtn : s.disabledBtn}>בואו נשחק! 🚀</button>
      </div>

      {/* Ghost Element for Dragging */}
      {draggedPlayer && (
        <div ref={ghostRef} style={{ position: 'fixed', zIndex: 9999, pointerEvents: 'none', backgroundColor: '#00E5FF', padding: '10px', borderRadius: '12px', color: '#05081c', fontWeight: 'bold', width: '100px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,229,255,0.4)' }}>
          {draggedPlayer.name}
        </div>
      )}
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', padding: '20px', direction: 'rtl', boxSizing: 'border-box', touchAction: 'none', userSelect: 'none', overflow: 'hidden' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '15px', width: '100%' },
  waBtn: { background: '#25D366', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 },
  settingsBlock: { display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginBottom: '15px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '15px' },
  settingRow: { display: 'flex', flexDirection: 'column', gap: '5px' },
  settingLabel: { fontSize: '0.9rem', color: '#FF9100', fontWeight: 'bold' },
  toggles: { display: 'flex', gap: '10px', width: '100%' },
  toggleBtn: { flex: 1, height: '40px', borderRadius: '10px', border: '1px solid #FF9100', backgroundColor: 'transparent', color: '#FF9100', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' },
  toggleBtnActive: { backgroundColor: '#FF9100', color: '#05081c' },
  grid: { display: 'grid', gap: '10px', width: '100%', flex: 1, overflow: 'hidden' },
  teamBox: { border: '2px solid rgba(255,255,255,0.1)', borderRadius: '15px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'all 0.2s' },
  teamHeader: { padding: '8px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#FF9100', fontWeight: 'bold', fontSize: '1.1rem' },
  // צבע הטורקיז של הלוגו לכרטיסיות השחקנים לניגודיות טובה
  playerCard: { backgroundColor: 'rgba(0,229,255,0.1)', border: '1px solid #00E5FF', borderRadius: '10px', padding: '12px', margin: '5px', textAlign: 'center', color: 'white', fontWeight: 'bold', transition: 'transform 0.1s' },
  minusBtn: { backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', padding: '5px', margin: '5px auto', cursor: 'pointer', width: '80%' },
  primaryBtn: { height: '60px', backgroundColor: '#FF9100', color: '#05081c', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '1.5rem', cursor: 'pointer', width: '100%', boxShadow: '0 4px 15px rgba(255,145,0,0.3)', transition: 'transform 0.2s' },
  disabledBtn: { height: '60px', backgroundColor: '#1a1d2e', color: '#4b5563', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '15px', fontWeight: '900', fontSize: '1.5rem', cursor: 'not-allowed', width: '100%' }
};