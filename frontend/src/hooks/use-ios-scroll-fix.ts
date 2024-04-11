import { useEffect } from 'react';

// ----------------------------------------------------------------------

/**
 * Temporary fix for IOS in order to prevent scrolling on MUI Popovers
 * TODO: Lookout for a fix for this on MUI and update when fixed:
 * https://github.com/mui/material-ui/issues/5750
 */
export function useIosScrollFix() {
  useEffect(() => {
    let observer: MutationObserver | undefined;

    if (globalThis?.document) {
      const { body } = globalThis.document;

      observer = new MutationObserver(() => {
        body.style.touchAction = body.style.overflow === 'hidden' ? 'none' : '';
      });

      observer.observe(body, {
        attributes: true,
        attributeFilter: ['style'],
      });
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);
}
