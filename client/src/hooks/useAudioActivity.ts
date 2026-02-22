import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export default function useAudioActivity(stream: MediaStream | null, threshold: number = -50): boolean {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream || !stream.active) {
      setIsSpeaking(false);
      return;
    }

    // Initialize AudioContext
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();
    audioContextRef.current = audioContext;
    
    const analyser = audioContext.createAnalyser();
    analyserRef.current = analyser;
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.4;

    try {
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      let lastUpdate = 0;
      let lastSpeakingState = false;
      const THROTTLE_MS = 100;
      const DEBOUNCE_MS = 400; // Hang-over time to keep indicator active during brief pauses
      let lastSpeakingTime = 0;

      const checkAudio = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / bufferLength);
        const db = rms > 0 ? 20 * Math.log10(rms / 255) : -100;

        const now = Date.now();
        const currentlySpeaking = db > threshold;
        
        if (currentlySpeaking) {
          lastSpeakingTime = now;
        }

        const shouldBeSpeaking = (now - lastSpeakingTime) < DEBOUNCE_MS;

        if (now - lastUpdate > THROTTLE_MS) {
          if (shouldBeSpeaking !== lastSpeakingState) {
            setIsSpeaking(shouldBeSpeaking);
            lastSpeakingState = shouldBeSpeaking;
          }
          lastUpdate = now;
        }

        animationFrameRef.current = requestAnimationFrame(checkAudio);
      };

      checkAudio();
    } catch (err) {
      console.error("Error setting up audio analysis:", err);
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [stream, threshold]);

  return isSpeaking;
}
