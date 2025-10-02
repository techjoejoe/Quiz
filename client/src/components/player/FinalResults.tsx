import { Player, Room } from '../../types';
import { TrophyIcon, StarIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';

interface FinalResultsProps {
  players: Player[];
  currentPlayerId: string;
  room: Room;
}

export default function FinalResults({ players, currentPlayerId, room }: FinalResultsProps) {
  const currentPlayer = players.find(p => p.playerId === currentPlayerId);
  const currentPlayerRank = players.findIndex(p => p.playerId === currentPlayerId) + 1;
  
  const topThree = players.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Game Over!</h1>
          <p className="text-white/90">Thanks for playing {room.title}</p>
        </div>

        {/* Podium */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-center mb-6">Winners</h2>
          
          <div className="flex justify-center items-end gap-4 mb-8">
            {topThree[1] && (
              <div className="text-center flex-1">
                <div className="bg-gray-200 rounded-t-lg pt-4 pb-2 h-24 flex flex-col justify-end">
                  <p className="text-3xl">🥈</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-b-lg">
                  <p className="font-semibold text-sm truncate">
                    {topThree[1].displayName}
                  </p>
                  <p className="text-xl font-bold text-gray-700">
                    {topThree[1].score}
                  </p>
                </div>
              </div>
            )}
            
            {topThree[0] && (
              <div className="text-center flex-1">
                <div className="bg-yellow-300 rounded-t-lg pt-4 pb-2 h-32 flex flex-col justify-end">
                  <p className="text-4xl">🥇</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-b-lg">
                  <p className="font-semibold text-sm truncate">
                    {topThree[0].displayName}
                  </p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {topThree[0].score}
                  </p>
                </div>
              </div>
            )}
            
            {topThree[2] && (
              <div className="text-center flex-1">
                <div className="bg-orange-200 rounded-t-lg pt-4 pb-2 h-20 flex flex-col justify-end">
                  <p className="text-2xl">🥉</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-b-lg">
                  <p className="font-semibold text-sm truncate">
                    {topThree[2].displayName}
                  </p>
                  <p className="text-lg font-bold text-orange-700">
                    {topThree[2].score}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Your Result */}
          {currentPlayer && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 text-center">Your Performance</h3>
              <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Final Rank</p>
                    <p className="text-3xl font-bold text-primary-700">
                      #{currentPlayerRank}
                    </p>
                    <p className="text-xs text-gray-500">
                      out of {players.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Score</p>
                    <p className="text-3xl font-bold text-primary-700">
                      {currentPlayer.score}
                    </p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                </div>
                
                {currentPlayer.streak > 0 && (
                  <div className="mt-4 pt-4 border-t border-primary-200 text-center">
                    <p className="text-sm text-gray-600">Best Streak</p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <FireIcon className="w-5 h-5 text-orange-500" />
                      <span className="text-lg font-semibold text-orange-600">
                        {currentPlayer.streak} in a row
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <Link to="/" className="btn-primary bg-white text-primary-600 hover:bg-gray-100">
            Play Another Game
          </Link>
        </div>
      </div>
    </div>
  );
}
