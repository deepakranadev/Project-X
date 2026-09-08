export const MAX_LOGO_FILE_SIZE_BYTES = 2 * 1024 * 1024;

export type SupportedImageMimeType =
  | "image/jpeg"
  | "image/png"
  | "image/webp";

export interface PersistedImage {
  readonly blob: Blob;
  readonly fileName: string;
}

export type PersistedImageValidationIssueCode =
  | "INVALID_IMAGE"
  | "UNSUPPORTED_IMAGE_TYPE"
  | "UNSUPPORTED_IMAGE_EXTENSION"
  | "EMPTY_IMAGE"
  | "IMAGE_TOO_LARGE";

export interface PersistedImageValidationIssue {
  readonly code: PersistedImageValidationIssueCode;
  readonly message: string;
}

const SUPPORTED_IMAGE_EXTENSIONS: Readonly<
  Record<SupportedImageMimeType, readonly string[]>
> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};

function isSupportedImageMimeType(
  value: string,
): value is SupportedImageMimeType {
  return Object.hasOwn(SUPPORTED_IMAGE_EXTENSIONS, value);
}

function fileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot === -1 ? "" : fileName.slice(lastDot + 1).toLowerCase();
}

export function validatePersistedImage(
  image: PersistedImage,
): readonly PersistedImageValidationIssue[] {
  if (!(image.blob instanceof Blob)) {
    return [
      {
        code: "INVALID_IMAGE",
        message: "Choose a valid image file.",
      },
    ];
  }

  if (!isSupportedImageMimeType(image.blob.type)) {
    return [
      {
        code: "UNSUPPORTED_IMAGE_TYPE",
        message: "Use a PNG, JPG, or WEBP image.",
      },
    ];
  }

  if (
    !SUPPORTED_IMAGE_EXTENSIONS[image.blob.type].includes(
      fileExtension(image.fileName),
    )
  ) {
    return [
      {
        code: "UNSUPPORTED_IMAGE_EXTENSION",
        message: "The file extension must match its PNG, JPG, or WEBP format.",
      },
    ];
  }

  if (image.blob.size === 0) {
    return [
      {
        code: "EMPTY_IMAGE",
        message: "The selected image is empty. Choose another file.",
      },
    ];
  }

  if (image.blob.size > MAX_LOGO_FILE_SIZE_BYTES) {
    return [
      {
        code: "IMAGE_TOO_LARGE",
        message: "Logo images must be 2 MB or smaller.",
      },
    ];
  }

  return [];
}
