/* eslint-disable @typescript-eslint/consistent-type-definitions */
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export {};
