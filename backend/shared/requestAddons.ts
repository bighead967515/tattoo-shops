export const REQUEST_ADDON_PRICING = {
  priorityPlacementCents: 499,
  preBookingChatCents: 999,
  aiPriceEstimateCents: 299,
  incognitoModeCents: 299,
  conceptArtistCents: 499,
  perfectMatchRouterCents: 399,
  painAnalysisCents: 99,
  vipBundleCents: 1999, // Discounted bundle of all
} as const;

export const REQUEST_ADDON_PAYMENT_STATUSES = {
  NOT_REQUESTED: "not_requested",
  CHECKOUT_PENDING: "checkout_pending",
  PAID: "paid",
  FAILED: "failed",
} as const;

export type RequestAddonPaymentStatus =
  (typeof REQUEST_ADDON_PAYMENT_STATUSES)[keyof typeof REQUEST_ADDON_PAYMENT_STATUSES];

export type RequestAddonSelection = {
  priorityPlacement: boolean;
  preBookingChat: boolean;
  aiPriceEstimate: boolean;
  incognitoMode: boolean;
  conceptArtist: boolean;
  perfectMatchRouter: boolean;
  painAnalysis: boolean;
  vipBundle: boolean;
};

export function calculateRequestAddonTotalCents(selection: RequestAddonSelection): number {
  if (selection.vipBundle) {
    return REQUEST_ADDON_PRICING.vipBundleCents;
  }

  let total = 0;
  if (selection.priorityPlacement) total += REQUEST_ADDON_PRICING.priorityPlacementCents;
  if (selection.preBookingChat) total += REQUEST_ADDON_PRICING.preBookingChatCents;
  if (selection.aiPriceEstimate) total += REQUEST_ADDON_PRICING.aiPriceEstimateCents;
  if (selection.incognitoMode) total += REQUEST_ADDON_PRICING.incognitoModeCents;
  if (selection.conceptArtist) total += REQUEST_ADDON_PRICING.conceptArtistCents;
  if (selection.perfectMatchRouter) total += REQUEST_ADDON_PRICING.perfectMatchRouterCents;
  if (selection.painAnalysis) total += REQUEST_ADDON_PRICING.painAnalysisCents;
  
  return total;
}
