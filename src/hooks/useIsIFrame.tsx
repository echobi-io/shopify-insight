import { useState, useEffect } from 'react';

export function useIsIFrame() {
  const [isIFrame, setIsIFrame] = useState(false);

  useEffect(() => {
    // Check if we're running inside an iframe
    const inIframe = window.self !== window.top;
    setIsIFrame(inIframe);
  }, []);

  return isIFrame;
}