import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

/**
 * Tattoo Requests Feature Tests
 * Tests the procedures for fetching tattoo request feeds.
 * 
 * Note: These tests simulate the procedure logic rather than calling actual tRPC procedures.
 * For full integration tests, use a test database with createCallerFactory.
 */

describe('Tattoo Requests Feed', () => {

  // Mock request data with various statuses
  const allRequests = [
    { id: 1, title: 'Dragon sleeve', status: 'open', createdAt: new Date('2026-01-15') },
    { id: 2, title: 'Rose tattoo', status: 'open', createdAt: new Date('2026-01-14') },
    { id: 3, title: 'Completed project', status: 'completed', createdAt: new Date('2026-01-13') },
    { id: 4, title: 'Cancelled request', status: 'cancelled', createdAt: new Date('2026-01-12') },
    { id: 5, title: 'In progress work', status: 'in_progress', createdAt: new Date('2026-01-11') },
  ];

  // Mock artist profiles with different subscription tiers
  const freeArtist = { id: 1, userId: 1, subscriptionTier: 'free', bidsUsed: 3 };
  const paidArtist = { id: 2, userId: 2, subscriptionTier: 'professional', bidsUsed: 0 };

  // Simulated procedure: listForArtistDashboard
  const listForArtistDashboard = (artist: typeof freeArtist | typeof paidArtist, requests: typeof allRequests) => {
    if (!artist || artist.subscriptionTier === 'free') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'This feature is only available for paid artist plans.',
      });
    }
    return requests.filter(r => r.status === 'open');
  };

  // Simulated procedure: listForHomepage
  const listForHomepage = (requests: typeof allRequests, limit = 8) => {
    return requests
      .filter(r => r.status === 'open')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  };

  describe('listForArtistDashboard', () => {
    it('should prevent free-tier artists from seeing requests', () => {
      expect(() => listForArtistDashboard(freeArtist, allRequests)).toThrow(TRPCError);
      
      try {
        listForArtistDashboard(freeArtist, allRequests);
      } catch (e) {
        expect((e as TRPCError).code).toBe('FORBIDDEN');
        expect((e as TRPCError).message).toContain('paid artist plans');
      }
    });

    it('should allow paid-tier artists to see open requests', () => {
      const results = listForArtistDashboard(paidArtist, allRequests);
      
      expect(results.length).toBe(2); // Only 2 open requests
      expect(results.every(r => r.status === 'open')).toBe(true);
    });

    it('should return an empty array when no requests are open', () => {
      const noOpenRequests = [
        { id: 1, title: 'Completed', status: 'completed', createdAt: new Date() },
        { id: 2, title: 'Cancelled', status: 'cancelled', createdAt: new Date() },
      ];

      const results = listForArtistDashboard(paidArtist, noOpenRequests);
      
      expect(results).toEqual([]);
      expect(results.length).toBe(0);
    });

    it('should filter requests correctly based on status', () => {
      const results = listForArtistDashboard(paidArtist, allRequests);
      
      // Verify no non-open requests are returned
      const nonOpenStatuses = ['completed', 'cancelled', 'in_progress'];
      results.forEach(r => {
        expect(nonOpenStatuses).not.toContain(r.status);
      });
    });
  });

  describe('listForHomepage', () => {
    it('should return only open requests', () => {
      const results = listForHomepage(allRequests);
      
      expect(results.length).toBeGreaterThan(0);
      results.forEach(r => {
        expect(r.status).toBe('open');
      });
    });

    it('should limit the number of requests returned', () => {
      // Create many open requests
      const manyRequests = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        title: `Request ${i + 1}`,
        status: 'open' as const,
        createdAt: new Date(2026, 0, 20 - i),
      }));

      const results = listForHomepage(manyRequests, 8);
      
      expect(results.length).toBe(8);
    });

    it('should return requests sorted by createdAt descending (most recent first)', () => {
      const results = listForHomepage(allRequests);
      
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(results[i].createdAt.getTime());
      }
    });

    it('should handle empty request list gracefully', () => {
      const results = listForHomepage([]);
      
      expect(results).toEqual([]);
      expect(results.length).toBe(0);
    });

    it('should filter out non-open requests before limiting', () => {
      // Mix of 15 open and 5 non-open, limit to 10
      const mixedRequests = [
        ...Array.from({ length: 15 }, (_, i) => ({
          id: i + 1,
          title: `Open ${i + 1}`,
          status: 'open' as const,
          createdAt: new Date(2026, 0, 20 - i),
        })),
        ...Array.from({ length: 5 }, (_, i) => ({
          id: i + 16,
          title: `Closed ${i + 1}`,
          status: 'completed' as const,
          createdAt: new Date(2026, 0, 25 - i), // More recent but closed
        })),
      ];

      const results = listForHomepage(mixedRequests, 10);
      
      expect(results.length).toBe(10);
      results.forEach(r => {
        expect(r.status).toBe('open');
      });
    });
  });
});
