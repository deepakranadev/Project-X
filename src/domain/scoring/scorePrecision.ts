export const SCORE_SCALE = 100;
export const MAX_SCORE_DECIMAL_PLACES = 2;

export type ScoreUnits = number;

interface CanonicalDecimal {
  readonly digits: string;
  readonly exponent: number;
  readonly fractionLength: number;
}

function canonicalDecimal(value: number): CanonicalDecimal {
  const [coefficient = "", exponentText] = Math.abs(value)
    .toString()
    .toLowerCase()
    .split("e");
  const [whole = "", fraction = ""] = coefficient.split(".");
  return {
    digits: `${whole}${fraction}`,
    exponent: exponentText === undefined ? 0 : Number(exponentText),
    fractionLength: fraction.length,
  };
}

export function hasSupportedScorePrecision(value: number): boolean {
  if (!Number.isFinite(value)) return false;
  const decimal = canonicalDecimal(value);
  const decimalPlaces = Math.max(
    0,
    decimal.fractionLength - decimal.exponent,
  );
  return decimalPlaces <= MAX_SCORE_DECIMAL_PLACES;
}

export function toScoreUnits(value: number): ScoreUnits {
  if (!Number.isFinite(value)) {
    throw new RangeError("Score values must be finite numbers.");
  }
  if (!hasSupportedScorePrecision(value)) {
    throw new RangeError(
      `Score values must use at most ${MAX_SCORE_DECIMAL_PLACES} decimal places.`,
    );
  }

  const decimal = canonicalDecimal(value);
  const trailingZeroCount =
    decimal.exponent + MAX_SCORE_DECIMAL_PLACES - decimal.fractionLength;
  const absoluteUnits = Number(
    `${decimal.digits}${"0".repeat(trailingZeroCount)}`,
  );
  const units = value < 0 ? -absoluteUnits : absoluteUnits;
  if (!Number.isSafeInteger(units)) {
    throw new RangeError("Score value exceeds the supported exact range.");
  }
  return units === 0 ? 0 : units;
}

export function isScoreValueInExactRange(value: number): boolean {
  try {
    toScoreUnits(value);
    return true;
  } catch {
    return false;
  }
}

export function fromScoreUnits(units: ScoreUnits): number {
  if (!Number.isSafeInteger(units)) {
    throw new RangeError("Score units must be a safe integer.");
  }
  return units / SCORE_SCALE;
}

export function addScoreUnits(
  ...values: readonly ScoreUnits[]
): ScoreUnits {
  let total = 0;
  for (const value of values) {
    if (!Number.isSafeInteger(value)) {
      throw new RangeError("Score units must be safe integers.");
    }
    total += value;
    if (!Number.isSafeInteger(total)) {
      throw new RangeError("Accumulated score exceeds the supported exact range.");
    }
  }
  return total;
}

export function multiplyScoreUnits(
  units: ScoreUnits,
  multiplier: number,
): ScoreUnits {
  if (!Number.isSafeInteger(units) || !Number.isSafeInteger(multiplier)) {
    throw new RangeError(
      "Score multiplication requires safe integer units and multiplier.",
    );
  }
  const product = units * multiplier;
  if (!Number.isSafeInteger(product)) {
    throw new RangeError("Calculated score exceeds the supported exact range.");
  }
  return product;
}
