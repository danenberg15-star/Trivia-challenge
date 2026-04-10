"use client";
import React, { useState } from "react";
import Image from "next/image"; 

interface EntryStepProps {
  onJoin: (code: string, name: string) => Promise<boolean>;
  onCreate: (name: string, isSolo: boolean, difficulty?: string) => Promise<void>;
  onSetName: (name: string) => void;
  onViewHighscores: () => void;
}

export default function EntryStep({ onJoin, onCreate, onSetName, onViewHighscores }: EntryStepProps) {
  const [name, setName] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [difficulty, setDifficulty] = useState("dynamic");
  const [loading, setLoading] = useState(false);

  const validateName = () => {
    if (!name.trim()) { alert("אנא הכנס שם 🙂"); return false; }
    return true;
  };

  const handleSolo = async () => {
    if (!validateName()) return;
    setLoading(true);
    await onCreate(name, true, difficulty);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!validateName()) return;
    setLoading(true);
    try { await onCreate(name, false); } 
    catch (e: any) { alert("שגיאה ביצירת חדר: " + (e.message || "נסה שוב")); }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!name.trim()) return alert("אנא הכנס שם 🙂");
    if (!inputCode.trim()) return alert("אנא הכנס קוד חדר");
    setLoading(true);
    try {
      const success = await onJoin(inputCode, name);
      if (!success) alert("חדר לא נמצא");
    } catch (e: any) { alert("שגיאה בהצטרפות: " + (e.message || "נסה שוב")); }
    setLoading(false);
  };

  return (
    <div style={s.layout}>
      <button onClick={onViewHighscores} style={s.trophyBtn} title="טבלת שיאים">🏆</button>
      
      {/* הלוגו עכשיו מוגדר כרספונסיבי לחלוטין ולוקח את רוחב המסך */}
      <div style={s.logoContainer}>
        <Image 
          src="/logo.webp" 
          alt="Trivia Time Logo" 
          width={800} 
          height={400} 
          priority 
          style={{ width: '100%', height: 'auto', maxHeight: '35vh', objectFit: 'contain' }}
        />
      </div>

      <div style={s.form}>
        <input style={s.input} placeholder="שם שחקן" value={name} onChange={(e) => { setName(e.target.value); onSetName(e.target.value); }} disabled={loading} />
        
        <div style={s.settingsBlock}>
          <div style={s.settingLabel}>רמת קושי (למשחק יחיד):</div>
          <div style={s.toggles}>
            <button onClick={() => setDifficulty('easy')} style={{ ...s.toggleBtn, ...(difficulty === "easy" ? s.toggleBtnActive : {}) }}>קל</button>
            <button onClick={() => setDifficulty('dynamic')} style={{ ...s.toggleBtn, ...(difficulty === "dynamic" ? s.toggleBtnActive : {}) }}>משתנה</button>
            <button onClick={() => setDifficulty('hard')} style={{ ...s.toggleBtn, ...(difficulty === "hard" ? s.toggleBtnActive : {}) }}>קשה</button>
          </div>
        </div>

        <button onClick={handleSolo} disabled={loading} style={s.soloBtn}>⏱️ משחק אישי (נגד הטיימר)</button>
        
        <div style={s.groupFrame}>
          <div style={s.groupLabel}>משחק קבוצתי ברשת</div>
          <button onClick={handleCreate} disabled={loading} style={s.primaryBtn}>{loading ? "מייצר חדר..." : "+ פתיחת חדר חדש"}</button>
          <div style={s.divider}>או הצטרפות לקיים:</div>
          <input style={s.inputSmall} placeholder="קוד חדר" value={inputCode} onChange={(e) => setInputCode(e.target.value.trim())} disabled={loading} />
          <button onClick={handleJoin} disabled={loading} style={s.secondaryBtn}>{loading ? "מתחבר..." : "הצטרפות למשחק"}</button>
        </div>
      </div>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', alignItems: 'center', padding: '20px', direction: 'rtl', position: 'relative', overflowY: 'auto', boxSizing: 'border-box' },
  trophyBtn: { position: 'absolute', top: '15px', right: '15px', fontSize: '1.8rem', background: 'rgba(255,145,0,0.1)', border: '1px solid #FF9100', borderRadius: '50%', width: '55px', height: '55px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(255,145,0,0.2)', zIndex: 10, transition: 'transform 0.2s' },
  // הקונטיינר של הלוגו לוקח 100% מהרוחב, עם מרווחים יחסיים (vh)
  logoContainer: { width: '100%', maxWidth: '550px', flexShrink: 0, marginTop: '4vh', marginBottom: '2vh', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  // הטופס הוגדר למילוי השטח הנותר (flex: 1) ופיזור אחיד
  form: { width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: 'max(15px, 2vh)', flex: 1, justifyContent: 'center', paddingBottom: '3vh' },
  input: { height: '55px', flexShrink: 0, borderRadius: '15px', border: '1px solid rgba(0,229,255,0.3)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', textAlign: 'center', fontSize: '1.2rem', transition: 'border-color 0.2s' },
  settingsBlock: { backgroundColor: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '15px', border: '1px solid rgba(0,229,255,0.1)', flexShrink: 0 },
  settingLabel: { fontSize: '0.9rem', color: '#FF9100', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' },
  toggles: { display: 'flex', gap: '8px' },
  toggleBtn: { flex: 1, height: '35px', borderRadius: '8px', border: '1px solid #FF9100', backgroundColor: 'transparent', color: '#FF9100', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' },
  toggleBtnActive: { backgroundColor: '#FF9100', color: '#05081c' },
  soloBtn: { height: '60px', flexShrink: 0, backgroundColor: '#00E5FF', color: '#05081c', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '1.2rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,229,255,0.3)', transition: 'transform 0.2s' },
  groupFrame: { border: '2px solid rgba(255,145,0,0.3)', borderRadius: '20px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: 'rgba(255,255,255,0.01)', position: 'relative', marginTop: '1vh', flexShrink: 0 },
  groupLabel: { position: 'absolute', top: '-12px', right: '20px', backgroundColor: '#05081c', padding: '0 10px', color: '#FF9100', fontSize: '0.9rem', fontWeight: 'bold' },
  inputSmall: { height: '45px', borderRadius: '10px', border: '1px solid rgba(255,145,0,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', textAlign: 'center', fontSize: '1.1rem' },
  primaryBtn: { height: '50px', backgroundColor: '#FF9100', color: '#05081c', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', transition: 'transform 0.2s' },
  secondaryBtn: { height: '45px', backgroundColor: 'transparent', color: '#FF9100', border: '2px solid #FF9100', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' },
  divider: { textAlign: 'center', margin: '2px 0', opacity: 0.5, fontSize: '0.8rem' }
};