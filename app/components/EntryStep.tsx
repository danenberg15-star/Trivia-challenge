"use client";
import React, { useState } from "react";

interface EntryStepProps {
  onJoin: (code: string, name: string) => Promise<boolean>;
  onCreate: (name: string, isSolo?: boolean) => Promise<void>;
  onSetName: (name: string) => void;
}

export default function EntryStep({ onJoin, onCreate, onSetName }: EntryStepProps) {
  const [name, setName] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);

  const validateName = () => {
    if (!name.trim()) {
      alert("אנא הכנס שם 🙂");
      return false;
    }
    return true;
  };

  const handleSolo = async () => {
    if (!validateName()) return;
    setLoading(true);
    // מייצר חדר עם דגל Solo כדי לדלג על ה-Setup ב-page.tsx
    await onCreate(name, true);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!validateName()) return;
    setLoading(true);
    try {
      await onCreate(name, false);
    } catch (e: any) {
      alert("שגיאה ביצירת חדר: " + (e.message || "נסה שוב"));
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!validateName()) return;
    if (!inputCode.trim()) return alert("אנא הכנס קוד חדר");
    setLoading(true);
    try {
      const success = await onJoin(inputCode, name);
      if (!success) alert("חדר לא נמצא");
    } catch (e: any) {
      alert("שגיאה בהצטרפות: " + (e.message || "נסה שוב"));
    }
    setLoading(false);
  };

  return (
    <div style={s.layout}>
      <h1 style={s.title}>Trivia Time</h1>
      
      <div style={s.form}>
        <input 
          style={s.input} 
          placeholder="שם שחקן" 
          value={name} 
          onChange={(e) => { setName(e.target.value); onSetName(e.target.value); }} 
          disabled={loading}
        />

        {/* אופציה 1: סולו */}
        <button onClick={handleSolo} disabled={loading} style={s.soloBtn}>
           ⏱️ משחק מהיר (יחיד)
        </button>

        {/* אופציה 2: קבוצתי בתוך מסגרת */}
        <div style={s.groupFrame}>
          <div style={s.groupLabel}>משחק קבוצתי</div>
          
          <button onClick={handleCreate} disabled={loading} style={s.primaryBtn}>
            {loading ? "מייצר חדר..." : "+ פתיחת חדר חדש"}
          </button>
          
          <div style={s.divider}>או הצטרפות לקיים:</div>
          
          <input 
            style={s.inputSmall} 
            placeholder="קוד חדר" 
            value={inputCode} 
            onChange={(e) => setInputCode(e.target.value.trim())} 
            disabled={loading}
          />
          <button onClick={handleJoin} disabled={loading} style={s.secondaryBtn}>
            {loading ? "מתחבר..." : "הצטרפות"}
          </button>
        </div>
      </div>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', alignItems: 'center', justifyContent: 'center', padding: '20px', direction: 'rtl' },
  title: { color: '#ffd700', fontSize: '3.5rem', fontWeight: '900', marginBottom: '30px', textShadow: '0 0 20px rgba(255,215,0,0.3)' },
  form: { width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { height: '60px', borderRadius: '15px', border: '2px solid rgba(255,215,0,0.3)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', textAlign: 'center', fontSize: '1.4rem', marginBottom: '10px' },
  soloBtn: { height: '65px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '1.3rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' },
  groupFrame: { border: '2px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'rgba(255,255,255,0.02)', position: 'relative', marginTop: '10px' },
  groupLabel: { position: 'absolute', top: '-12px', right: '20px', backgroundColor: '#05081c', padding: '0 10px', color: '#ffd700', fontSize: '0.9rem', fontWeight: 'bold' },
  inputSmall: { height: '45px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', textAlign: 'center', fontSize: '1.1rem' },
  primaryBtn: { height: '50px', backgroundColor: '#ffd700', color: '#05081c', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer' },
  secondaryBtn: { height: '45px', backgroundColor: 'transparent', color: '#ffd700', border: '2px solid #ffd700', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' },
  divider: { textAlign: 'center', fontSize: '0.8rem', opacity: 0.5, margin: '5px 0' }
};