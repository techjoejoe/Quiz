import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { Question, QuestionType } from '../types';
import QuestionEditor from '../components/host/QuestionEditor';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function CreateRoom() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(50);
  const [questions, setQuestions] = useState<Omit<Question, 'questionId' | 'revealed'>[]>([
    {
      index: 0,
      type: 'MC',
      text: '',
      options: [
        { id: '1', text: '', imageUrl: '' },
        { id: '2', text: '', imageUrl: '' },
        { id: '3', text: '', imageUrl: '' },
        { id: '4', text: '', imageUrl: '' }
      ],
      correctOptionId: '1',
      timeLimitSec: 20,
      pointsBase: 100,
      pointsSpeedFactor: 0.5
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addQuestion = () => {
    const newQuestion: Omit<Question, 'questionId' | 'revealed'> = {
      index: questions.length,
      type: 'MC',
      text: '',
      options: [
        { id: '1', text: '', imageUrl: '' },
        { id: '2', text: '', imageUrl: '' },
        { id: '3', text: '', imageUrl: '' },
        { id: '4', text: '', imageUrl: '' }
      ],
      correctOptionId: '1',
      timeLimitSec: 20,
      pointsBase: 100,
      pointsSpeedFactor: 0.5
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updatedQuestion: Omit<Question, 'questionId' | 'revealed'>) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) {
      setError('You must have at least one question');
      return;
    }
    
    const newQuestions = questions.filter((_, i) => i !== index);
    // Re-index questions
    newQuestions.forEach((q, i) => {
      q.index = i;
    });
    setQuestions(newQuestions);
  };

  const validateQuestions = () => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        return `Question ${i + 1} is missing text`;
      }
      
      if ((q.type === 'MC' || q.type === 'IMG') && q.options) {
        const validOptions = q.options.filter(o => o.text.trim() || o.imageUrl);
        if (validOptions.length < 2) {
          return `Question ${i + 1} needs at least 2 options`;
        }
        if (!q.correctOptionId) {
          return `Question ${i + 1} needs a correct answer`;
        }
      }
      
      if (q.type === 'NUM' && !q.numRule?.exactValue) {
        return `Question ${i + 1} needs a correct numeric value`;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Please enter a game title');
      return;
    }
    
    const validationError = validateQuestions();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const createRoom = httpsCallable(functions, 'create');
      const result = await createRoom({
        title,
        mode: 'LIVE',
        maxPlayers,
        questions,
        settings: {
          lockOnStart: false,
          showLeaderboard: true,
          captureEmail: false,
          shuffleOptions: true
        }
      });
      
      const data = result.data as any;
      navigate(`/host/room/${data.roomId}`);
    } catch (err: any) {
      console.error('Error creating room:', err);
      setError(err.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">
        Create New Game
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Game Settings</h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Game Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Quiz Game"
                className="input-field"
                required
              />
            </div>
            
            <div>
              <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-700 mb-2">
                Max Players
              </label>
              <input
                id="maxPlayers"
                type="number"
                min="1"
                max="200"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                className="input-field"
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Questions ({questions.length})</h3>
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center gap-2 btn-secondary text-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Add Question
            </button>
          </div>

          {questions.map((question, index) => (
            <div key={index} className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h4 className="font-medium">Question {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeQuestion(index)}
                  className="text-red-600 hover:text-red-700"
                  disabled={questions.length === 1}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <QuestionEditor
                  question={question}
                  onChange={(updated) => updateQuestion(index, updated)}
                />
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 btn-primary"
          >
            {loading ? 'Creating...' : 'Create Game'}
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/host')}
            className="btn-outline"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
