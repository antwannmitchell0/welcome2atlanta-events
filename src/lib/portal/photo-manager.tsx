"use client";

import { useState } from "react";
import {
  deleteGalleryPhoto,
  reorderGalleryPhotos,
  setCoverPhoto,
  setGalleryPhotoFlags,
} from "./events";
import { mediaUrl } from "./media-url";

export function PhotoManager({
  eventId,
  coverPhotoId,
  photos,
  onChanged,
}: {
  eventId: string;
  coverPhotoId: string | null;
  photos: Array<{
    id: string;
    display_filename: string;
    upload_status: string;
    featured: boolean;
    hidden: boolean;
    processing_error: string | null;
  }>;
  onChanged: () => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(id: string, task: () => Promise<unknown>, done: string) {
    setBusyId(id);
    setMessage(null);
    try {
      await task();
      setMessage(done);
      onChanged();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not update photo.");
    } finally {
      setBusyId(null);
    }
  }

  async function move(photoId: string, dir: -1 | 1) {
    const ids = photos.map((photo) => photo.id);
    const index = ids.indexOf(photoId);
    const next = index + dir;
    if (index < 0 || next < 0 || next >= ids.length) return;
    const copy = [...ids];
    const [removed] = copy.splice(index, 1);
    if (!removed) return;
    copy.splice(next, 0, removed);
    await run(photoId, () => reorderGalleryPhotos({ data: { eventId, photoIds: copy } }), "Order updated.");
  }

  if (photos.length === 0) {
    return <p className="text-sm text-muted">No photos in this folder yet.</p>;
  }

  return (
    <div className="space-y-4">
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo, index) => {
          const isCover = coverPhotoId === photo.id;
          const disabled = busyId === photo.id;
          const src =
            photo.upload_status === "ready" ? mediaUrl(photo.id) : undefined;
          return (
            <li key={photo.id} className="overflow-hidden rounded-xl border border-border bg-surface">
              <div className="relative aspect-square bg-elevated">
                {src ? (
                  <img src={src} alt={photo.display_filename} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center px-3 text-center text-xs text-muted">
                    {photo.upload_status}
                  </div>
                )}
                {isCover ? (
                  <span className="absolute left-2 top-2 rounded-full bg-bg/80 px-2 py-1 text-[10px] tracking-wide text-accent">
                    COVER
                  </span>
                ) : null}
                {photo.hidden ? (
                  <span className="absolute right-2 top-2 rounded-full bg-bg/80 px-2 py-1 text-[10px] text-live">
                    HIDDEN
                  </span>
                ) : null}
              </div>
              <div className="space-y-2 p-3">
                <p className="truncate text-xs" title={photo.display_filename}>
                  {photo.display_filename}
                </p>
                <p className="text-xs text-muted">
                  {photo.upload_status}
                  {photo.featured ? " · featured" : ""}
                  {photo.processing_error ? ` · ${photo.processing_error}` : ""}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={disabled || photo.upload_status !== "ready" || photo.hidden}
                    className="min-h-11 rounded-full border border-border text-xs disabled:opacity-40"
                    onClick={() =>
                      void run(photo.id, () => setCoverPhoto({ data: { eventId, photoId: photo.id } }), "Cover set.")
                    }
                  >
                    Cover
                  </button>
                  <button
                    type="button"
                    disabled={disabled || photo.upload_status !== "ready"}
                    className="min-h-11 rounded-full border border-border text-xs disabled:opacity-40"
                    onClick={() =>
                      void run(
                        photo.id,
                        () => setGalleryPhotoFlags({ data: { photoId: photo.id, featured: !photo.featured } }),
                        photo.featured ? "Unfeatured." : "Featured.",
                      )
                    }
                  >
                    {photo.featured ? "Unfeature" : "Feature"}
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    className="min-h-11 rounded-full border border-border text-xs disabled:opacity-40"
                    onClick={() =>
                      void run(
                        photo.id,
                        () => setGalleryPhotoFlags({ data: { photoId: photo.id, hidden: !photo.hidden } }),
                        photo.hidden ? "Visible." : "Hidden.",
                      )
                    }
                  >
                    {photo.hidden ? "Unhide" : "Hide"}
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    className="min-h-11 rounded-full border border-live/40 text-xs text-live disabled:opacity-40"
                    onClick={() => setConfirmId(photo.id)}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    disabled={disabled || index === 0}
                    className="min-h-11 rounded-full border border-border text-xs disabled:opacity-40"
                    onClick={() => void move(photo.id, -1)}
                  >
                    Earlier
                  </button>
                  <button
                    type="button"
                    disabled={disabled || index === photos.length - 1}
                    className="min-h-11 rounded-full border border-border text-xs disabled:opacity-40"
                    onClick={() => void move(photo.id, 1)}
                  >
                    Later
                  </button>
                </div>
                {confirmId === photo.id ? (
                  <div className="rounded-lg border border-live/40 p-2 text-xs">
                    <p>Delete this photo from the event? This cannot be undone.</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        className="min-h-11 flex-1 rounded-full bg-live px-3 text-bg"
                        onClick={() => {
                          setConfirmId(null);
                          void run(
                            photo.id,
                            () => deleteGalleryPhoto({ data: { eventId, photoId: photo.id } }),
                            "Photo deleted.",
                          );
                        }}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className="min-h-11 flex-1 rounded-full border border-border px-3"
                        onClick={() => setConfirmId(null)}
                      >
                        Keep
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
