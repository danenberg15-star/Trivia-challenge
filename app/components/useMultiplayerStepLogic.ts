import { useState, useEffect, useRef, useMemo } from "react";
import questionsData from "../../src/lib/questions.json";

interface QuestionType {
  level: number;
  text: string;
  options: string[];
  correctIdx: number;
}

const ALL_QUESTIONS = questionsData as QuestionType[];

export function useMultiplayerStepLogic({ roomData, userId, updateRoom, handleAnswer }: any) {
  const me = roomData.players.find((p: any) => p.id === userId);
  const myTeamName = roomData.teamNames[me.teamIdx];
  const myTeamPlayers = roomData.players.filter((p: any) => p.teamIdx === me.teamIdx);
  
  const [timeLeft, setTimeLeft] = useState<number>(roomData.timeBanks[myTeamName] || 15);
  const [hasFailed, setHasFailed] = useState(false);
  const [isReadingDelay, setIsReadingDelay] = useState(true);
  const [isLocked, setIsLocked] = useState(false); 

  const currentEffect = roomData.teamEffects?.[myTeamName] || {};
  const isEffectActive = currentEffect.qIdx === roomData.currentQuestionIdx;
  const isFrozen = isEffectActive && currentEffect.type === 'freeze' && Date.now() < currentEffect.expiresAt;
  const isSlowMo = isEffectActive && currentEffect.type === 'slow-mo';
  const hiddenOptions = (isEffectActive && currentEffect.type === '50:50') ? currentEffect.hidden : [];

  const [freezeCountdown, setFreezeCountdown] = useState(0);
  
  const botHandledRef = useRef<number>(-1);
  const latestRoomRef = useRef(roomData);
  const actionsRef = useRef({ handleAnswer, updateRoom });
  
  useEffect(() => {
    latestRoomRef.current = roomData;
    actionsRef.current = { handleAnswer, updateRoom };
  }, [roomData, handleAnswer, updateRoom]);

  useEffect(() => {
    setTimeLeft(roomData.timeBanks[myTeamName] || 15);
    setHasFailed(false);
    setIsReadingDelay(true); 
    setIsLocked(false);
  }, [roomData.currentQuestionIdx, myTeamName]); 

  useEffect(() => {
    if (!isReadingDelay) return;
    const delayTimer = setTimeout(() => setIsReadingDelay(false), 2000);
    return () => clearTimeout(delayTimer);
  }, [isReadingDelay, roomData.currentQuestionIdx]);

  useEffect(() => {
    if (timeLeft <= 0 || isFrozen || hasFailed || isReadingDelay || isLocked) return;
    const delay = isSlowMo ? 2000 : 1000;
    const t = setInterval(() => setTimeLeft((prev: number) => prev - 1), delay);
    return () => clearInterval(t);
  }, [timeLeft, isFrozen, isSlowMo, hasFailed, isReadingDelay, isLocked]);

  const question = useMemo(() => {
    const qIdx = roomData.currentQuestionIdx || 0;
    let pool: QuestionType[] = [];

    if (qIdx < 2) {
      pool = ALL_QUESTIONS.filter(q => q.level === 1);
    } else if (qIdx < 4) {
      pool = ALL_QUESTIONS.filter(q => q.level === 2);
    } else if (qIdx < 7) {
      pool = ALL_QUESTIONS.filter(q => q.level === 3);
    } else {
      pool = ALL_QUESTIONS.filter(q => q.level === 4);
    }

    const askedTexts = roomData.askedQuestions || [];
    let filteredPool = pool.filter(q => !askedTexts.includes(q.text));
    if (filteredPool.length === 0) filteredPool = pool;

    const seed = roomData.seed || 37;
    const finalIdx = (seed + qIdx) % filteredPool.length;
    return filteredPool[finalIdx];
  }, [roomData.currentQuestionIdx, roomData.askedQuestions, roomData.seed]);

  const latestQuestionRef = useRef(question);
  useEffect(() => {
    latestQuestionRef.current = question;
  }, [question]);

  useEffect(() => {
    let interval: any;
    if (isFrozen && currentEffect.expiresAt) {
      const calculateRemain = () => Math.max(0, Math.ceil((currentEffect.expiresAt - Date.now()) / 1000));
      setFreezeCountdown(calculateRemain());
      interval = setInterval(() => setFreezeCountdown(calculateRemain()), 500); 
    }
    return () => clearInterval(interval);
  }, [isFrozen, currentEffect.expiresAt]);

  /**
   * לוגיקת הבוטים
   */
  useEffect(() => {
    const currentQ = roomData.currentQuestionIdx || 0;
    const roomName = (roomData.id || "").toString().trim();
    const isQA = ["עומר", "qa_omer_room", "עומר Q", "עומר q"].includes(roomName);

    if (!isQA || isReadingDelay || botHandledRef.current === currentQ) return;

    const executeBots = () => {
      if (botHandledRef.current === currentQ) return;
      botHandledRef.current = currentQ;
      
      const latestRoom = latestRoomRef.current;
      const latestQ = latestQuestionRef.current;
      const { updateRoom: ur } = actionsRef.current;
      
      if (latestRoom.step !== 5) return;
      
      const allTeamIndices = latestRoom.teamNames.map((_: any, i: number) => i);
      const myTeamIdx = latestRoom.players.find((p: any) => p.id === userId)?.teamIdx;
      
      const botOnlyTeamIndices = allTeamIndices.filter((idx: number) => idx !== myTeamIdx);

      if (botOnlyTeamIndices.length === 0) return;

      let botUpdates: any = {};

      botOnlyTeamIndices.forEach((tIdx: number) => {
        const teamName = latestRoom.teamNames[tIdx];
        
        const myInitialTime = latestRoom.timeBanks?.[myTeamName] || 15;
        const elapsedTime = Math.max(0, myInitialTime - timeLeft);
        const currentBankTime = latestRoom.timeBanks?.[teamName] || 15;
        const botTimeAtAnswer = Math.max(0, currentBankTime - elapsedTime);
        
        if (botTimeAtAnswer <= 0) {
          botUpdates[`timeBanks/${teamName}`] = 0;
          botUpdates[`roundResults/${teamName}`] = {
            isCorrect: false,
            finalTime: 0,
            answered: true
          };
        } else {
          const teamBots = latestRoom.players.filter((p: any) => p.teamIdx === tIdx);
          const shouldBeCorrect = ((currentQ + tIdx) % 2 === 0);
          const botChoice = shouldBeCorrect ? latestQ.correctIdx : (latestQ.correctIdx + 1) % 4;
          
          teamBots.forEach((p: any) => { 
            botUpdates[`votes/${p.id}`] = botChoice; 
          });
          
          const newTime = Math.max(0, botTimeAtAnswer + (shouldBeCorrect ? 10 : -7));
          
          botUpdates[`timeBanks/${teamName}`] = newTime;
          botUpdates[`roundResults/${teamName}`] = {
            isCorrect: shouldBeCorrect,
            finalTime: newTime,
            answered: true
          };
        }
      });
      
      botUpdates[`lastQuestion`] = latestQ;
      ur(botUpdates);
    };

    if (isLocked) {
      executeBots();
    } else {
      const timer = setTimeout(executeBots, 5000); 
      return () => clearTimeout(timer);
    }
  }, [isReadingDelay, roomData.currentQuestionIdx, roomData.id, isLocked, timeLeft, myTeamName, userId]); 

  // ============== מנגנון חילוץ חסין ==============
  useEffect(() => {
    if ((isLocked || timeLeft <= 0) && !isReadingDelay) {
      const rescueTimer = setTimeout(() => {
        const latestRoom = latestRoomRef.current;
        if (!latestRoom || latestRoom.step !== 5) return;

        const myTeamIdx = latestRoom.players.find((p: any) => p.id === userId)?.teamIdx;
        if (myTeamIdx === undefined) return;
        const localTeamName = latestRoom.teamNames[myTeamIdx];

        const results = latestRoom.roundResults || {};
        let emergencyUpdates: any = {};
        let neededRescue = false;

        if (localTeamName && (!results[localTeamName] || results[localTeamName].answered !== true)) {
          neededRescue = true;
          emergencyUpdates[`timeBanks/${localTeamName}`] = 0;
          emergencyUpdates[`roundResults/${localTeamName}`] = {
            isCorrect: false,
            finalTime: 0,
            answered: true
          };
        }

        if (neededRescue) {
          actionsRef.current.updateRoom(emergencyUpdates);
        }
      }, 4000); 

      return () => clearTimeout(rescueTimer);
    }
  }, [isLocked, timeLeft, isReadingDelay, userId]);

  const votes = roomData.votes || {};
  const myTeamVotes = myTeamPlayers.map((p: any) => votes[p.id]);
  const allVoted = myTeamVotes.every((v: any) => v !== undefined);
  const firstVote = myTeamVotes[0];
  const allAgreed = allVoted && myTeamVotes.every((v: any) => v === firstVote);

  useEffect(() => {
    if (allAgreed && !isLocked && !isReadingDelay) {
      setIsLocked(true);
      handleAnswer(firstVote === question.correctIdx, timeLeft, question);
    }
  }, [allAgreed, isLocked, isReadingDelay, firstVote, question, timeLeft, handleAnswer]);

  useEffect(() => {
    if (timeLeft <= 0 && !hasFailed && !isLocked) {
      setHasFailed(true);
      handleAnswer(false, 0, question); 
    }
  }, [timeLeft, hasFailed, isLocked, handleAnswer, question]);

  const handlePowerUpClick = (pu: string) => {
    if (isLocked) return;
    const safePowerUpsObj = roomData.powerUps || {};
    let myPowerUps = [...(safePowerUpsObj[myTeamName] || [])];
    const idx = myPowerUps.indexOf(pu);
    if (idx > -1) {
      myPowerUps.splice(idx, 1);
      let effectData: any = { type: pu, qIdx: roomData.currentQuestionIdx };
      if (pu === '50:50') {
        const incorrects = [0, 1, 2, 3].filter(i => i !== question.correctIdx);
        incorrects.sort(() => Math.random() - 0.5);
        effectData.hidden = [incorrects[0], incorrects[1]];
      } else if (pu === 'freeze') {
        effectData.expiresAt = Date.now() + 10000;
      }
      
      updateRoom({ 
        [`powerUps/${myTeamName}`]: myPowerUps,
        [`teamEffects/${myTeamName}`]: effectData
      });
    }
  };

  const handleVote = (optIdx: number) => {
    if (isFrozen || hasFailed || isLocked) return; 
    
    let voteUpdates: any = {};
    voteUpdates[`votes/${userId}`] = optIdx;
    
    const roomName = (roomData.id || "").toString().trim();
    const isQA = ["עומר", "qa_omer_room", "עומר Q", "עומר q"].includes(roomName);
    
    if (isQA) {
      myTeamPlayers.forEach((p: any) => { 
        if (p.isBot) voteUpdates[`votes/${p.id}`] = optIdx; 
      });
    }
    
    updateRoom(voteUpdates);
  };

  return {
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
  };
}