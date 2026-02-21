/**
 * Backfill script: Create asset records for existing S3 files that lack them.
 *
 * Scans:
 *   1. tools.thumbnail → storageKeys in public bucket
 *   2. banners.thumbnail → full URLs or storageKeys in public bucket
 *   3. studio_generations.images → storageKeys in admin bucket
 *
 * Uses ON CONFLICT DO NOTHING on (bucket, storageKey) to skip duplicates.
 * Uses S3 HeadObject to verify existence and get size/content-type.
 *
 * Usage:
 *   bun run packages/database/scripts/backfill-assets.ts
 */

import 'dotenv/config';
import { db, tools, banners, studioGenerations, assets, users } from '../src';
import { isNull, isNotNull, eq, or } from 'drizzle-orm';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { ASSET_VISIBILITY, ASSET_MODULE } from '@funmagic/shared';

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT!,
  region: process.env.S3_REGION!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET_PUBLIC = process.env.S3_BUCKET_PUBLIC!;
const BUCKET_ADMIN = process.env.S3_BUCKET_ADMIN!;
const CDN_BASE_URL = process.env.CDN_BASE_URL ?? '';

interface HeadResult {
  size: number;
  contentType: string;
}

async function headObject(bucket: string, key: string): Promise<HeadResult | null> {
  try {
    const result = await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return {
      size: result.ContentLength ?? 0,
      contentType: result.ContentType ?? 'application/octet-stream',
    };
  } catch {
    return null;
  }
}

/**
 * Extract storageKey from a banner thumbnail value.
 * It may be a full CDN URL or already a storageKey.
 */
function extractStorageKey(thumbnail: string): string | null {
  if (!thumbnail) return null;

  // Already a storageKey (no http prefix)
  if (!thumbnail.startsWith('http')) return thumbnail;

  // Strip CDN base URL prefix
  if (CDN_BASE_URL && thumbnail.startsWith(CDN_BASE_URL)) {
    return thumbnail.slice(CDN_BASE_URL.length + 1); // +1 for the /
  }

  // Strip S3 endpoint + bucket prefix
  const s3Prefix = `${process.env.S3_ENDPOINT}/${BUCKET_PUBLIC}/`;
  if (thumbnail.startsWith(s3Prefix)) {
    return thumbnail.slice(s3Prefix.length);
  }

  // Can't extract storageKey from unknown URL format
  return null;
}

async function getBackfillUserId(): Promise<string> {
  // Find the first admin or super_admin user
  const adminUser = await db.query.users.findFirst({
    where: or(eq(users.role, 'admin'), eq(users.role, 'super_admin')),
  });

  if (!adminUser) {
    throw new Error('No admin user found for backfill. Create an admin user first.');
  }

  console.log(`Using admin user "${adminUser.name}" (${adminUser.id}) for backfill records`);
  return adminUser.id;
}

async function backfillToolThumbnails(fallbackUserId: string) {
  console.log('\n--- Backfilling tool thumbnails ---');

  const toolsWithThumbnails = await db.query.tools.findMany({
    where: isNotNull(tools.thumbnail),
    columns: { id: true, thumbnail: true },
  });

  let created = 0;
  let skipped = 0;
  let notFound = 0;

  for (const tool of toolsWithThumbnails) {
    const storageKey = tool.thumbnail!;
    if (!storageKey || storageKey.startsWith('http')) {
      skipped++;
      continue;
    }

    const head = await headObject(BUCKET_PUBLIC, storageKey);
    if (!head) {
      console.warn(`  [SKIP] S3 file not found: ${storageKey}`);
      notFound++;
      continue;
    }

    try {
      await db.insert(assets).values({
        userId: fallbackUserId,
        storageKey,
        bucket: BUCKET_PUBLIC,
        filename: storageKey.split('/').pop() ?? storageKey,
        mimeType: head.contentType,
        size: head.size,
        visibility: ASSET_VISIBILITY.PUBLIC,
        module: ASSET_MODULE.TOOLS,
      }).onConflictDoNothing();
      created++;
    } catch (e) {
      console.warn(`  [ERROR] Failed to insert asset for tool ${tool.id}: ${e}`);
    }
  }

  console.log(`  Tools: ${created} created, ${skipped} skipped, ${notFound} not found in S3`);
}

