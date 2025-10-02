import { useState, useEffect } from 'react';
import { Question, Room, Player } from '../../types';
import { Timestamp } from 'firebase/firestore';
import { ClockIcon } from '@heroicons/react/24/solid';

interface QuestionViewProps {
  question: Question;
  room: Room;
  player: Player;
  deadline?: Timestamp;
  onSubmit: (answer: any) => Promise<any>;
}

export default function QuestionView({ 
  question, 
  room, 
  player, 
  deadline, 
  onSubmit 
}: QuestionViewProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | boolean | null>(null);
  const [numericAnswer, setNumericAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(question.timeLimitSec);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!deadline) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const deadlineTime = deadline.toDate().getTime();
      const remaining = Math.max(0, Math.floor((deadlineTime - now) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [deadline]);

  const handleSubmit = async () => {
    if (submitted || submitting) return;

    let answer: any = {};
    
    switch (question.type) {
      case 'MC':
      case 'IMG':
      case 'POLL':
        if (!selectedAnswer) return;
        answer.optionId = selectedAnswer;
        break;
      case 'TF':
        if (selectedAnswer === null) return;
        answer.booleanValue = selectedAnswer === 'true';
        break;
      case 'NUM':
        if (!numericAnswer) return;
        answer.numericValue = parseFloat(numericAnswer);
        break;
    }

    setSubmitting(true);
    
    try {
      const res = await onSubmit(answer);
      setResult(res);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getOptionStyle = (optionId: string) => {
    if (!submitted) {
      return selectedAnswer === optionId 
        ? 'quiz-option quiz-option-selected' 
        : 'quiz-option';
    }
    
    if (result?.isCorrect && selectedAnswer === optionId) {
      return 'quiz-option quiz-option-correct';
    }
    
    if (!result?.isCorrect && selectedAnswer === optionId) {
      return 'quiz-option quiz-option-incorrect';
    }
    
    return 'quiz-option opacity-50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Timer */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-6 py-3 text-white ${
            timeLeft <= 5 ? 'animate-pulse' : ''
          }`}>
            <ClockIcon className="w-6 h-6" />
            <span className="text-2xl font-bold">{timeLeft}s</span>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-medium text-gray-500">
              Question {question.index + 1} of {room.totalQuestions}
            </span>
            <span className="text-sm font-medium text-gray-500">
              {question.pointsBase} pts
            </span>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {question.text}
          </h2>

          {/* Answer Options */}
          {question.type === 'MC' || question.type === 'IMG' || question.type === 'POLL' ? (
            <div className="space-y-3">
              {question.options?.map((option) => (
                <button
                  key={option.id}
                  onClick={() => !submitted && setSelectedAnswer(option.id)}
                  disabled={submitted}
                  className={getOptionStyle(option.id)}
                >
                  <span className="text-lg">{option.text}</span>
                </button>
              ))}
            </div>
          ) : question.type === 'TF' ? (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => !submitted && setSelectedAnswer('true')}
                disabled={submitted}
                className={getOptionStyle('true')}
              >
                <span className="text-xl font-semibold">TRUE</span>
              </button>
              <button
                onClick={() => !submitted && setSelectedAnswer('false')}
                disabled={submitted}
                className={getOptionStyle('false')}
              >
                <span className="text-xl font-semibold">FALSE</span>
              </button>
            </div>
          ) : question.type === 'NUM' ? (
            <div>
              <input
                type="number"
                step="any"
                value={numericAnswer}
                onChange={(e) => !submitted && setNumericAnswer(e.target.value)}
                disabled={submitted}
                placeholder="Enter your answer"
                className="w-full text-center text-2xl font-bold input-field"
              />
            </div>
          ) : null}

          {/* Submit Button */}
          {!submitted && (
            <button
              onClick={handleSubmit}
              disabled={
                submitting || 
                timeLeft === 0 ||
                (question.type === 'MC' && !selectedAnswer) ||
                (question.type === 'TF' && selectedAnswer === null) ||
                (question.type === 'NUM' && !numericAnswer)
              }
              className="w-full mt-6 btn-primary text-lg"
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          )}

          {/* Result Feedback */}
          {submitted && result && (
            <div className={`mt-6 p-4 rounded-lg text-center ${
              result.isCorrect 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <p className="text-lg font-semibold mb-1">
                {result.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
              </p>
              {result.pointsEarned > 0 && (
                <p className="text-sm">
                  +{result.pointsEarned} points
                </p>
              )}
            </div>
          )}
        </div>

        {/* Player Score */}
        <div className="text-center text-white">
          <p className="text-sm opacity-90">Your Score</p>
          <p className="text-3xl font-bold">{result?.newScore || player.score}</p>
        </div>
      </div>
    </div>
  );
}
