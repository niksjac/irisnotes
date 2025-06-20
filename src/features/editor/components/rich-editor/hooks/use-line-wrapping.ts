import { useState, useEffect } from 'react';

export function useLineWrapping() {
  const [lineWrapping, setLineWrapping] = useState(false);

  useEffect(() => {
    const altZHandler = (event: KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        setLineWrapping(w => !w);
      }
    };

    window.addEventListener('keydown', altZHandler);
    return () => window.removeEventListener('keydown', altZHandler);
  }, []);

  return { lineWrapping, setLineWrapping };
}