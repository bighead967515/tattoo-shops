/**
 * Artist subscription tier limits and features
 */

export const TIER_LIMITS = {
  free: {
    portfolioPhotos: 3,
    canAcceptBookings: false,
    canShowDirectContact: false,
    canRespondToReviews: false,
    hasAnalytics: false,
    showExactLocation: false,
    isFeatured: false,
  },
  premium: {
    portfolioPhotos: Infinity,
    canAcceptBookings: true,
    canShowDirectContact: true,
    canRespondToReviews: true,
    hasAnalytics: true,
    showExactLocation: true,
    isFeatured: true,
  },
} as const;

export type SubscriptionTier = keyof typeof TIER_LIMITS;

export function getTierLimits(tier: SubscriptionTier) {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

export function canUploadMorePhotos(tier: SubscriptionTier, currentCount: number): boolean {
  const limits = getTierLimits(tier);
  return currentCount < limits.portfolioPhotos;
}
