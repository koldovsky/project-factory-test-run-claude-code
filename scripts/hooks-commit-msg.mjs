// Git commit-msg hook — enforce trace trailers so every commit is linkable.
//
// Rule: a commit that touches feature code (app/, lib/, db/, src/) must carry
// at least one trace reference — either a `Refs:` trailer with FR/NFR/BUG ids
// or a `Slice:` trailer naming the OpenSpec change. Docs/test/chore commits
// are exempt. This makes `git log --grep "FR-24"` a complete audit trail.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const msgFile = process.argv[2];
const msg = readFileSync(msgFile, "utf8");

const staged = execSync("git diff --cached --name-only", { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const touchesFeatureCode = staged.some((f) => /^(app|lib|db|src)\//.test(f) && !/\.(test|spec)\./.test(f));

if (!touchesFeatureCode) process.exit(0);

// Ids follow the PRD scheme PREFIX-CATEGORY-NN (FR-SEARCH-01) or the bare
// PREFIX-NN (BUG-3); the category segment is optional and may contain digits.
const ID = "(FR|NFR|TC|BC|BUG)-([A-Z0-9]+-)?\\d+";
const hasRefs = new RegExp(`^Refs:\\s*(${ID})(,\\s*(${ID}))*\\s*$`, "m").test(msg);
const hasSlice = /^Slice:\s*[a-z0-9-]+\s*$/m.test(msg);

if (!hasRefs && !hasSlice) {
  console.error(
    [
      "commit-msg: this commit touches feature code but has no trace trailer.",
      "Add one (or both) of these lines to the commit message body:",
      "  Slice: add-<capability>",
      "  Refs: FR-12, FR-13",
      "(Use Refs: BUG-<n> for UAT bug fixes.)",
    ].join("\n"),
  );
  process.exit(1);
}
process.exit(0);
