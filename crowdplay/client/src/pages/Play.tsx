import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy,
  limit 
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../lib/firebase';
import { Room, RoomState, Question, Player } from '../types';
import WaitingRoom from '../components/player/WaitingRoom';
import QuestionView from '../components/player/QuestionView';
import Results from '../components/player/Results';
import Leaderboard from '../components/player/Leaderboard';
import FinalResults from '../components/player/FinalResults';

export default function Play() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const playerId = sessionStorage.getItem('playerId');

  useEffect(() => {
    if (!roomId || !playerId) {
      navigate('/join');
      return;
    }

    // Subscribe to room updates
    const roomUnsubscribe = onSnapshot(
      doc(db, 'rooms', roomId),
      (snapshot) => {
        if (snapshot.exists()) {
          setRoom(snapshot.data() as Room);
        } else {
          setError('Room not found');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching room:', error);
        setError('Failed to connect to room');
        setLoading(false);
      }
    );

    // Subscribe to room state
    const stateUnsubscribe = onSnapshot(
      doc(db, 'rooms', roomId, 'state', 'ticks'),
      (snapshot) => {
        if (snapshot.exists()) {
          setRoomState(snapshot.data() as RoomState);
        }
      }
    );

    // Subscribe to player data
    const playerUnsubscribe = onSnapshot(
      doc(db, 'rooms', roomId, 'players', playerId),
      (snapshot) => {
        if (snapshot.exists()) {
          const playerData = snapshot.data() as Player;
          if (playerData.isKicked) {
            alert('You have been removed from the game');
            navigate('/');
            return;
          }
          setPlayer(playerData);
        }
      }
    );

    // Subscribe to all players for leaderboard
    const playersUnsubscribe = onSnapshot(
      query(
        collection(db, 'rooms', roomId, 'players'),
        where('isKicked', '==', false),
        orderBy('score', 'desc'),
        limit(10)
      ),
      (snapshot) => {
        const playersData = snapshot.docs.map(doc => ({
          ...doc.data(),
          playerId: doc.id
        } as Player));
        setPlayers(playersData);
      }
    );

    return () => {
      roomUnsubscribe();
      stateUnsubscribe();
      playerUnsubscribe();
      playersUnsubscribe();
    };
  }, [roomId, playerId, navigate]);

  // Subscribe to current question when room state changes
  useEffect(() => {
    if (!room || !roomId || room.currentQuestionIndex < 0) {
      setCurrentQuestion(null);
      return;
    }

    const questionUnsubscribe = onSnapshot(
      query(
        collection(db, 'rooms', roomId, 'questions'),
        where('index', '==', room.currentQuestionIndex),
        limit(1)
      ),
      (snapshot) => {
        if (!snapshot.empty) {
          setCurrentQuestion(snapshot.docs[0].data() as Question);
        }
      }
    );

    return () => questionUnsubscribe();
  }, [room, roomId]);

  const handleSubmitAnswer = async (answer: any) => {
    if (!roomId || !playerId || !room) return;

    try {
      const submitAnswer = httpsCallable(functions, 'answer');
      const result = await submitAnswer({
        roomId,
        playerId,
        questionIndex: room.currentQuestionIndex,
        answer
      });
      
      return result.data as any;
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/join')}
            className="btn-primary"
          >
            Back to Join
          </button>
        </div>
      </div>
    );
  }

  if (!room || !roomState || !player) {
    return null;
  }

  // Render based on game phase
  switch (roomState.currentPhase) {
    case 'LOBBY':
      return (
        <WaitingRoom 
          room={room} 
          player={player} 
          playerCount={players.length}
        />
      );
    
    case 'QUESTION':
      return currentQuestion ? (
        <QuestionView 
          question={currentQuestion}
          room={room}
          player={player}
          deadline={roomState.questionDeadline}
          onSubmit={handleSubmitAnswer}
        />
      ) : null;
    
    case 'RESULTS':
      return (
        <Results 
          question={currentQuestion}
          player={player}
          room={room}
        />
      );
    
    case 'LEADERBOARD':
      return (
        <Leaderboard 
          players={players}
          currentPlayerId={playerId}
          room={room}
        />
      );
    
    case 'FINAL':
      return (
        <FinalResults 
          players={players}
          currentPlayerId={playerId}
          room={room}
        />
      );
    
    default:
      return null;
  }
}
