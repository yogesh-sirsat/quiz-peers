export const MEDIA_CONSTRAINTS: MediaStreamConstraints = {
  video: false,
  audio: {
    echoCancellation: false,
    noiseSuppression: true,
    autoGainControl: false,
    sampleRate: 48000,
    channelCount: 1
  }
};
