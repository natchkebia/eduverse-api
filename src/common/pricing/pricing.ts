export type PricingComputed = {
  originalPrice: number;
  discountedPrice: number | null;
  discountPercent: number | null;
};

export function computePricing(
  originalPrice: number,
  discountedPrice?: number | null
): PricingComputed {
  if (!Number.isInteger(originalPrice) || originalPrice < 0) {
    throw new Error("originalPrice must be an integer >= 0");
  }

  if (discountedPrice === undefined || discountedPrice === null) {
    return { originalPrice, discountedPrice: null, discountPercent: null };
  }

  if (!Number.isInteger(discountedPrice) || discountedPrice < 0) {
    throw new Error("discountedPrice must be an integer >= 0");
  }

  if (discountedPrice === originalPrice) {
    return { originalPrice, discountedPrice: null, discountPercent: null };
  }

  if (discountedPrice > originalPrice) {
    throw new Error("discountedPrice cannot be greater than originalPrice");
  }

  if (originalPrice === 0) {
    return { originalPrice: 0, discountedPrice: null, discountPercent: null };
  }

  const percent = Math.round(
    ((originalPrice - discountedPrice) / originalPrice) * 100
  );

  if (percent <= 0) {
    return { originalPrice, discountedPrice: null, discountPercent: null };
  }

  return {
    originalPrice,
    discountedPrice,
    discountPercent: percent,
  };
}
