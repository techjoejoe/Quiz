import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Room } from '../types';
import { 
  PlusCircleIcon, 
  PlayIcon,
  UsersIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

export default function HostDashboard() {
  const { currentUser } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'rooms'),
      where('hostId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        roomId: doc.id
      } as Room));
      setRooms(roomsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WAITING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'ENDED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          Your Games
        </h2>
        
        <Link
          to="/host/create"
          className="flex items-center gap-2 btn-primary"
        >
          <PlusCircleIcon className="w-5 h-5" />
          Create New Game
        </Link>
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No games yet
          </h3>
          <p className="text-gray-500 mb-4">
            Create your first game to get started
          </p>
          <Link
            to="/host/create"
            className="inline-flex items-center gap-2 btn-primary"
          >
            <PlusCircleIcon className="w-5 h-5" />
            Create Game
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <div
              key={room.roomId}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {room.title}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(room.status)}`}>
                    {room.status}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Code:</span>
                    <span className="font-mono text-lg font-bold text-primary-600">
                      {room.code}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4" />
                    <span>Max {room.maxPlayers} players</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
                    <span>{formatDate(room.createdAt)}</span>
                  </div>
                </div>
                
                <Link
                  to={`/host/room/${room.roomId}`}
                  className="w-full flex items-center justify-center gap-2 btn-primary text-sm"
                >
                  <PlayIcon className="w-4 h-4" />
                  {room.status === 'WAITING' ? 'Start Game' : 'View Game'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
