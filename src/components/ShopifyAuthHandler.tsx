import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useIsIFrame } from '@/hooks/useIsIFrame';

interface ShopifyAuthHandlerProps {
  children: React.ReactNode;
}

export function ShopifyAuthHandler({ children }: ShopifyAuthHandlerProps) {
  const router = useRouter();
  const isIFrame = useIsIFrame();
  const [authHandled, setAuthHandled] = useState(false);

  useEffect(() => {
    // Handle Shopify authentication redirects in iframe context
    if (isIFrame && !authHandled) {
      const handleShopifyAuth = () => {
        try {
          // Check if we need to handle authentication
          const urlParams = new URLSearchParams(window.location.search);
          const needsAuth = urlParams.has('shop') && !urlParams.has('authenticated');
          
          if (needsAuth) {
            console.log('Handling Shopify authentication in iframe context');
            
            // Create a message to parent window to handle auth
            const authMessage = {
              type: 'SHOPIFY_AUTH_REQUIRED',
              shop: urlParams.get('shop'),
              currentUrl: window.location.href
            };
            
            // Try to communicate with parent window
            if (window.parent && window.parent !== window) {
              // Determine the correct target origin dynamically
              let targetOrigin = '*'; // Fallback to wildcard
              
              try {
                // Try to get the parent's origin from the referrer or current location
                if (document.referrer) {
                  const referrerUrl = new URL(document.referrer);
                  targetOrigin = referrerUrl.origin;
                } else if (window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0) {
                  targetOrigin = window.location.ancestorOrigins[0];
                } else {
                  // Use current origin as fallback
                  targetOrigin = window.location.origin;
                }
              } catch (error) {
                console.log('Could not determine parent origin, using wildcard');
                targetOrigin = '*';
              }
              
              window.parent.postMessage(authMessage, targetOrigin);
            }
            
            // Also try to redirect the top window if possible
            try {
              if (window.top && window.top !== window) {
                window.top.location.href = window.location.href;
              }
            } catch (error) {
              console.log('Cannot redirect top window due to CORS restrictions');
            }
          }
          
          setAuthHandled(true);
        } catch (error) {
          console.error('Error handling Shopify auth:', error);
          setAuthHandled(true);
        }
      };

      // Handle auth after a short delay to ensure DOM is ready
      const timer = setTimeout(handleShopifyAuth, 100);
      return () => clearTimeout(timer);
    } else {
      setAuthHandled(true);
    }
  }, [isIFrame, authHandled]);

  // Listen for messages from parent window
  useEffect(() => {
    if (!isIFrame) return;

    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from Shopify domains
      const allowedOrigins = [
        'https://admin.shopify.com',
        'https://accounts.shopify.com'
      ];
      
      if (!allowedOrigins.some(origin => event.origin.startsWith(origin))) {
        return;
      }

      console.log('Received message from parent:', event.data);

      // Handle different message types
      switch (event.data.type) {
        case 'SHOPIFY_AUTH_COMPLETE':
          // Refresh the current page to pick up new auth state
          window.location.reload();
          break;
        case 'SHOPIFY_NAVIGATION':
          // Handle navigation requests from parent
          if (event.data.url) {
            router.push(event.data.url);
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isIFrame, router]);

  // Add iframe-specific styles
  useEffect(() => {
    if (isIFrame) {
      document.body.classList.add('shopify-iframe');
      
      // Prevent certain actions that don't work well in iframes
      const preventDefaultActions = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'A' && target.getAttribute('target') === '_blank') {
          e.preventDefault();
          // Try to open in parent window instead
          if (window.parent && window.parent !== window) {
            // Determine the correct target origin dynamically
            let targetOrigin = '*'; // Fallback to wildcard
            
            try {
              // Try to get the parent's origin from the referrer or current location
              if (document.referrer) {
                const referrerUrl = new URL(document.referrer);
                targetOrigin = referrerUrl.origin;
              } else if (window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0) {
                targetOrigin = window.location.ancestorOrigins[0];
              } else {
                // Use current origin as fallback
                targetOrigin = window.location.origin;
              }
            } catch (error) {
              console.log('Could not determine parent origin, using wildcard');
              targetOrigin = '*';
            }
            
            window.parent.postMessage({
              type: 'OPEN_EXTERNAL_LINK',
              url: (target as HTMLAnchorElement).href
            }, targetOrigin);
          }
        }
      };

      document.addEventListener('click', preventDefaultActions);
      return () => {
        document.body.classList.remove('shopify-iframe');
        document.removeEventListener('click', preventDefaultActions);
      };
    }
  }, [isIFrame]);

  return (
    <div className={`shopify-auth-handler ${isIFrame ? 'iframe-mode' : 'standalone-mode'}`}>
      {children}
    </div>
  );
}