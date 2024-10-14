import { createReverbImpulseResponse } from './audioUtils';

export const exportProcessedAudioBuffer = async (
  audioBuffer: AudioBuffer,
  decayTime: number,
  pitchShift: number,
  dryGainValue: number,
  wetGainValue: number,
  highPassFrequency: number,
  lowPassFrequency: number
): Promise<AudioBuffer> => {
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

  const dryGain = offlineContext.createGain();
  const wetGain = offlineContext.createGain();

  dryGain.gain.value = dryGainValue;
  wetGain.gain.value = wetGainValue;

  const wetHighPassFilter = offlineContext.createBiquadFilter();
  wetHighPassFilter.type = 'highpass';
  wetHighPassFilter.frequency.value = highPassFrequency;

  const wetLowPassFilter = offlineContext.createBiquadFilter();
  wetLowPassFilter.type = 'lowpass';
  wetLowPassFilter.frequency.value = lowPassFrequency;

  // connect the dry signal nodes
  source.connect(dryGain);
  dryGain.connect(offlineContext.destination);

  // connect the wet signal nodes
  source.connect(convolver);
  convolver.connect(wetHighPassFilter);
  wetHighPassFilter.connect(wetLowPassFilter);
  wetLowPassFilter.connect(wetGain);
  wetGain.connect(offlineContext.destination);

  source.start(0);

  const renderedBuffer = await offlineContext.startRendering();
  return renderedBuffer;
};
