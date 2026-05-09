import type { Platform } from "../platforms";
import type { Publisher } from "./types";
import { makeStubPublisher } from "./stub";

// Per-platform publisher registry. Today every platform uses the stub
// implementation that returns mock URLs. As real integrations land, swap
// the entry below.
//
// Roadmap:
//   - twitter:   Twitter API v2 (requires Bearer token + per-tenant OAuth1.0a)
//   - linkedin:  LinkedIn Marketing API (requires app review for posting)
//   - instagram: Meta Graph API (requires Business account + page connection)
//   - facebook:  Meta Graph API (same app, different scope)
//   - medium:    Medium API (deprecated for new tokens — likely RSS-driven instead)
const REGISTRY: Record<Platform, Publisher> = {
  twitter: makeStubPublisher("twitter"),
  linkedin: makeStubPublisher("linkedin"),
  instagram: makeStubPublisher("instagram"),
  facebook: makeStubPublisher("facebook"),
  medium: makeStubPublisher("medium"),
};

export function getPublisher(platform: Platform): Publisher {
  return REGISTRY[platform];
}

export function isPlatformReal(_platform: Platform): boolean {
  // Hook for the UI to disambiguate "really posts" vs "stub".
  // Returns false for now — every publisher is stubbed.
  return false;
}
