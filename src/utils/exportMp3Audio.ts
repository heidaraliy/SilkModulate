// src/utils/exportMp3Audio.ts
import lamejs from 'lamejs';

export const exportMp3Audio = async (
  audioBuffer: AudioBuffer
): Promise<Blob> => {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const kbps = 128;

  const mp3Encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, kbps);

  const samples = [];
  for (let channel = 0; channel < numChannels; channel++) {
    samples.push(audioBuffer.getChannelData(channel));
  }

  const maxSamples = 1152;
  const mp3Data: Uint8Array[] = [];

  let mp3buf: Uint8Array;

  const leftChannelData = samples[0];
  const rightChannelData = numChannels > 1 ? samples[1] : samples[0];
  const totalSamples = leftChannelData.length;

  for (let i = 0; i < totalSamples; i += maxSamples) {
    const leftChunk = leftChannelData.subarray(i, i + maxSamples);
    const rightChunk = rightChannelData.subarray(i, i + maxSamples);

    const left = convertFloat32ToInt16(leftChunk);
    const right = numChannels > 1 ? convertFloat32ToInt16(rightChunk) : left;

    mp3buf = mp3Encoder.encodeBuffer(left, right);

    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }

  // Finish encoding
  mp3buf = mp3Encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf);
  }

  const blob = new Blob(mp3Data, { type: 'audio/mp3' });
  return blob;
};

const convertFloat32ToInt16 = (buffer: Float32Array): Int16Array => {
  const l = buffer.length;
  const buf = new Int16Array(l);

  for (let i = 0; i < l; i++) {
    const s = Math.max(-1, Math.min(1, buffer[i]));
    buf[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return buf;
};
