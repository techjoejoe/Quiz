import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import Join from './pages/Join';
import Play from './pages/Play';
import Host from './pages/Host';
import HostDashboard from './pages/HostDashboard';
import CreateRoom from './pages/CreateRoom';
import HostRoom from './pages/HostRoom';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/join" element={<Join />} />
          <Route path="/join/:code" element={<Join />} />
          <Route path="/play/:roomId" element={<Play />} />
          <Route path="/host/login" element={<Login />} />
          
          <Route path="/host" element={<ProtectedRoute><Host /></ProtectedRoute>}>
            <Route index element={<HostDashboard />} />
            <Route path="create" element={<CreateRoom />} />
            <Route path="room/:roomId" element={<HostRoom />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
