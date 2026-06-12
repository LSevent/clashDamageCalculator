import { describe, expect, it } from "vitest";

import { classifyOfficialPost } from "./update-check-classifier";
import {
  deduplicateOfficialPosts,
  getDetectedPostStatus,
  isAllowedOfficialUpdateSource,
  normalizeOfficialPostUrl,
  parseOfficialBlogArchive,
} from "./update-checker-utils";

describe("official update classification", () => {
  it.each([
    ["May Update", "patch-notes"],
    ["State of Gameplay Part 2", "balance-update"],
    ["Anime Fury Medal Event", "event"],
    ["New Epic Equipment", "equipment"],
    ["A Brand New Spell Arrives", "spell"],
    ["Community Spotlight", "general-news"],
  ] as const)("classifies %s as %s", (title, expected) => {
    expect(classifyOfficialPost(title)).toBe(expected);
  });
});

describe("official update URL handling", () => {
  it("normalizes trailing slashes and removes query fragments", () => {
    const first = normalizeOfficialPostUrl(
      "https://supercell.com/en/games/clashofclans/blog/news/may-update",
    );
    const second = normalizeOfficialPostUrl(
      "https://supercell.com/en/games/clashofclans/blog/news/may-update/?ref=test#top",
    );

    expect(first).toBe(second);
    expect(first).toBe(
      "https://supercell.com/en/games/clashofclans/blog/news/may-update/",
    );
  });

  it("rejects non-official and non-blog URLs", () => {
    expect(
      normalizeOfficialPostUrl("https://example.com/news/update"),
    ).toBeUndefined();
    expect(
      normalizeOfficialPostUrl("https://supercell.com/en/games/"),
    ).toBeUndefined();
  });

  it("allows only the configured official Clash blog archive", () => {
    expect(
      isAllowedOfficialUpdateSource(
        "https://supercell.com/en/games/clashofclans/blog/",
      ),
    ).toBe(true);
    expect(
      isAllowedOfficialUpdateSource(
        "https://supercell.com/en/games/clashofclans/blog/news/may-update/",
      ),
    ).toBe(false);
    expect(
      isAllowedOfficialUpdateSource(
        "https://example.com/en/games/clashofclans/blog/",
      ),
    ).toBe(false);
  });

  it("deduplicates normalized post URLs", () => {
    const post = {
      title: "May Update",
      url: "https://supercell.com/en/games/clashofclans/blog/release-notes/may-update/",
      publishedAt: null,
      detectedType: "patch-notes" as const,
    };

    expect(deduplicateOfficialPosts([post, { ...post }])).toHaveLength(1);
  });
});

describe("official blog archive parser", () => {
  it("extracts article titles, URLs, dates, and deduplicates results", () => {
    const card = `
      <div data-test-class="archived-article">
        <a href="/en/games/clashofclans/blog/release-notes/may-update/">
          <p data-test-id="publish-date-text">26 May 2026</p>
          <div class="archivedArticles_title__abc">May Update</div>
        </a>
      </div>
    `;
    const posts = parseOfficialBlogArchive(
      `${card}${card}`,
      "https://supercell.com/en/games/clashofclans/blog/",
    );

    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({
      title: "May Update",
      detectedType: "patch-notes",
      url: "https://supercell.com/en/games/clashofclans/blog/release-notes/may-update/",
    });
    expect(posts[0]?.publishedAt?.toISOString()).toBe(
      "2026-05-26T00:00:00.000Z",
    );
  });

  it("skips cards without a reliable title", () => {
    const posts = parseOfficialBlogArchive(
      `<div data-test-class="archived-article">
        <a href="/en/games/clashofclans/blog/news/no-title/"></a>
      </div>`,
      "https://supercell.com/en/games/clashofclans/blog/",
    );

    expect(posts).toEqual([]);
  });
});

describe("detected result status", () => {
  it("marks unseen URLs new and known URLs already known", () => {
    expect(getDetectedPostStatus()).toBe("new");
    expect(getDetectedPostStatus("new")).toBe("already-known");
    expect(getDetectedPostStatus("already-known")).toBe("already-known");
  });

  it("preserves ignored status", () => {
    expect(getDetectedPostStatus("ignored")).toBe("ignored");
  });
});
