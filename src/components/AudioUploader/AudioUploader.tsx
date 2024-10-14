import React, { useRef, useState, useEffect } from 'react';
import { useAudioProcessor } from '../../hooks/useAudioProcessor';
import { exportMp3Audio } from '../../utils/exportMp3Audio';
import { exportWavAudio } from '../../utils/exportWavAudio';
import { calculateFrequencyResponse } from '../../utils/calculateFrequencyResponse';
import { Tooltip as ReactTooltip } from 'react-tooltip';

import FrequencyResponseChart from '../FrequencyResponseChart/FrequencyResponseChart';
import logo from '../../assets/logo.png';

const AudioUploader: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioElementRef = useRef<HTMLAudioElement>(null);

  const [decayTime, setDecayTime] = useState(2);
  const [pitchShift, setPitchShift] = useState(0);
  const [dryGainValue, setDryGainValue] = useState(0.7);
  const [wetGainValue, setWetGainValue] = useState(0.3);
  const [highPassFrequency, setHighPassFrequency] = useState(100);
  const [lowPassFrequency, setLowPassFrequency] = useState(4000);
  const [needsProcessing, setNeedsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [frequencyData, setFrequencyData] = useState<
    { frequency: number; gain: number }[]
  >([]);

  const {
    audioBuffer,
    processedBuffer,
    audioSrc,
    isProcessing,
    processAudioFile,
    processAudio,
  } = useAudioProcessor();

  const handleFileUpload = async () => {
    if (fileInputRef.current?.files?.[0]) {
      const file = fileInputRef.current.files[0];
      setFileName(file.name.split('.')[0]);
      await processAudioFile(file);
      setNeedsProcessing(true);
    }
  };

  const handleParameterChange = (
    setter: (value: number) => void,
    value: number
  ) => {
    setter(value);
    setNeedsProcessing(true);
  };

  const handleApplyChanges = () => {
    const processingParameters = {
      decayTime,
      pitchShift,
      dryGainValue,
      wetGainValue,
      highPassFrequency,
      lowPassFrequency,
    };
    processAudio(processingParameters);
    setNeedsProcessing(false);
    console.log('Apply Changes clicked, processing audio.');
  };

  const handlePlayPause = () => {
    const audioElement = audioElementRef.current;
    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
      } else {
        // start playback at 30 seconds
        audioElement.currentTime = 30;
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Playback failed:', error);
          });
        }
      }
    }
  };

  useEffect(() => {
    const audioElement = audioElementRef.current;
    if (!audioElement) return;

    // update the audio element source when audioSrc changes
    if (audioSrc) {
      audioElement.src = audioSrc;
      audioElement.load();
    }

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    audioElement.addEventListener('play', onPlay);
    audioElement.addEventListener('pause', onPause);
    audioElement.addEventListener('ended', onEnded);

    return () => {
      audioElement.removeEventListener('play', onPlay);
      audioElement.removeEventListener('pause', onPause);
      audioElement.removeEventListener('ended', onEnded);
    };
  }, [audioSrc]);

  useEffect(() => {
    const data = calculateFrequencyResponse(
      highPassFrequency,
      lowPassFrequency
    );
    setFrequencyData(data);
  }, [highPassFrequency, lowPassFrequency]);

  function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const handleMp3Export = async () => {
    if (processedBuffer) {
      setIsExporting(true);
      await delay(1000);
      try {
        // encode to MP3 for export
        const mp3Blob = await exportMp3Audio(processedBuffer);

        const url = URL.createObjectURL(mp3Blob);

        // create a download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName + ' (made with modul8r)' || 'your song (made with modul8r)'}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // clean up!
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed. Please try again.');
      } finally {
        setIsExporting(false);
      }
    } else {
      alert('Please upload and process an audio file first.');
    }
  };

  const handleWavExport = async () => {
    if (audioBuffer) {
      setIsExporting(true);
      await delay(1000);
      try {
        // encode to WAV for export
        const wavBlob = await exportWavAudio(
          audioBuffer,
          decayTime,
          pitchShift,
          dryGainValue,
          wetGainValue,
          highPassFrequency,
          lowPassFrequency
        );

        const url = URL.createObjectURL(wavBlob);

        // create a download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName + ' (made with modul8r)' || 'your song (made with modul8r)'}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // clean up!
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed. Please try again.');
      } finally {
        setIsExporting(false);
      }
    } else {
      alert('Please upload and process an audio file first.');
    }
  };

  return (
    <div className="bg-[#F0D7FF] font-barlow tracking-tighter max-w-3xl max-h-xl m-auto p-4 bg-white shadow-xl rounded-lg">
      <img src={logo} alt="title-logo" className="w-128 m-auto" />
      <h1 className="text-md mb-8 text-center mx-8 text-gray-700">
        Slow, speed up, and pitch shift audio files with ease. Upload a file,
        adjust the reverb decay time and pitch shift, then apply and preview
        your changes. Export to .mp3 and .wav to save your changes.
      </h1>
      <hr className="border-gray-300 border border-[1.25px]" />
      <div className="space-y-4">
        <h1 className="text-xl font-bold my-4 text-left box">Upload File</h1>
        <input
          type="file"
          accept="audio/*"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        <hr className="border-gray-300 border border-[1.25px]" />
        <h1 className="text-xl font-bold mb-4 text-left">Reverberation</h1>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <div className="flex">
              <span
                data-tooltip-id="reverb-tooltip"
                data-tooltip-html={`Reverb Decay Time controls the length of the reverb effect. <br><br> Higher values apply a longer reverb tail, resulting in a spacier, ethereal sound. <br><br> Lower values tend to be tighter and more confined.`}
                data-tooltip-place="right"
                data-tooltip-delay-show={500}
                data-tooltip-delay-hide={300}
                className="mr-2 text-blue-500 cursor-pointer"
              >
                ⓘ
              </span>
              <label className="block text-gray-700 font-medium mb-1">
                Reverb Decay Time (s): {decayTime}s
              </label>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={decayTime}
              onChange={e =>
                handleParameterChange(setDecayTime, parseFloat(e.target.value))
              }
              className="w-full"
            />
          </div>
          {showAdvanced && (
            <div>
              {/* Dry Gain */}
              <div>
                <h1 className="text-xl font-bold mb-4 text-left">
                  Advanced Settings
                </h1>
                <div className="flex">
                  <span
                    data-tooltip-id="dry-gain-tooltip"
                    data-tooltip-html={`Dry Gain handles the volume of the raw, unprocessed audio signal. <br><br> Higher values make the unprocessed audio stronger, while lower values reduce it, opening up more space for additional effects and reverberation.`}
                    data-tooltip-place="right"
                    data-tooltip-delay-show={500}
                    data-tooltip-delay-hide={300}
                    className="mr-2 text-blue-500 cursor-pointer"
                  >
                    ⓘ
                  </span>
                  <label className="block text-gray-700 font-medium mb-1">
                    Dry Gain: {dryGainValue.toFixed(2)}
                  </label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={dryGainValue}
                  onChange={e =>
                    handleParameterChange(
                      setDryGainValue,
                      parseFloat(e.target.value)
                    )
                  }
                  className="w-full"
                />
              </div>
              {/* Wet Gain */}
              <div>
                <div className="flex">
                  <span
                    data-tooltip-id="wet-gain-tooltip"
                    data-tooltip-html={`Wet Gain handles the volume of the processed, reverberated audio signal. <br><br> Higher values make the reverberated audio stronger, while lower values reduce it, giving the dry signal more space in the overall mix.`}
                    data-tooltip-place="right"
                    data-tooltip-delay-show={500}
                    data-tooltip-delay-hide={300}
                    className="mr-2 text-blue-500 cursor-pointer"
                  >
                    ⓘ
                  </span>
                  <label className="block text-gray-700 font-medium mb-1">
                    Wet Gain: {wetGainValue.toFixed(2)}
                  </label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={wetGainValue}
                  onChange={e =>
                    handleParameterChange(
                      setWetGainValue,
                      parseFloat(e.target.value)
                    )
                  }
                  className="w-full"
                />
              </div>
              {/* High-Pass Filter Frequency */}
              <div>
                <div className="flex">
                  <span
                    data-tooltip-id="high-pass-tooltip"
                    data-tooltip-html={`The High Pass Frequency Filter controls the dynamics of the lower frequencies in the processed audio signal. <br><br> A higher value will cut out the bass and kick elements within the wet, reverberated signal, while a lower value will allow them to filter in. <br><br> Typically, a lower value may sound 'muddier' because the bass and kick reverb overpowers the raw signal within the lower frequency ranges.`}
                    data-tooltip-place="right"
                    data-tooltip-delay-show={500}
                    data-tooltip-delay-hide={300}
                    className="mr-2 text-blue-500 cursor-pointer"
                  >
                    ⓘ
                  </span>
                  <label className="block text-gray-700 font-medium mb-1">
                    High Pass Filter Frequency (Hz): {highPassFrequency} Hz
                  </label>
                </div>
                <input
                  type="range"
                  min="20"
                  max="1000"
                  step="1"
                  value={highPassFrequency}
                  onChange={e =>
                    handleParameterChange(
                      setHighPassFrequency,
                      parseFloat(e.target.value)
                    )
                  }
                  className="w-full"
                />
              </div>
              {/* Low-Pass Filter Frequency */}
              <div>
                <div className="flex">
                  <span
                    data-tooltip-id="low-pass-tooltip"
                    data-tooltip-html={`The Low Pass Frequency Filter controls the dynamics of the higher frequencies in the processed audio signal. <br><br> A higher value will cut out the high hats and snares, in addition to other 'airy' sounds within the reverberated signal, while a lower value will allow them to filter in. <br><br> A higher value may overpower the entire mix, mostly because the high hat and snare reverb creates extremely powerful air on top of the track.`}
                    data-tooltip-place="right"
                    data-tooltip-delay-show={500}
                    data-tooltip-delay-hide={300}
                    className="mr-2 text-blue-500 cursor-pointer"
                  >
                    ⓘ
                  </span>
                  <label className="block text-gray-700 font-medium mb-1">
                    Low Pass Filter Frequency (Hz): {lowPassFrequency} Hz
                  </label>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="22000"
                  step="1"
                  value={lowPassFrequency}
                  onChange={e =>
                    handleParameterChange(
                      setLowPassFrequency,
                      parseFloat(e.target.value)
                    )
                  }
                  className="w-full"
                />
              </div>
              <div className="mt-6">
                <div className="flex">
                  <span
                    data-tooltip-id="freq-response-tooltip"
                    data-tooltip-html={`The Frequency Response graph helps you visualize the changes you've made to the High Pass and Low Pass Frequency Filters. <br><br> As the high end of the graph curves down and to the left, the higher end frequencies, such as high hats and snares, are cut out. <br><br> When the lower end of the graph curves in, lower frequencies, like the bass and kick, are removed, giving the higher frequencies space within the mix.`}
                    data-tooltip-place="right"
                    data-tooltip-delay-show={500}
                    data-tooltip-delay-hide={300}
                    className="mr-2 mt-0.5 text-blue-500 cursor-pointer"
                  >
                    ⓘ
                  </span>
                  <h2 className="text-xl font-bold mb-2">Frequency Response</h2>
                </div>
                <FrequencyResponseChart data={frequencyData} />
              </div>
              {dryGainValue + wetGainValue > 1 && (
                <div className="flex justify-center border border-black rounded-lg bg-gray-100 p-4 my-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#EA3323"
                    className="mr-2"
                  >
                    <path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z" />
                  </svg>
                  <p>
                    Your current total gain is{' '}
                    <b>{(dryGainValue + wetGainValue).toFixed(2)}</b>, exceeding
                    the usual threshold of <b>1</b>. This may cause clipping,
                    leading to distortion!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-center">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            data-tooltip-id="show-advanced-tooltip"
            data-tooltip-html={`Set advanced parameters like Dry Gain, Wet Gain, High Pass and Low Pass Frequency Filters. <br><br> Mouse over the  ⓘ  to learn more about each parameter.`}
            data-tooltip-place="right"
            data-tooltip-delay-show={500}
            data-tooltip-delay-hide={300}
          >
            {showAdvanced
              ? 'Hide Advanced Reverb Settings'
              : 'Show Advanced Reverb Settings'}
          </button>
        </div>
        {/* Pitch Shift */}
        <hr className="border-gray-300 border border-[1.25px]" />
        <h1 className="font-jersey10 text-xl font-bold mb-4 text-left">
          Pitch & Tempo Shift
        </h1>
        <div>
          <div className="flex">
            <span
              data-tooltip-id="pitch-shift-tooltip"
              data-tooltip-content="Pitch shift controls both the tempo and key of the audio signal. For example, if your file is in the key of 'C' and has a BPM (beats per minute) of 120, a -1 semitone adjustment will reduce the tempo to 110 and shift the key to 'B'."
              data-tooltip-place="right"
              data-tooltip-delay-show={500}
              data-tooltip-delay-hide={300}
              className="mr-2 text-blue-500 cursor-pointer"
            >
              ⓘ
            </span>
            <label className="block text-gray-700 font-medium mb-1">
              Pitch Shift (Semitones): {pitchShift}
            </label>
          </div>
          <input
            type="range"
            min="-12"
            max="12"
            step="1"
            value={pitchShift}
            onChange={e =>
              handleParameterChange(setPitchShift, parseFloat(e.target.value))
            }
            className="w-full"
          />
        </div>
        <hr className="border-gray-300 border border-[1.25px]" />
        <h1 className="text-xl font-bold mb-4 text-left">
          Preview & Export Audio
        </h1>
        <div className="grid grid-cols-2 grid-rows-2 p-2">
          <audio ref={audioElementRef} />
          <button
            onClick={handlePlayPause}
            disabled={!audioSrc || isProcessing || isExporting}
            className="m-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isPlaying ? (
              <div className="flex justify-center space-x-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#FFFFFF"
                >
                  <path d="M320-320h320v-320H320v320ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                </svg>
                <span>Stop Playback</span>
              </div>
            ) : (
              <div className="flex justify-center space-x-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#FFFFFF"
                >
                  <path d="m380-300 280-180-280-180v360ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                </svg>
                <span>Preview Audio</span>
              </div>
            )}
          </button>
          <button
            onClick={handleApplyChanges}
            disabled={
              !needsProcessing || isProcessing || isPlaying || isExporting
            }
            className="m-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Apply Changes
          </button>
          <button
            onClick={handleWavExport}
            disabled={
              needsProcessing || !processedBuffer || isProcessing || isExporting
            }
            className="m-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Export as .wav
          </button>
          <button
            onClick={handleMp3Export}
            disabled={
              needsProcessing || !processedBuffer || isProcessing || isExporting
            }
            className="m-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Export as .mp3
          </button>
        </div>
        {isProcessing && (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full w-6 h-6 border-4 border-t-transparent border-indigo-500"></div>
            <p className="text-gray-700">Applying changes...</p>
          </div>
        )}
        {isExporting && (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full w-6 h-6 border-4 border-t-transparent border-indigo-500"></div>
            <p className="text-gray-700">Exporting audio...</p>
          </div>
        )}
      </div>
      <ReactTooltip
        id="freq-response-tooltip"
        className="bg-gray-800 text-white px-2 py-1 rounded shadow-lg max-w-sm"
      />
      <ReactTooltip
        id="reverb-tooltip"
        className="bg-gray-800 text-white px-2 py-1 rounded shadow-lg max-w-sm"
      />
      <ReactTooltip
        id="dry-gain-tooltip"
        className="bg-gray-800 text-white px-2 py-1 rounded shadow-lg max-w-sm"
      />
      <ReactTooltip
        id="wet-gain-tooltip"
        className="bg-gray-800 text-white px-2 py-1 rounded shadow-lg max-w-sm"
      />
      <ReactTooltip
        id="pitch-shift-tooltip"
        className="bg-gray-800 text-white px-2 py-1 rounded shadow-lg max-w-sm"
      />
      <ReactTooltip
        id="high-pass-tooltip"
        className="bg-gray-800 text-white px-2 py-1 rounded shadow-lg max-w-sm"
      />
      <ReactTooltip
        id="low-pass-tooltip"
        className="bg-gray-800 text-white px-2 py-1 rounded shadow-lg max-w-sm"
      />
      <ReactTooltip
        id="show-advanced-tooltip"
        className="bg-gray-800 text-white px-2 py-1 rounded shadow-lg max-w-sm"
      />
    </div>
  );
};

export default AudioUploader;
