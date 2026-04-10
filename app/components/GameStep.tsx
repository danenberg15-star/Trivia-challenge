"use client";
import React, { useState, useEffect } from "react";

// שאלות דמו כדי שיהיה למשחק מאיפה למשוך (עד שנחבר את הקובץ המלא)
const MOCK_QUESTIONS = [
  { text: "כמה יבשות יש בעולם?", options: ["5", "6", "7", "8"], correctIdx: 2 },
  { text: "מי הגיבור הראשי במשחק מריו?", options: ["שרברב", "נגר", "חשמלאי", "שוטר"], correctIdx: 0 },
  { text: "איזו חיה היא המהירה ביבשה?", options: ["אריה", "צבי", "ברדלס", "נמר"], correctIdx: 2 },
  { text: "איזה חטיף ישראלי מבוסס בוטנים?", options: ["ביסלי", "במבה", "תפוצ'יפס", "אפרופו"], correctIdx: 1 },
  { text: "מהי עיר הבירה של יפן?", options: ["בייג'ינג", "טוקיו", "סיאול", "האנוי"], correctIdx: 1 },
];

export default function GameStep({ roomData, userId, updateRoom, handleAnswer }: any) {
  const isIndividual = roomData.gameMode === "individual";
  const me = roomData.players.find((p: any) => p.id === userId);
  const myTeamName = isIndividual ? me.name : roomData.teamNames[me.teamIdx];
  const myTeamPlayers = isIndividual ? [me] : roomData.players.filter((p: any) => p.teamIdx === me.teamIdx);
  
  // טיימר דינמי - מתחיל מבנק השניות העדכני של הקבוצה
  const initialTime = roomData.timeBanks[myTeamName] || 15;
  const [timeLeft, setTimeLeft] = useState(initialTime);

  // ספירה לאחור של השעון
  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((prev: number) => prev - 1);
    }, 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  // מניעת באגים - שליפת שאלה נכונה מהמערך במעגליות
  const qIdx = (roomData.currentQuestionIdx || 0) % MOCK_QUESTIONS.length;
  const question = MOCK_QUESTIONS[qIdx];
  const votes = roomData.votes || {};

  const handleVote = (optIdx: number) => {
    let newVotes = { ...votes, [userId]: optIdx };
    
    // לוגיקת סנכרון בוטים לחדר ה-QA של עומר - כדי שלא תיתקע!
    if (!isIndividual && (roomData.id === 'עומר' || roomData.id === 'qa_omer_room')) {
      myTeamPlayers.forEach((p: any) => {
        if (p.isBot) newVotes[p.id] = optIdx;
      });
    }
    
    updateRoom({ votes: newVotes });
  };

  // בדיקה האם כל חברי הקבוצה שלי הצביעו (ותנאי ללחיצה על סופי)
  const myTeamVotes = myTeamPlayers.map((p: any) => votes[p.id]);
  const allVoted = myTeamVotes.every((v: any) => v !== undefined);
  const firstVote = myTeamVotes[0];
  const allAgreed = allVoted && myTeamVotes.every((v: any) => v === firstVote);

  const handleSubmit = () => {
    if (!isIndividual && !allAgreed) return;
    const finalAnswer = isIndividual ? votes[userId] : firstVote;
    const isCorrect = finalAnswer === question.correctIdx;
    
    // שולחים לשרת גם אם צדקנו וגם את השניות שנשארו לנו ברגע זה!
    handleAnswer(isCorrect, timeLeft);
  };

  // חישובי ה-Athlete Clock הגרפי (מעגל אדום)
  const maxTime = isIndividual ? 60 : 120;
  const progress = Math.min(Math.max(timeLeft / maxTime, 0), 1);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <div style={s.layout}>
      {/* Athlete Clock UI */}
      <div style={s.clockContainer}>
        <svg width="150" height="150" viewBox="0 0 150 150">
          {/* רקע המעגל (אפור כהה/שקוף) */}
          <circle cx="75" cy="75" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
          {/* פס ההתקדמות (אדום) */}
          <circle 
            cx="75" cy="75" r={radius} 
            fill="none" 
            stroke="#ef4444" 
            strokeWidth="10" 
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 75 75)" 
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div style={s.clockTime}>{timeLeft}</div>
      </div>

      <div style={s.questionCard}>
        <h2 style={s.questionText}>{question.text}</h2>
      </div>

      <div style={s.optionsGrid}>
        {question.options.map((opt: string, i: number) => {
          // מציאת השחקנים בקבוצה שלי שהצביעו לתשובה זו (בשביל המסגרות המקווקוות)
          const votersForThis = myTeamPlayers.filter((p: any) => votes[p.id] === i);
          const isSelectedByMe = votes[userId] === i;
          
          return (
            <div 
              key={i} 
              onClick={() => handleVote(i)}
              style={{
                ...s.optionBtn,
                borderColor: isSelectedByMe ? '#ffd700' : 'rgba(255,255,255,0.2)',
                backgroundColor: isSelectedByMe ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)'
              }}
            >
              <span style={s.optionText}>{opt}</span>
              
              {/* חיווי ויזואלי של שאר חברי הקבוצה (פסים מקווקוים) */}
              {!isIndividual && votersForThis.length > 0 && (
                <div style={s.votersContainer}>
                  {votersForThis.map((p: any) => (
                    <div key={p.id} style={{ ...s.voterDot, backgroundColor: p.color }} title={p.name} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* כפתור סופי */}
      <button 
        onClick={handleSubmit} 
        disabled={isIndividual ? votes[userId] === undefined : !allAgreed}
        style={(isIndividual ? votes[userId] !== undefined : allAgreed) ? s.submitBtn : s.submitBtnDisabled}
      >
        {isIndividual ? "סופי!" : (allAgreed ? "ננעלנו - סופי!" : "מחכים להסכמה בקבוצה...")}
      </button>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', padding: '20px', direction: 'rtl', alignItems: 'center' },
  clockContainer: { position: 'relative', width: '150px', height: '150px', margin: '20px auto', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  clockTime: { position: 'absolute', fontSize: '3.5rem', fontWeight: '900', color: 'white', fontFamily: 'monospace' },
  questionCard: { width: '100%', maxWidth: '600px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '30px 20px', textAlign: 'center', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)' },
  questionText: { fontSize: '1.5rem', fontWeight: 'bold', color: '#ffd700', lineHeight: '1.4' },
  optionsGrid: { display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '600px', flex: 1 },
  optionBtn: { position: 'relative', border: '2px solid', borderRadius: '15px', padding: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' },
  optionText: { fontSize: '1.2rem', fontWeight: 'bold' },
  votersContainer: { display: 'flex', gap: '5px' },
  voterDot: { width: '12px', height: '12px', borderRadius: '50%', border: '1px solid white' },
  submitBtn: { width: '100%', maxWidth: '600px', height: '65px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '1.5rem', cursor: 'pointer', marginTop: '20px', boxShadow: '0 4px 15px rgba(239,68,68,0.4)' },
  submitBtnDisabled: { width: '100%', maxWidth: '600px', height: '65px', backgroundColor: '#334155', color: '#94a3b8', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '1.2rem', cursor: 'not-allowed', marginTop: '20px' }
};