export const calculateFrequencyResponse = (
  highPassFrequency: number,
  lowPassFrequency: number
): { frequency: number; gain: number }[] => {
  const data = [];

  // set a frequency range from 20 Hz to 20 kHz
  const minFrequency = 20;
  const maxFrequency = 22000;
  const numPoints = 12; // set a static number of data points

  // logarithmically spaced frequencies -- no need to clump them statically
  for (let i = 0; i < numPoints; i++) {
    const frequency =
      minFrequency * Math.pow(maxFrequency / minFrequency, i / (numPoints - 1));

    // calculate gain for high pass filter
    const hpGain = calculateHighPassGain(frequency, highPassFrequency);

    // calculate gain for low pass filter
    const lpGain = calculateLowPassGain(frequency, lowPassFrequency);

    // total gain is the combination of both filters
    const totalGain = hpGain + lpGain;

    // round frequency and gain to whole numbers
    const roundedFrequency = Math.round(frequency);
    const roundedGain = Math.round(totalGain);

    data.push({ frequency: roundedFrequency, gain: roundedGain });
  }

  return data;
};

const calculateHighPassGain = (
  frequency: number,
  cutoffFrequency: number
): number => {
  if (frequency <= 0) return -Infinity;

  const omega = (2 * Math.PI * frequency) / 44100;
  const omegaC = (2 * Math.PI * cutoffFrequency) / 44100;

  const gain = 20 * Math.log10(Math.sqrt(1 + Math.pow(omegaC / omega, 2)));

  return -gain; // negative gain below cutoff
};

const calculateLowPassGain = (
  frequency: number,
  cutoffFrequency: number
): number => {
  if (frequency <= 0) return -Infinity;

  const omega = (2 * Math.PI * frequency) / 44100;
  const omegaC = (2 * Math.PI * cutoffFrequency) / 44100;

  const gain = 20 * Math.log10(Math.sqrt(1 + Math.pow(omega / omegaC, 2)));

  return -gain; // negative gain above cutoff
};
