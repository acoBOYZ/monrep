export type RequireMatchRule = string | RegExp | ((value: string) => boolean);

export function matchesRule(value: string, rule?: RequireMatchRule) {
  if (!rule) return true;

  if (typeof rule === "string") {
    return value === rule;
  }

  if (rule instanceof RegExp) {
    const regex = new RegExp(rule.source, rule.flags);
    return regex.test(value);
  }

  return rule(value);
}
