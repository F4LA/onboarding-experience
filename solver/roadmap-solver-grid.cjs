#!/usr/bin/env node
'use strict';
/**
 * Grid of 5,940 inputs over the Roadmap Builder solver. Reads only; writes nothing.
 *
 * Usage:  node roadmap-solver-grid.cjs "/path/to/roadmap-solver.js"
 *
 * Reports, over the whole grid:
 *   - how many cases break each of the three invariants
 *       1. plan.end_weight_lb equals the last weekly row
 *       2. no fat_loss block longer than 24 calendar weeks
 *       3. consecutive blocks do not overlap (next.start_day > prev.end_day)
 *   - how many plans carry closed_reason 'absorbed_remainder'
 *   - how many cases fail any of the solver's seven cumulative assertions
 *   - how many fat_loss blocks are shorter than 4 weeks, and where they sit
 * Exit code 1 if any invariant or cumulative assertion fails; 0 otherwise.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
if (!process.argv[2]) { console.error('Usage: node roadmap-solver-grid.cjs "/path/to/solver.js"'); process.exit(2); }
const solverPath = path.resolve(process.argv[2]);
const S = require(solverPath);

let cases = 0, solved = 0, absorbed = 0, cumulativeFail = 0;
const broken = { '1_summary_vs_weekly': 0, '2_ceiling_24': 0, '3_overlap': 0 };
const shortBlocks = {};
const examples = [];

for (const sex of ['male', 'female'])
for (const w of [150, 180, 212, 250, 300])
for (const bf of [18, 22, 26, 30, 35, 40])
for (const gbf of [10, 12, 15, 17, 20, 25])
for (const r1 of [[0.4, 0.6], [0.6, 0.8], [0.8, 1.0]])
for (const mg of [false, true])
for (const fw of [4, 6, 10]) {
  if (gbf >= bf) continue;
  cases++;
  const input = {
    record: { sex, age_at_submission: 40, height_in: 70, weight_lb: w, body_fat_pct: bf,
              goal_body_fat_pct: gbf, activity_level_selected: 'Sedentary', habits: {}, priorities: [] },
    answers: { start_date_iso: '2026-09-27', foundational_weeks: fw, activity_factor_name: 'Light Activity',
               rate_range_1_low_pct: r1[0], rate_range_1_high_pct: r1[1], muscle_growth: mg,
               muscle_growth_weeks: 24, rate_range_2_low_pct: 0.4, rate_range_2_high_pct: 0.6 }
  };
  const T = S.solve(input);
  if (!T.blocks) continue;
  solved++;
  const last = T.weekly[T.weekly.length - 1];
  const b1 = T.display['plan.end_weight_lb'] !== S._internal.fixed(last.target_lb, 1);
  const b2 = T.blocks.some(b => b.type === 'fat_loss' && b.calendar_weeks > 24);
  const b3 = T.blocks.some((b, i) => i > 0 && !(b.start_day > T.blocks[i - 1].end_day));
  if (b1) broken['1_summary_vs_weekly']++;
  if (b2) broken['2_ceiling_24']++;
  if (b3) broken['3_overlap']++;
  if ((b1 || b2 || b3) && examples.length < 3) examples.push(input);
  if (T.blocks.some(b => b.closed_reason === 'absorbed_remainder')) absorbed++;
  if (S.runCumulativeAssertions(T).some(a => a.status === 'FAIL')) cumulativeFail++;
  T.blocks.forEach((b, i) => {
    if (b.type === 'fat_loss' && b.calendar_weeks < 4) {
      const where = i === 0 ? 'first block of the plan' : 'after ' + T.blocks[i - 1].type;
      const k = where + ', ' + b.calendar_weeks + ' weeks';
      shortBlocks[k] = (shortBlocks[k] || 0) + 1;
    }
  });
}

const anyFail = broken['1_summary_vs_weekly'] + broken['2_ceiling_24'] + broken['3_overlap'] + cumulativeFail > 0;
console.log(JSON.stringify({
  solver_version: S.VERSION,
  solver_sha256: crypto.createHash('sha256').update(fs.readFileSync(solverPath)).digest('hex'),
  cases, solved,
  invariant_failures: broken,
  plans_with_absorbed_remainder: absorbed,
  cases_failing_a_cumulative_assertion: cumulativeFail,
  fat_loss_blocks_under_4_weeks: shortBlocks,
  first_failing_inputs: examples,
  all_pass: !anyFail
}, null, 2));
process.exitCode = anyFail ? 1 : 0;
