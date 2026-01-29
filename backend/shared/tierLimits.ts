/**
 * Artist subscription tier limits and features
 */

export const TIER_LIMITS = {
  free: {
    name: 'Apprentice', // "Free"
    portfolioPhotos: 3,
    canAcceptBookings: false,
    canShowDirectContact: false,
    canRespondToReviews: false,
    hasAnalytics: false,
    showExactLocation: false,
    isFeatured: false,
    isVerifiedBadge: false,
  },
  amateur: {
    name: 'Artist', // "Amateur"
    portfolioPhotos: 15,
    canAcceptBookings: true, // Unlocks booking
    canShowDirectContact: true, // Unlocks social links
    canRespondToReviews: false,
    hasAnalytics: false,
    showExactLocation: true,
    isFeatured: false,
    isVerifiedBadge: true, // Must be verified to pay
  },
  professional: {
    name: 'Professional',
    portfolioPhotos: Number.MAX_SAFE_INTEGER, // Unlimited
    canAcceptBookings: true,
    canShowDirectContact: true,
    canRespondToReviews: true, // Reputation management
    hasAnalytics: true, // Business insights
    showExactLocation: true,
    isFeatured: false,
    isVerifiedBadge: true,
  },
  frontPage: {
    name: 'Icon', // "Front Page"
    portfolioPhotos: Number.MAX_SAFE_INTEGER,
    canAcceptBookings: true,
    canShowDirectContact: true,
    canRespondToReviews: true,
    hasAnalytics: true,
    showExactLocation: true,
    isFeatured: true, // <--- This triggers the Homepage Carousel logic
    isVerifiedBadge: true,
  },
} as const;

// New Object to handle your Billing Logic
export const TIER_PRICING = {
  free: {
    monthly: 0,
    yearly: 0,
    stripePriceIdMonth: null,
    stripePriceIdYear: null,
  },
  amateur: {
    monthly: 900, // $9.00 (Stored in cents usually)
    yearly: 9000, // $90.00
    stripePriceIdMonth: 'price_amateur_mo_123', // Placeholder for Stripe ID
    stripePriceIdYear: 'price_amateur_yr_123',
  },
  professional: {
    monthly: 1900,
    yearly: 19000,
    stripePriceIdMonth: 'price_pro_mo_123',
    stripePriceIdYear: 'price_pro_yr_123',
  },
  frontPage: {
    monthly: 3900,
    yearly: 39000,
    stripePriceIdMonth: 'price_icon_mo_123',
    stripePriceIdYear: 'price_icon_yr_123',
  },
} as const;

export type SubscriptionTier = keyof typeof TIER_LIMITS;

export function getTierLimits(tier: SubscriptionTier) {
  // Fallback to free if the tier string is invalid
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

export function getTierPricing(tier: SubscriptionTier) {
  return TIER_PRICING[tier] || TIER_PRICING.free;
}

export function canUploadMorePhotos(tier: SubscriptionTier, currentCount: number): boolean {
  const limits = getTierLimits(tier);
  return currentCount < limits.portfolioPhotos;
}

