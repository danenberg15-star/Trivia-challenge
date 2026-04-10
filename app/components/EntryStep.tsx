"use client";
import React, { useState } from "react";

interface EntryStepProps {
  onJoin: (code: string, name: string) => Promise<boolean>;
  onCreate: (name: string) => Promise<void>;
  onSetName: (name: string) => void;
}

export default function EntryStep({ onJoin, onCreate, onSetName }: EntryStepProps) {
  const [name, setName] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return alert("אנא הכנס שם 🙂");
    setLoading(true);
    try {
      await onCreate(name);
    } catch (e: any) {
      alert("שגיאה ביצירת חדר: " + (e.message || "נסה שוב"));
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!name.trim()) return alert("אנא הכנס שם 🙂");
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
        <button onClick={handleCreate} disabled={loading} style={{...s.primaryBtn, opacity: loading ? 0.7 : 1}}>
          {loading ? "מייצר חדר..." : "+ פתיחת חדר חדש"}
        </button>
        
        <div style={s.divider}>או הצטרפות</div>
        
        <input 
          style={s.input} 
          placeholder="קוד חדר" 
          value={inputCode} 
          onChange={(e) => setInputCode(e.target.value.trim())} 
          disabled={loading}
        />
        <button onClick={handleJoin} disabled={loading} style={{...s.secondaryBtn, opacity: loading ? 0.7 : 1}}>
          {loading ? "מתחבר..." : "הצטרפות למשחק"}
        </button>
      </div>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', alignItems: 'center', justifyContent: 'center', padding: '20px', direction: 'rtl' },
  title: { color: '#ffd700', fontSize: '3rem', fontWeight: '900', marginBottom: '40px' },
  form: { width: '100%', maxWidth: '350px', display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { height: '55px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', textAlign: 'center', fontSize: '1.2rem' },
  primaryBtn: { height: '55px', backgroundColor: '#ffd700', color: '#05081c', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '1.2rem', cursor: 'pointer' },
  secondaryBtn: { height: '55px', backgroundColor: 'transparent', color: '#ffd700', border: '2px solid #ffd700', borderRadius: '15px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' },
  divider: { textAlign: 'center', margin: '10px 0', opacity: 0.5 }
};