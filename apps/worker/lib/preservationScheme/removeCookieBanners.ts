/**
 * Function to remove cookie banners, consent popups, and overlay elements
 * from web pages before taking screenshots or generating PDFs.
 * 
 * This function runs in the browser context via page.evaluate()
 */
export const removeCookieBannersAndOverlays = () => {
  // Common selectors for cookie banners, popups, and overlays
  const commonSelectors = [
    // Cookie banners
    '[id*="cookie" i]',
    '[class*="cookie" i]',
    '[id*="consent" i]',
    '[class*="consent" i]',
    '[data-testid*="cookie" i]',
    '[data-testid*="consent" i]',
    
    // GDPR banners
    '[id*="gdpr" i]',
    '[class*="gdpr" i]',
    '[id*="privacy" i]',
    '[class*="privacy" i]',
    
    // Modal overlays
    '.modal',
    '.overlay',
    '.popup',
    '.banner',
    '.notification',
    '.alert',
    '.toast',
    
    // Common CSS classes
    '[class*="modal" i]',
    '[class*="overlay" i]',
    '[class*="popup" i]',
    '[class*="banner" i]',
    '[class*="notification" i]',
    '[class*="dialog" i]',
    
    // Fixed position elements that might be overlays
    '*[style*="position: fixed"]',
    '*[style*="position:fixed"]',
    
    // High z-index elements (likely overlays)
    '*[style*="z-index: 999"]',
    '*[style*="z-index:999"]',
    '*[style*="z-index: 9999"]',
    '*[style*="z-index:9999"]',
    
    // Common newsletter popups
    '[id*="newsletter" i]',
    '[class*="newsletter" i]',
    '[id*="subscribe" i]',
    '[class*="subscribe" i]',
    
    // Age verification
    '[id*="age" i]',
    '[class*="age" i]',
    '[id*="verify" i]',
    '[class*="verify" i]',
    
    // Social media popups
    '[id*="social" i]',
    '[class*="social" i]',
    
    // App download prompts
    '[id*="app-banner" i]',
    '[class*="app-banner" i]',
    '[id*="download" i]',
    '[class*="download" i]',
    
    // Chat widgets
    '[id*="chat" i]',
    '[class*="chat" i]',
    '[id*="support" i]',
    '[class*="support" i]',
    
    // Specific known cookie banner libraries
    '#cookieChoiceInfo',
    '#cookie-banner',
    '#cookie-notice',
    '#cookieConsent',
    '#CybotCookiebotDialog',
    '.cc-banner',
    '.cc-window',
    '.optanon-alert-box-wrapper',
    '.ot-sdk-container',
    '#onetrust-banner-sdk',
    '.osano-cm-window',
    '.fc-consent-root',
    '.didomi-popup',
    '.cky-consent-container',
    '.qc-cmp2-container',
    '.sp_message_container_',
    '.message-container',
    '.sp_choice_type_11',
  ];

  // Remove elements based on selectors
  commonSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        // Check if element is likely a cookie banner/overlay
        const elementText = element.textContent?.toLowerCase() || '';
        const isLikelyCookieBanner = 
          elementText.includes('cookie') ||
          elementText.includes('consent') ||
          elementText.includes('privacy') ||
          elementText.includes('gdpr') ||
          elementText.includes('accept') ||
          elementText.includes('agree') ||
          elementText.includes('continue') ||
          elementText.includes('necessary') ||
          elementText.includes('tracking') ||
          elementText.includes('analytics');
        
        // Also check computed styles for overlay characteristics
        const computedStyle = window.getComputedStyle(element);
        const isOverlay = 
          computedStyle.position === 'fixed' ||
          computedStyle.position === 'absolute' ||
          parseInt(computedStyle.zIndex) > 100;
        
        // Remove if it's likely a cookie banner or overlay
        if (isLikelyCookieBanner || isOverlay) {
          element.remove();
        }
      });
    } catch (e) {
      // Ignore errors for invalid selectors
    }
  });

  // Remove elements by text content (more aggressive approach)
  const textBasedSelectors = [
    'div', 'section', 'aside', 'header', 'footer', 'nav'
  ];
  
  textBasedSelectors.forEach(tag => {
    const elements = document.querySelectorAll(tag);
    elements.forEach(element => {
      const text = element.textContent?.toLowerCase() || '';
      const isSmallElement = element.children.length < 10; // Avoid removing main content
      
      if (isSmallElement && (
        (text.includes('cookie') && text.includes('accept')) ||
        (text.includes('privacy') && text.includes('policy')) ||
        (text.includes('consent') && text.includes('continue')) ||
        (text.includes('gdpr') && text.includes('accept')) ||
        text.includes('we use cookies') ||
        text.includes('this website uses cookies') ||
        text.includes('accept all cookies') ||
        text.includes('manage cookies') ||
        text.includes('cookie settings')
      )) {
        element.remove();
      }
    });
  });

  // Remove backdrop/overlay elements
  const backdrops = document.querySelectorAll('*');
  backdrops.forEach(element => {
    const computedStyle = window.getComputedStyle(element);
    if (
      computedStyle.position === 'fixed' &&
      computedStyle.top === '0px' &&
      computedStyle.left === '0px' &&
      (computedStyle.width === '100%' || computedStyle.width === '100vw') &&
      (computedStyle.height === '100%' || computedStyle.height === '100vh') &&
      (computedStyle.backgroundColor.includes('rgba') || computedStyle.backgroundColor === 'black')
    ) {
      element.remove();
    }
  });

  // Hide any remaining overlays by setting their display to none
  const remainingOverlays = document.querySelectorAll('*');
  remainingOverlays.forEach(element => {
    const computedStyle = window.getComputedStyle(element);
    if (
      computedStyle.position === 'fixed' &&
      parseInt(computedStyle.zIndex) > 1000
    ) {
      (element as HTMLElement).style.display = 'none';
    }
  });
};
