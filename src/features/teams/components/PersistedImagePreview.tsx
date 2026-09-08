"use client";

/* IndexedDB Blob URLs cannot use Next.js image optimization. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";

import type { PersistedImage } from "@/infrastructure/browser/persistedImage";

interface PersistedImagePreviewProps {
  readonly image: PersistedImage;
  readonly alt: string;
  readonly className: string;
}

export function PersistedImagePreview({
  image,
  alt,
  className,
}: PersistedImagePreviewProps) {
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const objectUrl = URL.createObjectURL(image.blob);

    void Promise.resolve().then(() => {
      if (active) setSource(objectUrl);
    });

    return () => {
      active = false;
      URL.revokeObjectURL(objectUrl);
    };
  }, [image]);

  if (!source) {
    return <span className={className} aria-hidden="true" />;
  }

  return <img className={className} src={source} alt={alt} />;
}
