
import { render, screen } from "@testing-library/react";
import ArtistProfile from "./ArtistProfile";
import { TIER_LIMITS } from "../../../shared/tierLimits";
import { vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    artists: {
      getById: {
        useQuery: (id: any) => ({
          data: {
            id: 1,
            shopName: "Test Shop",
            bio: "Test Bio",
            specialties: "Test Specialties",
            styles: "Test Styles",
            experience: 5,
            address: "Test Address",
            city: "Test City",
            state: "Test State",
            zipCode: "Test Zip",
            phone: "Test Phone",
            website: "Test Website",
            instagram: "Test Instagram",
            facebook: "Test Facebook",
            lat: "0",
            lng: "0",
            averageRating: "4.5",
            totalReviews: 10,
            isApproved: 1,
            subscriptionTier: "free",
          },
          isLoading: false,
        }),
      },
    },
    reviews: {
      getByArtistId: {
        useQuery: (id: any) => ({
          data: [],
          isLoading: false,
        }),
      },
    },
    portfolio: {
      get: {
        useQuery: (id: any) => ({
          data: [],
          isLoading: false,
        }),
      },
    },
  },
}));

describe("ArtistProfile", () => {
  it("should not show booking button for free tier artists", () => {
    render(<ArtistProfile params={{ id: "1" }} />);
    expect(
      screen.queryByText("Upgrade to Enable Booking")
    ).toBeInTheDocument();
    expect(screen.queryByText("Book Now")).not.toBeInTheDocument();
  });

  it("should not show direct contact info for free tier artists", () => {
    render(<ArtistProfile params={{ id: "1" }} />);
    expect(screen.queryByText("Upgrade to View")).toBeInTheDocument();
    expect(screen.queryByText("Test Phone")).not.toBeInTheDocument();
    expect(screen.queryByText("Test Website")).not.toBeInTheDocument();
  });

  it("should limit portfolio images for free tier artists", () => {
    // @ts-ignore
    vi.spyOn(trpc.portfolio, "get").mockImplementation(() => ({
      data: [
        { id: 1, imageUrl: "test1.jpg" },
        { id: 2, imageUrl: "test2.jpg" },
        { id: 3, imageUrl: "test3.jpg" },
        { id: 4, imageUrl: "test4.jpg" },
      ],
      isLoading: false,
    }));
    render(<ArtistProfile params={{ id: "1" }} />);
    expect(screen.getAllByRole("img")).toHaveLength(TIER_LIMITS.free.portfolioPhotos);
  });
});
