import React, { useState } from 'react';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import TeamView from './components/TeamView';
import Board from './components/Board';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('documents'); // 'documents' or 'board'

  const handleLogin = (userType) => {
    setUser(userType);
    setCurrentView('documents'); // Reset to documents view on login
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('documents');
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!user && <Login onLogin={handleLogin} />}
      
      {user === 'admin' && currentView === 'documents' && (
        <AdminPanel 
          onLogout={handleLogout} 
          onNavigateToBoard={() => handleViewChange('board')}
        />
      )}
      
      {user === 'admin' && currentView === 'board' && (
        <Board 
          isAdmin={true} 
          onBack={() => handleViewChange('documents')}
        />
      )}
      
      {user === 'team' && currentView === 'documents' && (
        <TeamView 
          onLogout={handleLogout} 
          onNavigateToBoard={() => handleViewChange('board')}
        />
      )}
      
      {user === 'team' && currentView === 'board' && (
        <Board 
          isAdmin={false} 
          onBack={() => handleViewChange('documents')}
        />
      )}
    </div>
  );
}

export default App;