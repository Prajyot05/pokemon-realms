import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../stores/useGameStore';

export function DialogBox() {
  const activeDialog = useGameStore((s) => s.activeDialog);
  const setDialog = useGameStore((s) => s.setDialog);
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!activeDialog) {
      setDisplayedText('');
      return;
    }

    setDisplayedText('');

    // Simple typewriter effect using deterministic string slicing
    const interval = setInterval(() => {
      setDisplayedText((prev) => {
        if (prev.length < activeDialog.text.length) {
          return activeDialog.text.slice(0, prev.length + 1);
        }
        clearInterval(interval);
        return prev;
      });
    }, 30); // 30ms per character

    return () => clearInterval(interval);
  }, [activeDialog]);

  // Handle Enter/Space to close dialog
  useEffect(() => {
    if (!activeDialog) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        setDisplayedText((prev) => {
          // If text is still typing, skip to end
          if (prev.length < activeDialog.text.length) {
            return activeDialog.text;
          } else {
            // Close dialog
            setDialog(null);
            return prev;
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDialog, setDialog]);

  if (!activeDialog) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        maxWidth: '90%',
        height: '120px',
        backgroundColor: '#f8f8f8',
        border: '4px solid #333',
        borderRadius: '8px',
        padding: '16px',
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#111',
        boxShadow: '0px 4px 10px rgba(0,0,0,0.5)',
        zIndex: 100,
      }}
    >
      <div style={{ position: 'relative', height: '100%' }}>
        <p style={{ margin: 0, lineHeight: '1.5' }}>{displayedText}</p>
        
        {/* Blinking indicator when text finishes typing */}
        {displayedText.length === activeDialog.text.length && (
          <div
            style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              width: '10px',
              height: '10px',
              backgroundColor: '#e74c3c',
              borderRadius: '50%',
              animation: 'blink 1s infinite',
            }}
          />
        )}
      </div>

      <style>
        {`
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        `}
      </style>
    </div>
  );
}
