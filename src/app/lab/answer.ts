// answer.md is the only place the week's answer is written. The site and the README both read it.

const START = "<!-- answer:start -->";
const END = "<!-- answer:end -->";
const NOT_YET = "Ships by Sunday 15 November, 23:59 Paris time.";

export function answerParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/** The README with the answer copied between its markers. */
export function withAnswer(readme: string, answer: string): string {
  const from = readme.indexOf(START);
  const to = readme.indexOf(END);
  if (from < 0 || to < from) throw new Error(`README.md must contain ${START} and ${END}`);
  const text = answerParagraphs(answer).join("\n\n") || NOT_YET;
  return `${readme.slice(0, from)}${START}\n**The answer.** ${text}\n${readme.slice(to)}`;
}
