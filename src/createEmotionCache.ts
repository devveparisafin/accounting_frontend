// src/createEmotionCache.ts

import createCache from '@emotion/cache';

const createEmotionCache = () => {
  // prepend: true moves MUI styles to the top of the <head> so they're loaded first.
  // This can prevent issues with other style libraries.
  return createCache({ key: 'css', prepend: true });
};

export default createEmotionCache;