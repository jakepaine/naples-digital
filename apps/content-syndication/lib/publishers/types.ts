import type { Platform } from "../platforms";
import type { VariantRow } from "../persist-post";

export interface PublishResult {
  publishedUrl: string;
  externalId?: string;
}

export interface Publisher {
  platform: Platform;
  publish(args: {
    tenantId: string;
    variant: VariantRow;
    imageUrl?: string | null;
  }): Promise<PublishResult>;
}

export class PlatformNotConfiguredError extends Error {
  constructor(platform: Platform, tenantId: string) {
    super(
      `Tenant ${tenantId} has no ${platform} integration. Connect via /integrations/${platform}.`,
    );
    this.name = "PlatformNotConfiguredError";
  }
}
