import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRightIcon } from '@heroicons/react/24/solid';

export default function Join() {
  const navigate = useNavigate();
  const { code: urlCode } = useParams();
  const { signInAsPlayer } = useAuth();
  const [code, setCode] = useState(urlCode || '');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmailField, setShowEmailField] = useState(false);

  useEffect(() => {
    if (urlCode) {
      setCode(urlCode.toUpperCase());
    }
  }, [urlCode]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || !displayName) {
      setError('Please enter a game code and your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const joinRoom = httpsCallable(functions, 'join');
      const result = await joinRoom({ 
        code: code.toUpperCase(), 
        displayName,
        ...(showEmailField && email ? { email } : {})
      });
      
      const data = result.data as any;
      
      if (data.success) {
        // Sign in with the custom token
        await signInAsPlayer(data.token);
        
        // Store room info in sessionStorage
        sessionStorage.setItem('roomId', data.roomId);
        sessionStorage.setItem('playerId', data.playerId);
        sessionStorage.setItem('roomTitle', data.roomTitle);
        
        // Navigate to play screen
        navigate(`/play/${data.roomId}`);
      }
    } catch (err: any) {
      console.error('Error joining room:', err);
      setError(err.message || 'Failed to join room. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900">
            Join a Game
          </h2>
          <p className="mt-2 text-gray-600">
            Enter the game code to start playing
          </p>
        </div>

        <form onSubmit={handleJoin} className="mt-8 space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Game Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD12"
              maxLength={6}
              className="input-field text-center text-2xl font-bold tracking-wider uppercase"
              disabled={loading}
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="input-field"
              disabled={loading}
              autoComplete="name"
            />
          </div>

          {showEmailField && (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email (Optional)
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input-field"
                disabled={loading}
                autoComplete="email"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !code || !displayName}
            className="w-full flex items-center justify-center gap-2 btn-primary"
          >
            {loading ? (
              <>
                <div className="spinner w-5 h-5 border-2"></div>
                Joining...
              </>
            ) : (
              <>
                Join Game
                <ArrowRightIcon className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setShowEmailField(!showEmailField)}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            {showEmailField ? 'Hide' : 'Add'} email field
          </button>
        </div>
      </div>
    </div>
  );
}
