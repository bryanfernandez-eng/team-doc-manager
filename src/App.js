import React, { useState } from 'react';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import TeamView from './components/TeamView';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userType) => {
    setUser(userType);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!user && <Login onLogin={handleLogin} />}
      {user === 'admin' && <AdminPanel onLogout={handleLogout} />}
      {user === 'team' && <TeamView onLogout={handleLogout} />}
    </div>
  );
}

export default App;