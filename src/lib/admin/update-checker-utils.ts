import { classifyOfficialPost } from "@/src/lib/admin/update-check-classifier";
import type {
  OfficialPostCandidate,
  UpdateResultStatus,
} from "@/src/types/admin-update-check";

const officialHost = "supercell.com";
const officialBlogPath = "/en/games/clashofclans/blog/";
const monthNumbers: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([\da-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&ndash;/gi, "-")
    .replace(/&mdash;/gi, "-")
    .replace(/&hellip;/gi, "...");
}

function plainText(value: string) {
  return decodeHtmlEntities(value.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function parseOfficialDate(value: string) {
  const match = plainText(value).match(
    /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/,
  );

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = monthNumbers[match[2]!.toLowerCase()];
  const year = Number(match[3]);

  if (month === undefined || day < 1 || day > 31) {
    return null;
  }

  const date = new Date(Date.UTC(year, month, day));

  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeOfficialPostUrl(
  value: string,
  sourceUrl = `https://${officialHost}${officialBlogPath}`,
) {
  let url: URL;

  try {
    url = new URL(value, sourceUrl);
  } catch {
    return undefined;
  }

  if (
    url.protocol !== "https:" ||
    url.hostname !== officialHost ||
    !url.pathname.startsWith(officialBlogPath) ||
    url.pathname === officialBlogPath
  ) {
    return undefined;
  }

  url.search = "";
  url.hash = "";
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/`;

  return url.toString();
}

export function isAllowedOfficialUpdateSource(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === officialHost &&
      url.pathname === officialBlogPath
    );
  } catch {
    return false;
  }
}

export function deduplicateOfficialPosts(
  posts: readonly OfficialPostCandidate[],
) {
  const unique = new Map<string, OfficialPostCandidate>();

  for (const post of posts) {
    if (!unique.has(post.url)) {
      unique.set(post.url, post);
    }
  }

  return [...unique.values()];
}

export function parseOfficialBlogArchive(
  html: string,
  sourceUrl: string,
): OfficialPostCandidate[] {
  const cardPattern =
    /<div\b[^>]*data-test-class=["']archived-article["'][^>]*>([\s\S]*?)(?=<div\b[^>]*data-test-class=["']archived-article["']|$)/gi;
  const posts: OfficialPostCandidate[] = [];

  for (const match of html.matchAll(cardPattern)) {
    const card = match[1] ?? "";
    const href = card.match(/<a\b[^>]*href=["']([^"']+)["']/i)?.[1];
    const titleMarkup = card.match(
      /<div\b[^>]*class=["'][^"']*archivedArticles_title[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    )?.[1];
    const dateMarkup = card.match(
      /<[^>]*data-test-id=["']publish-date-text["'][^>]*>([\s\S]*?)<\/[^>]+>/i,
    )?.[1];

    if (!href || !titleMarkup) {
      continue;
    }

    const url = normalizeOfficialPostUrl(href, sourceUrl);
    const title = plainText(titleMarkup);

    if (!url || !title) {
      continue;
    }

    posts.push({
      title,
      url,
      publishedAt: dateMarkup ? parseOfficialDate(dateMarkup) : null,
      detectedType: classifyOfficialPost(title, url),
    });
  }

  return deduplicateOfficialPosts(posts);
}

export function getDetectedPostStatus(
  existingStatus?: UpdateResultStatus,
): UpdateResultStatus {
  if (!existingStatus) {
    return "new";
  }

  return existingStatus === "ignored" ? "ignored" : "already-known";
}
