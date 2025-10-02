import { Question, Player, Room } from '../../types';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

interface ResultsProps {
  question: Question | null;
  player: Player;
  room: Room;
}

export default function Results({ question, player, room }: ResultsProps) {
  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500">
        <div className="text-white text-center">
          <p className="text-xl">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">Results</h2>
          <p className="text-white/90">Question {question.index + 1} of {room.totalQuestions}</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">{question.text}</h3>
          
          {question.type !== 'NUM' && question.options && (
            <div className="space-y-3">
              {question.options.map((option) => {
                const isCorrect = option.id === question.correctOptionId;
                return (
                  <div
                    key={option.id}
                    className={`p-4 rounded-lg border-2 flex items-center justify-between ${
                      isCorrect 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <span className={isCorrect ? 'font-semibold' : ''}>
                      {option.text}
                    </span>
                    {isCorrect && (
                      <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {question.type === 'TF' && (
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border-2 text-center ${
                question.correctOptionId === 'true'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}>
                <span className={question.correctOptionId === 'true' ? 'font-semibold' : ''}>
                  TRUE
                </span>
                {question.correctOptionId === 'true' && (
                  <CheckCircleIcon className="w-6 h-6 text-green-600 mx-auto mt-2" />
                )}
              </div>
              <div className={`p-4 rounded-lg border-2 text-center ${
                question.correctOptionId === 'false'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}>
                <span className={question.correctOptionId === 'false' ? 'font-semibold' : ''}>
                  FALSE
                </span>
                {question.correctOptionId === 'false' && (
                  <CheckCircleIcon className="w-6 h-6 text-green-600 mx-auto mt-2" />
                )}
              </div>
            </div>
          )}
          
          {question.type === 'NUM' && question.numRule && (
            <div className="text-center p-6 bg-green-50 border-2 border-green-500 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Correct Answer:</p>
              <p className="text-3xl font-bold text-green-700">
                {question.numRule.exactValue}
              </p>
              {question.numRule.tolerance > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  (±{question.numRule.tolerance})
                </p>
              )}
            </div>
          )}
        </div>

        <div className="text-center text-white">
          <p className="text-sm opacity-90 mb-1">Your Score</p>
          <p className="text-4xl font-bold mb-2">{player.score}</p>
          {player.streak > 1 && (
            <p className="text-sm opacity-90">
              🔥 {player.streak} answer streak!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
