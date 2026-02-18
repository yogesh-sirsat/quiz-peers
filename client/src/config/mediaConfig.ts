export const MEDIA_CONSTRAINTS: MediaStreamConstraints = {
  video: false,
  audio: {
    echoCancellation: true,
    noiseSuppression: true
  }
};
