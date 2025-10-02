import { Link } from 'react-router-dom';
import { PlayIcon, AcademicCapIcon } from '@heroicons/react/24/solid';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-6xl font-bold text-primary-600 mb-2">
            CrowdPlay
          </h1>
          <p className="text-xl text-gray-600">
            Live Quiz Games for Everyone
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/join"
            className="w-full flex items-center justify-center gap-3 btn-primary text-lg py-4"
          >
            <PlayIcon className="w-6 h-6" />
            Join Game
          </Link>

          <Link
            to="/host/login"
            className="w-full flex items-center justify-center gap-3 btn-outline text-lg py-4"
          >
            <AcademicCapIcon className="w-6 h-6" />
            Host Login
          </Link>
        </div>

        <div className="pt-8 text-sm text-gray-500">
          <p>Enter a game code to join</p>
          <p>or sign in as a host to create games</p>
        </div>
      </div>
    </div>
  );
}
