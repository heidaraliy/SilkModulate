// src/utils/exportAudio.ts
import { createReverbImpulseResponse } from './audioUtils';
import toWav from 'audiobuffer-to-wav';

export const exportWavAudio = async (
  audioBuffer: AudioBuffer,
  decayTime: number,
  pitchShift: number,
  dryGainValue: number,
  wetGainValue: number,
  highPassFrequency: number,
  lowPassFrequency: number
): Promise<Blob> => {
  const playbackRate = Math.pow(2, pitchShift / 12);
  const outputLength = audioBuffer.length / playbackRate;

  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    outputLength,
    audioBuffer.sampleRate
  );

  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.playbackRate.value = playbackRate;

  const convolver = offlineContext.createConvolver();
  convolver.buffer = createReverbImpulseResponse(offlineContext, decayTime);

  // Same concept of reverb balancing used here
  const dryGain = offlineContext.createGain();
  const wetGain = offlineContext.createGain();

  // Set the thresholds for dry and wet gain based on user input
  dryGain.gain.value = dryGainValue;
  wetGain.gain.value = wetGainValue;

  // Frequency filters for the exported audio
  const wetHighPassFilter = offlineContext.createBiquadFilter();
  wetHighPassFilter.type = 'highpass';
  wetHighPassFilter.frequency.value = highPassFrequency;

  const wetLowPassFilter = offlineContext.createBiquadFilter();
  wetLowPassFilter.type = 'lowpass';
  wetLowPassFilter.frequency.value = lowPassFrequency;

  // Connect the dry signal nodes
  source.connect(dryGain);
  dryGain.connect(offlineContext.destination);

  // Connect the wet signal nodes
  source.connect(convolver);
  convolver.connect(wetHighPassFilter);
  wetHighPassFilter.connect(wetLowPassFilter);
  wetLowPassFilter.connect(wetGain);
  wetGain.connect(offlineContext.destination);

  source.start(0);

  const renderedBuffer = await offlineContext.startRendering();
  console.log('Rendered buffer duration:', renderedBuffer.duration);

  const wavArrayBuffer = toWav(renderedBuffer);
  console.log('WAV array buffer length:', wavArrayBuffer.byteLength);

  const wavBlob = new Blob([wavArrayBuffer], { type: 'audio/wav' });
  console.log('Created WAV blob:', wavBlob);

  return wavBlob;
};
