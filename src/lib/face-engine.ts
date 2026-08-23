import type { EventRecord } from "@/lib/events";

export type FaceStatus = "searching" | "locked" | "missing";

export type FaceMatch = {
  eventSlug: string;
  eventTitle: string;
  image: string;
  score: number;
};

type FaceApi = typeof import("@vladmandic/face-api");

let api: FaceApi | null = null;
let modelsReady = false;
let galleryIndex: Promise<IndexedFace[]> | null = null;

type IndexedFace = {
  eventSlug: string;
  eventTitle: string;
  image: string;
  descriptor: Float32Array;
};

const MATCH_MAX = 0.58;

export async function loadFaceApi() {
  if (modelsReady && api) return api;
  const faceapi = await import("@vladmandic/face-api");
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("/face-models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/face-models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("/face-models"),
  ]);
  api = faceapi;
  modelsReady = true;
  return faceapi;
}

export async function detectLiveFace(video: HTMLVideoElement) {
  const faceapi = await loadFaceApi();
  const detection = await faceapi.detectSingleFace(
    video,
    new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.45 }),
  );
  if (!detection) return null;
  return {
    box: detection.box,
    score: detection.score,
  };
}

export function isFaceInGuide(
  box: { x: number; y: number; width: number; height: number },
  video: HTMLVideoElement,
) {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const inX = cx > video.videoWidth * 0.22 && cx < video.videoWidth * 0.78;
  const inY = cy > video.videoHeight * 0.18 && cy < video.videoHeight * 0.82;
  const largeEnough = box.width > video.videoWidth * 0.22;
  return inX && inY && largeEnough;
}

export async function descriptorFromImage(source: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement) {
  const faceapi = await loadFaceApi();
  const result = await faceapi
    .detectSingleFace(source, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  return result?.descriptor ?? null;
}

async function loadImage(src: string) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await img.decode();
  return img;
}

async function indexGalleries(events: EventRecord[]): Promise<IndexedFace[]> {
  const faceapi = await loadFaceApi();
  const indexed: IndexedFace[] = [];
  const live = events.filter((event) => event.photoCount > 0);

  for (const event of live) {
    try {
      const img = await loadImage(event.image);
      const faces = await faceapi
        .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.35 }))
        .withFaceLandmarks()
        .withFaceDescriptors();
      for (const face of faces) {
        indexed.push({
          eventSlug: event.slug,
          eventTitle: event.title,
          image: event.image,
          descriptor: face.descriptor,
        });
      }
    } catch {
      // skip a gallery that fails to decode
    }
  }
  return indexed;
}

export async function matchFace(query: Float32Array, events: EventRecord[]): Promise<FaceMatch[]> {
  const faceapi = await loadFaceApi();
  if (!galleryIndex) galleryIndex = indexGalleries(events);
  const indexed = await galleryIndex;

  const scored = indexed
    .map((item) => ({
      eventSlug: item.eventSlug,
      eventTitle: item.eventTitle,
      image: item.image,
      distance: faceapi.euclideanDistance(query, item.descriptor),
    }))
    .filter((item) => item.distance < MATCH_MAX)
    .sort((a, b) => a.distance - b.distance);

  const seen = new Set<string>();
  const matches: FaceMatch[] = [];
  for (const item of scored) {
    const key = `${item.eventSlug}:${item.image}`;
    if (seen.has(key)) continue;
    seen.add(key);
    matches.push({
      eventSlug: item.eventSlug,
      eventTitle: item.eventTitle,
      image: item.image,
      score: Math.max(0, Math.round((1 - item.distance / MATCH_MAX) * 100)),
    });
  }
  return matches;
}

export function captureFrame(video: HTMLVideoElement) {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not capture frame");
  ctx.drawImage(video, 0, 0);
  return canvas;
}
