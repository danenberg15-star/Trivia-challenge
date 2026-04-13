"use client";
import { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, get, set } from 'firebase/database';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).substring(2, 15);
};

// רשימת שמות חדרים מיוחדים שמפעילים בוטים
const BOT_ROOMS = ['עומר', 'qa_omer_room', 'עומר Q', 'עומר q'];

export function useGameState() {
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    const savedId = localStorage.getItem('trivia_user_id') || generateId();
    localStorage.setItem('trivia_user_id', savedId);
    setUserId(savedId);
  }, []);

  // יצירת חדר חדש (משחק רשת חברים)
  const handleCreateRoom = async (creatorName: string) => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomRef = ref(db, `rooms/${newRoomId}`);
    
    await set(roomRef, {
      id: newRoomId,
      step: 3, 
      players: [{ id: userId, name: creatorName, teamIdx: 0 }],
      teamNames: ['קבוצה 1', 'קבוצה 2'],
      timeBanks: { 'קבוצה 1': 15, 'קבוצה 2': 15 },
      powerUps: { 'קבוצה 1': [], 'קבוצה 2': [] },
      readyTeams: {},
      gameMode: 'group',
      seed: 37,
      currentQuestionIdx: 0,
      askedQuestions: []
    });
    return newRoomId;
  };

  // הצטרפות לחדר קיים
  const handleJoinRoom = async (code: string, playerName: string) => {
    if (!code || !playerName) return false;
    
    const upperCode = code.toUpperCase();
    const originalCode = code.trim();

    // בדיקה אם זה חדר בוטים (עכשיו תומך גם בעומר Q)
    if (BOT_ROOMS.includes(originalCode) || BOT_ROOMS.includes(upperCode)) {
       const roomRef = ref(db, `rooms/${upperCode}`);
       await set(roomRef, {
         id: upperCode,
         step: 3,
         players: [
           { id: userId, name: playerName, teamIdx: 0 },
           { id: 'bot1', name: 'בוט אלפא', teamIdx: 1 },
           { id: 'bot2', name: 'בוט בטא', teamIdx: 1 }
         ],
         teamNames: ['הקבוצה שלי', 'הבוטים'],
         timeBanks: { 'הקבוצה שלי': 15, 'הבוטים': 15 },
         powerUps: { 'הקבוצה שלי': [], 'הבוטים': [] },
         gameMode: 'group',
         seed: 42,
         currentQuestionIdx: 0,
         askedQuestions: []
       });
       return true;
    }

    // הצטרפות לחדר חברים רגיל
    const roomRef = ref(db, `rooms/${upperCode}`);
    const snapshot = await get(roomRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const players = data.players || [];
      
      // אם השחקן לא קיים בחדר, נוסיף אותו
      if (!players.find((p: any) => p.id === userId)) {
        players.push({ id: userId, name: playerName, teamIdx: players.length % 2 });
        await set(ref(db, `rooms/${upperCode}/players`), players);
      }
      return true;
    }
    
    alert('החדר לא נמצא. אנא בדוק את הקוד ונסה שוב.');
    return false;
  };

  return { mounted, userId, setUserName, handleCreateRoom, handleJoinRoom };
}