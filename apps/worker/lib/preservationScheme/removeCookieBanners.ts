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
    [class*="dialog"],
    [class*="cookie"] {
      opacity: 0 !important;
    }
    
    /* Hide elements with cookie/consent/banner in ID */
    [id*="cookie"],
    [id*="consent"],
    [id*="banner"],
    [id*="gdpr"],
    [id*="privacy"] {
      opacity: 0 !important;
    }
    
    /* Remove modal/overlay states from body element */
    body.modal-open,
    body[class*="modal"],
    body[class*="overlay"],
    body[class*="scroll-lock"],
    body[class*="no-scroll"],
    body[class*="cookie"] {
      overflow: auto !important;
      position: static !important;
      height: auto !important;
    }
  `;
  
  // Inject the CSS into the page
  document.head.appendChild(style);

  // Remove body classes related to modals and overlays.
  // Hiding modal and overlay classes could otherwise result in an empty page.
  const bodyClasses = document.body.className;
  const modalRelatedClasses = bodyClasses.split(' ').filter(cls => 
    cls.includes('modal') || 
    cls.includes('overlay') || 
    cls.includes('scroll') || 
    cls.includes('no-scroll') ||
    cls.includes('lock') ||
    cls.includes('cookie') ||
    cls.includes('consent') ||
    cls.includes('banner')
  );
  
  modalRelatedClasses.forEach(cls => {
    document.body.classList.remove(cls);
  });
};
