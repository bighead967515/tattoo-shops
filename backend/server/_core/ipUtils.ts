import ipaddr from "ipaddr.js";

/**
 * Checks if an IP address is private, loopback, or otherwise reserved/dangerous.
 * Used to prevent SSRF attacks.
 *
 * Correctly handles:
 * - IPv4
 * - IPv6 (canonical, compressed, IPv4-mapped, IPv4-compatible)
 */
export function isPrivateIP(ip: string): boolean {
  try {
    // Parse and normalize the IP address
    const addr = ipaddr.process(ip);

    // Get the range classification
    const range = addr.range();

    // Ranges that should be blocked for SSRF protection
    const blockedRanges = [
      "private", // 10.x, 172.16-31.x, 192.168.x
      "loopback", // 127.x, ::1
      "linkLocal", // 169.254.x, fe80::/10
      "uniqueLocal", // fc00::/7
      "unspecified", // 0.0.0.0, ::
      "broadcast", // 255.255.255.255
      "carrierGradeNat", // 100.64.0.0/10
      "reserved", // various reserved ranges
    ];

    return blockedRanges.includes(range);
  } catch (e) {
    // If parsing fails, fall back to blocking (security-first approach)
    return true;
  }
}

/**
 * Robust check if string is a valid IP address (v4 or v6)
 * Uses ipaddr.js for validation instead of regex
 */
export function isIpAddress(ip: string): boolean {
  return ipaddr.isValid(ip);
}
