/**
 * Guards the substitution library: every option must match its own group's
 * regex, must not be a banned movement, and must classify back to the group
 * it is listed under. A miss here would silently move weekly volume between
 * dashboard buckets.
 */
import { SUBSTITUTION_GROUPS, classifyExercise } from '../src/lib/substitutions';
import { AVOID_PATTERNS } from '../functions/_shared/feminization';

let failures = 0;
let checked = 0;

for (const group of SUBSTITUTION_GROUPS) {
  for (const option of group.options) {
    checked++;
    const fails: string[] = [];

    if (!group.pattern.test(option.name)) {
      fails.push(`does not match ${group.key} pattern ${group.pattern}`);
    }
    if (AVOID_PATTERNS.test(option.name)) {
      fails.push('matches AVOID_PATTERNS');
    }
    const back = classifyExercise(option.name);
    if (back?.key !== group.key) {
      fails.push(`classifies as "${back?.key ?? 'none'}", not "${group.key}"`);
    }

    if (fails.length) {
      failures++;
      console.error(`FAIL  ${group.key.padEnd(16)} ${option.name}`);
      for (const f of fails) console.error(`        - ${f}`);
    }
  }
}

console.log(`\nchecked ${checked} substitutes across ${SUBSTITUTION_GROUPS.length} groups`);
if (failures > 0) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
console.log('all substitutes classify correctly');
