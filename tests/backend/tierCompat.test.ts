import { describe, expect, it } from "vitest";
import {
  canUseAiBidAssistant,
  isFreeArtistTier,
  isFreeClientTier,
  toLegacyArtistTier,
} from "@shared/tierCompat";

describe("tier compatibility helpers", () => {
  it("treats client_free as free for DesignLab gating", () => {
    expect(isFreeClientTier("client_free")).toBe(true);
    expect(isFreeClientTier("client_plus")).toBe(false);
    expect(isFreeClientTier("client_elite")).toBe(false);
  });

  it("supports canonical and legacy free artist tiers", () => {
    expect(isFreeArtistTier("artist_free")).toBe(true);
    expect(isFreeArtistTier("free")).toBe(true);
    expect(isFreeArtistTier("artist_pro")).toBe(false);
  });

  it("allows AI bid assistant for amateur/icon canonical and legacy tiers", () => {
    expect(canUseAiBidAssistant("artist_paygo")).toBe(true);
    expect(canUseAiBidAssistant("artist_elite")).toBe(true);
    expect(canUseAiBidAssistant("amateur")).toBe(true);
    expect(canUseAiBidAssistant("frontPage")).toBe(true);
    expect(canUseAiBidAssistant("artist_pro")).toBe(true);
    expect(canUseAiBidAssistant("professional")).toBe(true);
    expect(canUseAiBidAssistant("artist_free")).toBe(false);
  });

  it("maps canonical artist tiers to legacy pricing keys", () => {
    expect(toLegacyArtistTier("artist_free")).toBe("free");
    expect(toLegacyArtistTier("artist_paygo")).toBe("amateur");
    expect(toLegacyArtistTier("artist_pro")).toBe("professional");
    expect(toLegacyArtistTier("artist_elite")).toBe("frontPage");
  });
});
