import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../lib/firebase';
import { Room, RoomState, Question, Player } from '../types';
import QRCode from 'qrcode';
import { 
  PlayIcon, 
  ForwardIcon, 
  EyeIcon,
  StopIcon,
  UsersIcon,
  ClipboardIcon
} from '@heroicons/react/24/solid';

export default function HostRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roomId) {
      navigate('/host');
      return;
    }

    // Subscribe to room updates
    const roomUnsubscribe = onSnapshot(
      doc(db, 'rooms', roomId),
      (snapshot) => {
        if (snapshot.exists()) {
          setRoom(snapshot.data() as Room);
        } else {
          navigate('/host');
        }
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

    // Subscribe to players
    const playersUnsubscribe = onSnapshot(
      query(
        collection(db, 'rooms', roomId, 'players'),
        orderBy('score', 'desc')
      ),
      (snapshot) => {
        const playersData = snapshot.docs.map(doc => ({
          ...doc.data(),
          playerId: doc.id
        } as Player));
        setPlayers(playersData);
      }
    );

    // Subscribe to questions
    const questionsUnsubscribe = onSnapshot(
      query(
        collection(db, 'rooms', roomId, 'questions'),
        orderBy('index')
      ),
      (snapshot) => {
        const questionsData = snapshot.docs.map(doc => ({
          ...doc.data(),
          questionId: doc.id
        } as Question));
        setQuestions(questionsData);
      }
    );

    return () => {
      roomUnsubscribe();
      stateUnsubscribe();
      playersUnsubscribe();
      questionsUnsubscribe();
    };
  }, [roomId, navigate]);

  useEffect(() => {
    if (room && room.currentQuestionIndex >= 0 && questions.length > 0) {
      setCurrentQuestion(questions[room.currentQuestionIndex] || null);
    } else {
      setCurrentQuestion(null);
    }
  }, [room, questions]);

  useEffect(() => {
    if (room) {
      const joinUrl = `${window.location.origin}/join/${room.code}`;
      QRCode.toDataURL(joinUrl, { width: 200 })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('Error generating QR code:', err));
    }
  }, [room]);

  const handleStartGame = async () => {
    if (!roomId) return;
    setLoading(true);
    setError('');

    try {
      const startGame = httpsCallable(functions, 'start');
      await startGame({ roomId });
    } catch (err: any) {
      setError(err.message || 'Failed to start game');
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!roomId) return;
    setLoading(true);
    setError('');

    try {
      const nextQuestion = httpsCallable(functions, 'next');
      await nextQuestion({ roomId });
    } catch (err: any) {
      setError(err.message || 'Failed to advance question');
    } finally {
      setLoading(false);
    }
  };

  const handleRevealResults = async () => {
    if (!roomId || room?.currentQuestionIndex === undefined) return;
    setLoading(true);
    setError('');

    try {
      const revealResults = httpsCallable(functions, 'reveal');
      await revealResults({ 
        roomId, 
        questionIndex: room.currentQuestionIndex 
      });
    } catch (err: any) {
      setError(err.message || 'Failed to reveal results');
    } finally {
      setLoading(false);
    }
  };

  const handleEndGame = async () => {
    if (!roomId) return;
    if (!confirm('Are you sure you want to end this game?')) return;
    
    setLoading(true);
    setError('');

    try {
      const endGame = httpsCallable(functions, 'end');
      await endGame({ roomId });
      navigate('/host');
    } catch (err: any) {
      setError(err.message || 'Failed to end game');
    } finally {
      setLoading(false);
    }
  };

  const copyJoinCode = () => {
    if (room) {
      navigator.clipboard.writeText(room.code);
    }
  };

  if (!room || !roomState) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Control Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">{room.title}</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-semibold">{room.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Question</p>
                <p className="text-lg font-semibold">
                  {room.currentQuestionIndex >= 0 
                    ? `${room.currentQuestionIndex + 1} / ${room.totalQuestions}`
                    : `0 / ${room.totalQuestions}`}
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {/* Game Controls */}
            <div className="flex flex-wrap gap-3">
              {room.status === 'WAITING' && (
                <button
                  onClick={handleStartGame}
                  disabled={loading || players.length === 0}
                  className="flex items-center gap-2 btn-primary"
                >
                  <PlayIcon className="w-5 h-5" />
                  Start Game
                </button>
              )}

              {room.status === 'ACTIVE' && roomState.currentPhase === 'QUESTION' && (
                <button
                  onClick={handleRevealResults}
                  disabled={loading}
                  className="flex items-center gap-2 btn-primary"
                >
                  <EyeIcon className="w-5 h-5" />
                  Reveal Results
                </button>
              )}

              {room.status === 'ACTIVE' && roomState.currentPhase === 'RESULTS' && (
                <button
                  onClick={handleNextQuestion}
                  disabled={loading || room.currentQuestionIndex >= room.totalQuestions - 1}
                  className="flex items-center gap-2 btn-primary"
                >
                  <ForwardIcon className="w-5 h-5" />
                  Next Question
                </button>
              )}

              <button
                onClick={handleEndGame}
                disabled={loading}
                className="flex items-center gap-2 btn-outline border-red-600 text-red-600 hover:bg-red-50"
              >
                <StopIcon className="w-5 h-5" />
                End Game
              </button>
            </div>
          </div>

          {/* Current Question */}
          {currentQuestion && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">
                Current Question ({currentQuestion.index + 1})
              </h3>
              <p className="text-xl mb-4">{currentQuestion.text}</p>
              
              {currentQuestion.options && (
                <div className="space-y-2">
                  {currentQuestion.options.map((option) => (
                    <div 
                      key={option.id}
                      className={`p-3 rounded-lg border-2 ${
                        currentQuestion.revealed && option.id === currentQuestion.correctOptionId
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200'
                      }`}
                    >
                      {option.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Players List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UsersIcon className="w-5 h-5" />
              Players ({players.length})
            </h3>
            
            <div className="space-y-2">
              {players.map((player, index) => (
                <div key={player.playerId} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-gray-500">
                      #{index + 1}
                    </span>
                    <span className="font-medium">{player.displayName}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      Streak: {player.streak}
                    </span>
                    <span className="font-semibold text-primary-600">
                      {player.score} pts
                    </span>
                  </div>
                </div>
              ))}
              
              {players.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  Waiting for players to join...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Join Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Join Info</h3>
            
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 mb-2">Game Code</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-3xl font-bold font-mono text-primary-600">
                  {room.code}
                </p>
                <button
                  onClick={copyJoinCode}
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Copy code"
                >
                  <ClipboardIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {qrCodeUrl && (
              <div className="text-center">
                <img src={qrCodeUrl} alt="QR Code" className="mx-auto" />
                <p className="text-sm text-gray-600 mt-2">
                  Scan to join
                </p>
              </div>
            )}

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Join URL:</p>
              <p className="text-xs font-mono break-all">
                {window.location.origin}/join/{room.code}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
