/**
 * Stripe Products and Prices
 * Define your products and prices here for centralized management
 */

export const PRODUCTS = {
  BOOKING_DEPOSIT: {
    name: "Tattoo Booking Deposit",
    description: "Refundable deposit to secure your tattoo appointment",
    priceInCents: 5000, // $50.00
    currency: "usd",
  },
} as const;

export type ProductKey = keyof typeof PRODUCTS;
