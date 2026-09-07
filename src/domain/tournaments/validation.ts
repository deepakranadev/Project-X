import type {
  CreateTournamentInput,
  PersistedImage,
  SupportedImageMimeType,
  TournamentImage,
} from "./types";

export const MAX_LOGO_FILE_SIZE_BYTES = 2 * 1024 * 1024;
export const MAX_TOURNAMENT_NAME_LENGTH = 80;
export const MAX_ORGANIZER_NAME_LENGTH = 80;

export type TournamentValidationField =
  | "name"
  | "game"
  | "tournamentLogo"
  | "organizerName"
  | "organizerLogo";

export type TournamentValidationIssueCode =
  | "REQUIRED"
  | "TOO_LONG"
  | "UNSUPPORTED_GAME"
  | "INVALID_IMAGE"
  | "UNSUPPORTED_IMAGE_TYPE"
  | "UNSUPPORTED_IMAGE_EXTENSION"
  | "EMPTY_IMAGE"
  | "IMAGE_TOO_LARGE";

export interface TournamentValidationIssue {
  readonly field: TournamentValidationField;
  readonly code: TournamentValidationIssueCode;
  readonly message: string;
}

export interface TournamentValidationResult {
  readonly valid: boolean;
  readonly issues: readonly TournamentValidationIssue[];
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

export class TournamentValidationError extends Error {
  readonly issues: readonly TournamentValidationIssue[];

  constructor(issues: readonly TournamentValidationIssue[]) {
    super(issues.map((issue) => issue.message).join(" "));
    this.name = "TournamentValidationError";
    this.issues = issues;
  }
}

export function validateTournamentImage(
  image: TournamentImage,
  field: "tournamentLogo" | "organizerLogo",
): readonly TournamentValidationIssue[] {
  return validatePersistedImage(image).map((issue) => ({ ...issue, field }));
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

export function validateTournamentInput(
  input: CreateTournamentInput,
): TournamentValidationResult {
  const issues: TournamentValidationIssue[] = [];
  const name = input.name.trim();
  const organizerName = input.organizerName.trim();

  if (name.length === 0) {
    issues.push({
      field: "name",
      code: "REQUIRED",
      message: "Enter a tournament name.",
    });
  } else if (name.length > MAX_TOURNAMENT_NAME_LENGTH) {
    issues.push({
      field: "name",
      code: "TOO_LONG",
      message: `Tournament name must be ${MAX_TOURNAMENT_NAME_LENGTH} characters or fewer.`,
    });
  }

  if (input.game !== "BGMI") {
    issues.push({
      field: "game",
      code: "UNSUPPORTED_GAME",
      message: "BGMI is the only supported game right now.",
    });
  }

  if (organizerName.length > MAX_ORGANIZER_NAME_LENGTH) {
    issues.push({
      field: "organizerName",
      code: "TOO_LONG",
      message: `Organizer name must be ${MAX_ORGANIZER_NAME_LENGTH} characters or fewer.`,
    });
  }

  if (input.tournamentLogo) {
    issues.push(
      ...validateTournamentImage(input.tournamentLogo, "tournamentLogo"),
    );
  }

  if (input.organizerLogo) {
    issues.push(
      ...validateTournamentImage(input.organizerLogo, "organizerLogo"),
    );
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
