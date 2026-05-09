import { getPublisher } from "./publishers";
import {
  PlatformNotConfiguredError,
} from "./publishers/types";
import {
  getVariant,
  markVariantPublished,
  markVariantFailed,
  type VariantRow,
} from "./persist-post";
import { isValidPlatform } from "./platforms";

export async function publishVariant(args: {
  tenantId: string;
  variantId: string;
  imageUrl?: string | null;
}): Promise<{ ok: true; variant: VariantRow } | { ok: false; error: string }> {
  const variant = await getVariant(args.variantId);
  if (!variant) return { ok: false, error: "variant_not_found" };
  if (variant.tenant_id !== args.tenantId)
    return { ok: false, error: "tenant_mismatch" };
  if (variant.status === "published")
    return { ok: false, error: "already_published" };
  if (!isValidPlatform(variant.platform))
    return { ok: false, error: `unknown_platform:${variant.platform}` };

  const publisher = getPublisher(variant.platform);
  try {
    const result = await publisher.publish({
      tenantId: args.tenantId,
      variant,
      imageUrl: args.imageUrl,
    });
    const updated = await markVariantPublished({
      variantId: variant.id,
      publishedUrl: result.publishedUrl,
      externalId: result.externalId,
    });
    return { ok: true, variant: updated };
  } catch (e) {
    const msg =
      e instanceof PlatformNotConfiguredError
        ? `platform_not_configured:${variant.platform}`
        : (e as Error).message;
    await markVariantFailed({ variantId: variant.id, error: msg });
    return { ok: false, error: msg };
  }
}
