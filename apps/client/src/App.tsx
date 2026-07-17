import { useEffect, useRef } from 'react';
import { initGame, destroyGame } from './game/PhaserGame';
import { HUD } from './ui/HUD';
import { DialogBox } from './ui/DialogBox';

export function App() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    initGame();

    return () => {
      destroyGame();
      initialized.current = false;
    };
  }, []);

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
