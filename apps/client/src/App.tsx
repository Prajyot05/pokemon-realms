import { useEffect, useRef, useState } from 'react';
import { initGame, destroyGame } from './game/PhaserGame';
import { HUD } from './ui/HUD';
import { DialogBox } from './ui/DialogBox';
import { AuthScreen } from './ui/AuthScreen';

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
  }, []);

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

  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <>
      {/* Phaser renders into #game-container */}
      <div id="game-container" />
      {/* React UI floats on top */}
      <div id="ui-overlay">
        <HUD />
        <DialogBox />
      </div>
    </>
  );
}
