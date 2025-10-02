import { Player, Room } from '../../types';
import { TrophyIcon, FireIcon } from '@heroicons/react/24/solid';

interface LeaderboardProps {
  players: Player[];
  currentPlayerId: string;
  room: Room;
}

export default function Leaderboard({ players, currentPlayerId, room }: LeaderboardProps) {
  const currentPlayerRank = players.findIndex(p => p.playerId === currentPlayerId) + 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <TrophyIcon className="w-16 h-16 text-yellow-300 mx-auto mb-2" />
          <h2 className="text-3xl font-bold text-white">Leaderboard</h2>
          <p className="text-white/90 mt-2">
            After {room.currentQuestionIndex + 1} of {room.totalQuestions} questions
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
          <div className="space-y-3">
            {players.slice(0, 10).map((player, index) => {
              const rank = index + 1;
              const isCurrentPlayer = player.playerId === currentPlayerId;
              
              return (
                <div
                  key={player.playerId}
                  className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                    isCurrentPlayer 
                      ? 'bg-primary-100 border-2 border-primary-500' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`text-2xl font-bold ${
                      rank === 1 ? 'text-yellow-500' :
                      rank === 2 ? 'text-gray-400' :
                      rank === 3 ? 'text-orange-600' :
                      'text-gray-600'
                    }`}>
                      #{rank}
                    </div>
                    <div>
                      <p className={`font-semibold ${isCurrentPlayer ? 'text-primary-900' : ''}`}>
                        {player.displayName}
                        {isCurrentPlayer && ' (You)'}
                      </p>
                      {player.streak > 2 && (
                        <div className="flex items-center gap-1 mt-1">
                          <FireIcon className="w-4 h-4 text-orange-500" />
                          <span className="text-xs text-orange-600">
                            {player.streak} streak
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${
                      isCurrentPlayer ? 'text-primary-700' : 'text-gray-900'
                    }`}>
                      {player.score}
                    </p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                </div>
              );
            })}
          </div>
          
          {currentPlayerRank > 10 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between p-4 bg-primary-100 rounded-lg border-2 border-primary-500">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-gray-600">
                    #{currentPlayerRank}
                  </div>
                  <p className="font-semibold text-primary-900">
                    You
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-700">
                    {players.find(p => p.playerId === currentPlayerId)?.score || 0}
                  </p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-white">
          <p className="text-lg">Get ready for the next question!</p>
        </div>
      </div>
    </div>
  );
}
