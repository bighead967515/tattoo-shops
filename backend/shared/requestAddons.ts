export const REQUEST_ADDON_PRICING = {
  priorityListingCents: 299,  // 7-day boost to top of feed
  inAppChatCents: 199,        // unlocks in-app chat for all bids on this request
  aiDesignCents: 299,         // AI concept art generated for the request
  blindBidsCents: 399,        // hides bid amounts from competing artists
} as const;

export const REQUEST_ADDON_PAYMENT_STATUSES = {
  NOT_REQUESTED: "not_requested",
  CHECKOUT_PENDING: "checkout_pending",
  PAID: "paid",
  FAILED: "failed",
} as const;

export type RequestAddonPaymentStatus =
  (typeof REQUEST_ADDON_PAYMENT_STATUSES)[keyof typeof REQUEST_ADDON_PAYMENT_STATUSES];

export type RequestAddon =
  | "priorityListing"
  | "inAppChat"
  | "aiDesign"
  | "blindBids";

// Legacy type kept for any code still referencing it during migration
export type RequestAddonSelection = {
  priorityListing: boolean;
  inAppChat: boolean;
  aiDesign: boolean;
  blindBids: boolean;
};

export function calculateRequestAddonTotalCents(
  addons: RequestAddon[] | RequestAddonSelection | Partial<RequestAddonSelection>
): number {
  const list: RequestAddon[] = Array.isArray(addons)
    ? addons
    : (Object.keys(addons) as (keyof RequestAddonSelection)[]).filter(
        (k) => addons[k]
      ) as RequestAddon[];

  let total = 0;
  for (const addon of list) {
    switch (addon) {
      case "priorityListing":
        total += REQUEST_ADDON_PRICING.priorityListingCents;
        break;
      case "inAppChat":
        total += REQUEST_ADDON_PRICING.inAppChatCents;
        break;
      case "aiDesign":
        total += REQUEST_ADDON_PRICING.aiDesignCents;
        break;
      case "blindBids":
        total += REQUEST_ADDON_PRICING.blindBidsCents;
        break;
    }
  }
  return total;
}
