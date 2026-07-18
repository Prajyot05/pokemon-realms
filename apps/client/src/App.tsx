import { useEffect, useRef, useState } from 'react';
import { initGame, destroyGame } from './game/PhaserGame';
import { HUD } from './ui/HUD';
import { DialogBox } from './ui/DialogBox';
import { AuthScreen } from './ui/AuthScreen';
import { BattleUI } from './ui/BattleUI';

import { ChatPanel } from './ui/ChatPanel';
import { TradeWindow, TradeRequestOverlay } from './ui/TradeWindow';

export function App() {
  const initialized = useRef(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    if (initialized.current) return;
    initialized.current = true;
    initGame();

    return () => {
      destroyGame();
      initialized.current = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    const storedUser = localStorage.getItem('username');
    if (token && storedUser) {
      setIsAuthenticated(true);
      setUsername(storedUser);
    }
  }, []);

  const handleLogin = (token: string, user: string) => {
    localStorage.setItem('jwt', token);
    localStorage.setItem('username', user);
    setUsername(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUsername('');
  };

  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <>
      {/* Phaser renders into #game-container */}
      <div id="game-container" />
      {/* React UI floats on top */}
      <div id="ui-overlay">
        <HUD onLogout={handleLogout} />
        <DialogBox />
        <BattleUI />
        <TradeWindow />
        <TradeRequestOverlay />
        <ChatPanel />
      </div>
    </>
  );
}
