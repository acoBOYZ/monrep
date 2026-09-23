export function exitIfCi(message = "CI detected, skipping update.") {
  if (!process.env.CI) return;
  console.log(message);
  process.exit(0);
}
