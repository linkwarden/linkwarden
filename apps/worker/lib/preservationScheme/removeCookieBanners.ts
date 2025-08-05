/**
 * Function to hide cookie banners and modal overlays by injecting CSS
 * This is the safest and most efficient approach
 * 
 * This function runs in the browser context via page.evaluate()
 */
export const removeCookieBannersAndOverlays = () => {
  
  // Create style element with CSS rules to hide cookie banners and modals
  const style = document.createElement('style');
  style.textContent = `

    /* Hide native dialog elements and elements with ARIA roles */
    dialog,
    [role="dialog"],
    [role="modal"],
    [role="alertdialog"],
    [role="banner"] {
      opacity: 0 !important;
    }
    
    /* Hide elements with backdrop/overlay/modal in class name */
    [class*="backdrop"],
    [class*="overlay"],
    [class*="modal"],
    [class*="dialog"] {
      opacity: 0 !important;
    }
    
    /* Hide known cookie banner IDs and classes */
    #cookieChoiceInfo,
    #cookie-banner,
    #cookie-notice,
    #cookieConsent,
    #CybotCookiebotDialog,
    .cc-banner,
    .cc-window,
    .optanon-alert-box-wrapper,
    .ot-sdk-container,
    #onetrust-banner-sdk,
    .osano-cm-window,
    .fc-consent-root,
    .didomi-popup,
    .cky-consent-container,
    [class*="cookie-banner"],
    [class*="cookie-consent"],
    [id*="cookie-banner"],
    [id*="cookie-consent"] {
      opacity: 0 !important;
    }
  `;
  
  // Inject the CSS into the page
  document.head.appendChild(style);
};
