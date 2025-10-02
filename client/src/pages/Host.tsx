import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  HomeIcon, 
  PlusCircleIcon, 
  ArrowLeftOnRectangleIcon 
} from '@heroicons/react/24/outline';

export default function Host() {
  const navigate = useNavigate();
  const { userData, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/host" className="flex items-center">
                <h1 className="text-2xl font-bold text-primary-600">
                  CrowdPlay
                </h1>
              </Link>
              
              <div className="flex space-x-4">
                <Link
                  to="/host"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 rounded-lg hover:bg-gray-50"
                >
                  <HomeIcon className="w-4 h-4" />
                  Dashboard
                </Link>
                
                <Link
                  to="/host/create"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 rounded-lg hover:bg-gray-50"
                >
                  <PlusCircleIcon className="w-4 h-4" />
                  Create Game
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {userData?.displayName || userData?.email}
              </span>
              
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 rounded-lg hover:bg-gray-50"
              >
                <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
