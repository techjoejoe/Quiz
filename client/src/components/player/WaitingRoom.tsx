import { Room, Player } from '../../types';
import { UsersIcon } from '@heroicons/react/24/solid';

interface WaitingRoomProps {
  room: Room;
  player: Player;
  playerCount: number;
}

export default function WaitingRoom({ room, player, playerCount }: WaitingRoomProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-primary-500 to-secondary-500">
      <div className="max-w-md w-full text-center text-white">
        <h1 className="text-4xl font-bold mb-4">{room.title}</h1>
        
        <div className="bg-white/20 backdrop-blur rounded-xl p-6 mb-6">
          <p className="text-2xl font-semibold mb-2">
            Welcome, {player.displayName}!
          </p>
          <p className="text-lg opacity-90">
            You're in! Wait for the host to start.
          </p>
        </div>

        <div className="bg-white/20 backdrop-blur rounded-xl p-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <UsersIcon className="w-6 h-6" />
            <span className="text-2xl font-semibold">{playerCount}</span>
          </div>
          <p className="text-sm opacity-90">
            {playerCount === 1 ? 'player' : 'players'} in the room
          </p>
        </div>

        <div className="mt-8">
          <div className="inline-flex items-center gap-2">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <p className="text-sm opacity-90">Waiting for host...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
