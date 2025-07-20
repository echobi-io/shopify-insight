import { useState, useEffect } from 'react';

export function useIsIFrame() {
  const [isIFrame, setIsIFrame] = useState(false);

  useEffect(() => {
    try {
      // Check if we're running inside an iframe
      const inIframe = window.self !== window.top;
      setIsIFrame(inIframe);
      
      // Log iframe status for debugging
      console.log('App running in iframe:', inIframe);
      
      // If we're in an iframe, check if it's from Shopify
      if (inIframe) {
        try {
          const parentOrigin = document.referrer;
          const isShopifyFrame = parentOrigin.includes('myshopify.com') || parentOrigin.includes('shopify.com');
          console.log('Parent origin:', parentOrigin, 'Is Shopify frame:', isShopifyFrame);
        } catch (error) {
          console.log('Cannot access parent frame info due to CORS');
        }
      }
    } catch (error) {
      console.error('Error checking iframe status:', error);
      setIsIFrame(false);
    }
  }, []);

  return isIFrame;
}