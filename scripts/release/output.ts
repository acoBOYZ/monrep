import { writeFileSync } from "node:fs";

/**
 * Output sink when stdout may be noisy. Write to the file named by `envVar`
 * when set; otherwise print to stdout for local runs.
 */
export function writeOutput({ envVar, content }: { envVar: string; content: string }) {
  const outFile = process.env[envVar];
  if (outFile) {
    writeFileSync(outFile, content);
  } else {
    console.log(content);
  }
}