async function backfillBannerThumbnails(fallbackUserId: string) {
  console.log('\n--- Backfilling banner thumbnails ---');

  const allBanners = await db.query.banners.findMany({
    where: isNull(banners.deletedAt),
    columns: { id: true, thumbnail: true },
  });

  let created = 0;
  let skipped = 0;
  let notFound = 0;

  for (const banner of allBanners) {
    const storageKey = extractStorageKey(banner.thumbnail);
    if (!storageKey) {
      console.warn(`  [SKIP] Cannot extract storageKey from: ${banner.thumbnail}`);
      skipped++;
      continue;
    }

    const head = await headObject(BUCKET_PUBLIC, storageKey);
    if (!head) {
      console.warn(`  [SKIP] S3 file not found: ${storageKey}`);
      notFound++;
      continue;
    }

    try {
      await db.insert(assets).values({
        userId: fallbackUserId,
        storageKey,
        bucket: BUCKET_PUBLIC,
        filename: storageKey.split('/').pop() ?? storageKey,
        mimeType: head.contentType,
        size: head.size,
        visibility: ASSET_VISIBILITY.PUBLIC,
        module: ASSET_MODULE.BANNERS,
      }).onConflictDoNothing();
      created++;
    } catch (e) {
      console.warn(`  [ERROR] Failed to insert asset for banner ${banner.id}: ${e}`);
    }
  }

  console.log(`  Banners: ${created} created, ${skipped} skipped, ${notFound} not found in S3`);
}

async function backfillStudioGenerations(fallbackUserId: string) {
  console.log('\n--- Backfilling studio generation images ---');

  const messagesWithImages = await db.query.studioGenerations.findMany({
    where: isNotNull(studioGenerations.images),
    columns: { id: true, images: true },
    with: {
      project: { columns: { adminId: true } },
    },
  });

  let created = 0;
  let skipped = 0;
  let notFound = 0;

  for (const msg of messagesWithImages) {
    const images = msg.images;
    if (!images || !Array.isArray(images)) continue;

    const userId = msg.project?.adminId ?? fallbackUserId;

    for (const img of images) {
      const storageKey = img.storageKey;
      if (!storageKey) {
        skipped++;
        continue;
      }

      const head = await headObject(BUCKET_ADMIN, storageKey);
      if (!head) {
        console.warn(`  [SKIP] S3 file not found in admin bucket: ${storageKey}`);
        notFound++;
        continue;
      }

      try {
        await db.insert(assets).values({
          userId,
          storageKey,
          bucket: BUCKET_ADMIN,
          filename: storageKey.split('/').pop() ?? storageKey,
          mimeType: head.contentType,
          size: head.size,
          visibility: ASSET_VISIBILITY.ADMIN_PRIVATE,
          module: ASSET_MODULE.STUDIO,
        }).onConflictDoNothing();
        created++;
      } catch (e) {
        console.warn(`  [ERROR] Failed to insert asset for message ${msg.id}: ${e}`);
      }
    }
  }

  console.log(`  Studio generations: ${created} created, ${skipped} skipped, ${notFound} not found in S3`);
}

async function main() {
  console.log('=== Asset Backfill Script ===');
  console.log(`S3 Endpoint: ${process.env.S3_ENDPOINT}`);
  console.log(`Public Bucket: ${BUCKET_PUBLIC}`);
  console.log(`Admin Bucket: ${BUCKET_ADMIN}`);

  const fallbackUserId = await getBackfillUserId();

  await backfillToolThumbnails(fallbackUserId);
  await backfillBannerThumbnails(fallbackUserId);
  await backfillStudioGenerations(fallbackUserId);

  console.log('\n=== Backfill complete ===');
  process.exit(0);
}

main().catch((e) => {
  console.error('Backfill failed:', e);
  process.exit(1);
});
