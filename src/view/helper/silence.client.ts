const SampleRate = 8000;
const NoiseAmplitude = 8;
const cache = new Map<number, string>();

export const silenceUrl = (ms: number) => {
  const rounded = Math.max(100, Math.round(ms / 100) * 100);
  const length = (SampleRate * rounded) / 1000;
  const cached = cache.get(length);
  if (cached) return cached;

  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);
  const writeText = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeText(0, "RIFF");
  view.setUint32(4, 36 + length * 2, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SampleRate, true);
  view.setUint32(28, SampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, length * 2, true);
  for (let i = 0; i < length; i++) {
    view.setInt16(44 + i * 2, i % 2 === 0 ? NoiseAmplitude : -NoiseAmplitude, true);
  }

  const url = URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
  cache.set(length, url);
  return url;
};
