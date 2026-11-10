import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { answerParagraphs, withAnswer } from "./answer";

describe("the paragraphs of the answer", () => {
  it("are separated by blank lines", () => {
    expect(answerParagraphs("One.\n\nTwo.\n")).toEqual(["One.", "Two."]);
  });

  it("are none for an empty file", () => {
    expect(answerParagraphs("  \n")).toEqual([]);
  });
});

describe("the README's copy of the answer", () => {
  const readme = (inside: string) => `# Title\n\n<!-- answer:start -->\n${inside}\n<!-- answer:end -->\n\nMore.\n`;

  it("replaces what stands between the markers", () => {
    expect(withAnswer(readme("Old."), "Because.\n")).toBe(readme("**The answer.** Because."));
  });

  it("keeps every paragraph", () => {
    expect(withAnswer(readme("Old."), "One.\n\nTwo.\n")).toBe(readme("**The answer.** One.\n\nTwo."));
  });

  it("promises the answer while the file is empty", () => {
    expect(withAnswer(readme("Old."), "")).toBe(readme("**The answer.** Ships by Sunday 15 November, 23:59 Paris time."));
  });

  it("refuses a README that has lost its markers", () => {
    expect(() => withAnswer("# Title\n", "Because.")).toThrow();
  });

  it("matches answer.md in this repository", () => {
    const current = readFileSync("README.md", "utf8");
    expect(withAnswer(current, readFileSync("answer.md", "utf8"))).toBe(current);
  });
});
