import { registerRootComponent } from 'expo';

import App from './App';

// #region agent log
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (msg.includes('removeChild') || msg.includes('NotFoundError')) {
      const root = document.getElementById('root');
      const data = {
        location: 'index.ts:error-handler',
        message: 'removeChild/NotFoundError caught',
        hypothesisId: 'H1',
        rootChildCount: root?.childNodes?.length ?? -1,
        rootFirstChildTag: root?.firstChild?.nodeName ?? null,
        rootInnerHTMLLen: root?.innerHTML?.length ?? 0,
        timestamp: Date.now(),
      };
      fetch('http://127.0.0.1:7242/ingest/1dfc81ad-c597-4667-9229-581e5b5698b5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
  });
}
// #endregion

// Prevent double execution on web (bundle can run twice on refresh), which causes two
// React roots and removeChild NotFoundError when the first tree's DevLoadingView unmounts.
const isWeb = typeof window !== 'undefined';
if (isWeb && (window as any).__EXPO_ELECTROMED_ROOT_REGISTERED__) {
  // Already registered; skip to avoid second React tree and removeChild crash.
} else {
  if (isWeb) (window as any).__EXPO_ELECTROMED_ROOT_REGISTERED__ = true;
  registerRootComponent(App);
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/1dfc81ad-c597-4667-9229-581e5b5698b5', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'index.ts:after-register',
        message: 'registerRootComponent done',
        hypothesisId: 'H2',
        timestamp: Date.now(),
        runId: 'post-fix',
      }),
    }).catch(() => {});
  }
  // #endregion
}
