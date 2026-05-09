import type { Platform } from "../platforms";
import type { Publisher, PublishResult } from "./types";
import type { VariantRow } from "../persist-post";

// Stub publisher used until a platform's real API integration is wired.
// Returns a deterministic mock URL so the publish flow exercises the full
// happy path (status → published, published_url written, etc.) without
// actually posting anywhere. Useful for Kevin demos and end-to-end tests.
export function makeStubPublisher(platform: Platform): Publisher {
  return {
    platform,
    async publish({
      variant,
    }: {
      tenantId: string;
      variant: VariantRow;
      imageUrl?: string | null;
    }): Promise<PublishResult> {
      const seed = variant.id.slice(0, 8);
      return {
        publishedUrl: `https://${platform}.example/posts/${seed}`,
        externalId: `stub_${seed}`,
      };
    },
  };
}
