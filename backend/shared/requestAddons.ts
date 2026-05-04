export const REQUEST_ADDON_PRICING = {
  priorityBoostCents: 199,
  featuredBadgeCents: 99,
  directMessageCreditCents: 49,
  directMessageBundleCount: 5,
  directMessageBundleCents: 199,
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
  priorityBoost: boolean;
  featuredBadge: boolean;
  directMessageCredits: number;
};

export function clampDirectMessageCredits(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(20, Math.floor(value)));
}

export function calculateRequestAddonTotalCents(selection: RequestAddonSelection): number {
  const credits = clampDirectMessageCredits(selection.directMessageCredits);
  return (
    (selection.priorityBoost ? REQUEST_ADDON_PRICING.priorityBoostCents : 0) +
    (selection.featuredBadge ? REQUEST_ADDON_PRICING.featuredBadgeCents : 0) +
    credits * REQUEST_ADDON_PRICING.directMessageCreditCents
  );
}
