export const SEEDED_CLIENT_USER = {
  id: 2001,
  role: "client",
  subscriptionTier: "client_plus",
};

export const SEEDED_REQUEST_ID = 101;

const baseRequest = {
  id: SEEDED_REQUEST_ID,
  clientId: 9001,
  title: "Phoenix sleeve with geometric accents",
  description:
    "Looking for a full sleeve phoenix concept with geometric fillers and black/grey shading.",
  style: "Blackwork",
  placement: "Full Sleeve",
  size: "Large",
  colorPreference: "black_and_grey",
  budgetMin: 120000,
  budgetMax: 220000,
  preferredCity: "Austin",
  preferredState: "TX",
  willingToTravel: true,
  desiredTimeframe: "Within 2 months",
  status: "open",
  selectedBidId: null,
  viewCount: 12,
  createdAt: "2026-03-30T10:00:00.000Z",
  updatedAt: "2026-03-30T10:00:00.000Z",
  expiresAt: null,
  client: {
    id: 9001,
    userId: SEEDED_CLIENT_USER.id,
    displayName: "Fixture Client",
    subscriptionTier: "client_plus",
  },
  images: [
    {
      id: 7001,
      requestId: SEEDED_REQUEST_ID,
      imageUrl: "https://example.com/reference-1.jpg",
      isMainImage: true,
      caption: "Primary inspiration",
      createdAt: "2026-03-30T10:00:00.000Z",
    },
  ],
};

export function buildSeededRequestDetail(accepted: boolean) {
  return {
    ...baseRequest,
    status: accepted ? "in_progress" : "open",
    selectedBidId: accepted ? 501 : null,
    bids: [
      {
        id: 501,
        requestId: SEEDED_REQUEST_ID,
        artistId: 301,
        priceEstimate: 185000,
        estimatedHours: 24,
        message: "I can start with a custom phoenix sketch and stage sessions over 4 weekends.",
        availableDate: "2026-04-12T00:00:00.000Z",
        portfolioLinks: null,
        status: accepted ? "accepted" : "pending",
        createdAt: "2026-03-30T12:00:00.000Z",
        updatedAt: "2026-03-30T12:00:00.000Z",
        artist: {
          id: 301,
          userId: 4301,
          shopName: "Golden Needle",
          averageRating: "4.9",
        },
      },
      {
        id: 502,
        requestId: SEEDED_REQUEST_ID,
        artistId: 302,
        priceEstimate: 172000,
        estimatedHours: 22,
        message: "I specialize in blackwork sleeves and can finalize linework in two sessions.",
        availableDate: "2026-04-20T00:00:00.000Z",
        portfolioLinks: null,
        status: accepted ? "rejected" : "pending",
        createdAt: "2026-03-30T13:00:00.000Z",
        updatedAt: "2026-03-30T13:00:00.000Z",
        artist: {
          id: 302,
          userId: 4302,
          shopName: "Ink Haven",
          averageRating: "4.7",
        },
      },
    ],
  };
}
