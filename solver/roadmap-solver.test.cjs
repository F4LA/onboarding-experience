'use strict';
/**
 * Permanent tests for the Roadmap Builder solver.
 *
 * Run:   node --test roadmap-solver.test.cjs
 * The solver is looked for next to this file as roadmap-solver-1.3.js.
 * Point it elsewhere with:  SOLVER_PATH=/path/to/solver.js node --test roadmap-solver.test.cjs
 *
 * Three invariants, checked on every case below:
 *   1. plan.end_weight_lb equals the last row of the weekly series
 *   2. no 'fat_loss' block is longer than FAT_LOSS_BLOCK_MAX_CALENDAR_WEEKS (24)
 *   3. consecutive blocks do not overlap: next.start_day > prev.end_day
 * Cases: the reproduction case, the Maya Reed fixture, and a grid of 5,940 inputs.
 * The seven cumulative assertions inside the solver are only READ here, never changed.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const SOLVER_PATH = process.env.SOLVER_PATH
  ? path.resolve(process.env.SOLVER_PATH)
  : path.join(__dirname, 'roadmap-solver-1.3.js');
const S = require(SOLVER_PATH);

const FAT_LOSS_BLOCK_MAX_CALENDAR_WEEKS = 24; // mirrors the solver's constant

function invariantFailures(T) {
  const out = [];
  const last = T.weekly[T.weekly.length - 1];
  const summary = T.display['plan.end_weight_lb'];
  const weekly = S._internal.fixed(last.target_lb, 1);
  if (summary !== weekly) {
    out.push('1. plan.end_weight_lb ' + summary + ' != last weekly row ' + weekly);
  }
  for (const b of T.blocks) {
    if (b.type === 'fat_loss' && b.calendar_weeks > FAT_LOSS_BLOCK_MAX_CALENDAR_WEEKS) {
      out.push('2. fat_loss block of ' + b.calendar_weeks + ' weeks (' + b.closed_reason + ')');
    }
  }
  for (let i = 1; i < T.blocks.length; i++) {
    const prev = T.blocks[i - 1], next = T.blocks[i];
    if (!(next.start_day > prev.end_day)) {
      out.push('3. ' + next.type + ' starts ' + next.start_date_iso + ' inside ' + prev.type + ' ending ' + prev.end_date_iso);
    }
  }
  return out;
}

const REPRO_INPUT = {
  record: {
    weight_lb: 212, body_fat_pct: 26, goal_body_fat_pct: 17, goal_weight_lb: 186,
    height_in: 70, age_at_submission: 45, sex: 'male', activity_level_selected: 'Light Activity',
    habits: {
      protein: 'Most or almost all meals', produce_vegetables: 'Rarely or almost never',
      produce_fruit: 'Rarely or almost never', meal_schedule: 'Very consistent',
      sleep_routine: 'Very consistent', daily_steps: 'Under 5,000'
    },
    priorities: [{ habit_key: 'steps' }, { habit_key: 'produce_vegetables' }, { habit_key: 'protein' }]
  },
  answers: {
    start_date_iso: '2026-09-27', foundational_weeks: 6, activity_factor_name: 'Light Activity',
    rate_range_1_low_pct: 0.4, rate_range_1_high_pct: 0.6, muscle_growth: false,
    training_days_per_week: 3, training_split: 'Full body', training_objective: 'Coach supplied',
    training_open_field: ''
  }
};

const MAYA_INPUT = {
  record: {
    sex: 'female', age_at_submission: 37, height_in: 70, weight_lb: 212, body_fat_pct: 26,
    goal_weight_lb: 180, goal_body_fat_pct: 15, activity_level_selected: 'Sedentary',
    habits: {}, priorities: []
  },
  answers: {
    start_date_iso: '2026-09-27', foundational_weeks: 10, activity_factor_name: 'Light Activity',
    rate_range_1_low_pct: 0.6, rate_range_1_high_pct: 0.8, muscle_growth: true, muscle_growth_weeks: 24,
    rate_range_2_low_pct: 0.4, rate_range_2_high_pct: 0.6, maintenance_weeks_4: 2
  }
};

function gridInputs() {
  const out = [];
  for (const sex of ['male', 'female'])
  for (const w of [150, 180, 212, 250, 300])
  for (const bf of [18, 22, 26, 30, 35, 40])
  for (const gbf of [10, 12, 15, 17, 20, 25])
  for (const r1 of [[0.4, 0.6], [0.6, 0.8], [0.8, 1.0]])
  for (const mg of [false, true])
  for (const fw of [4, 6, 10]) {
    if (gbf >= bf) continue;
    out.push({
      record: { sex, age_at_submission: 40, height_in: 70, weight_lb: w, body_fat_pct: bf,
                goal_body_fat_pct: gbf, activity_level_selected: 'Sedentary', habits: {}, priorities: [] },
      answers: { start_date_iso: '2026-09-27', foundational_weeks: fw, activity_factor_name: 'Light Activity',
                 rate_range_1_low_pct: r1[0], rate_range_1_high_pct: r1[1], muscle_growth: mg,
                 muscle_growth_weeks: 24, rate_range_2_low_pct: 0.4, rate_range_2_high_pct: 0.6 }
    });
  }
  return out;
}

test('reproduction case: the three invariants hold', () => {
  const T = S.solve(REPRO_INPUT);
  assert.deepEqual(invariantFailures(T), []);
  assert.ok(T.blocks.every(b => b.closed_reason !== 'absorbed_remainder'));
});

test('Maya Reed fixture: the three invariants hold and the figures do not move', () => {
  const T = S.solve(MAYA_INPUT);
  assert.deepEqual(invariantFailures(T), []);
  assert.equal(T.plan.total_weeks, 86);
  assert.equal(T.display['lifestyle.end_weight_lb'], '185.6');
  assert.equal(T.display['lifestyle.end_body_fat_pct'], '14.9');
});

test('startupCheck: ok, six of six', () => {
  const sc = S.startupCheck();
  assert.equal(sc.ok, true);
  assert.equal(sc.points.length, 6);
  assert.equal(sc.points.filter(p => p.pass).length, 6);
});

test('grid of 5,940 cases: the three invariants hold on every case', () => {
  const cases = gridInputs();
  assert.equal(cases.length, 5940);
  const failures = [];
  let solved = 0;
  for (const input of cases) {
    const T = S.solve(input);
    if (!T.blocks) continue;
    solved++;
    const f = invariantFailures(T);
    if (f.length) failures.push({ record: input.record, answers: input.answers, failures: f });
  }
  assert.equal(solved, 5940, 'every grid case should produce a laid-out plan');
  assert.equal(failures.length, 0,
    failures.length + ' cases fail; first: ' + JSON.stringify(failures[0]));
});

test('grid of 5,940 cases: the seven cumulative assertions still pass (read only)', () => {
  const bad = [];
  for (const input of gridInputs()) {
    const T = S.solve(input);
    if (!T.blocks) continue;
    const res = S.runCumulativeAssertions(T);
    assert.equal(res.length, 7);
    const failed = res.filter(a => a.status === 'FAIL');
    if (failed.length) bad.push({ record: input.record, answers: input.answers, failed });
  }
  assert.equal(bad.length, 0, bad.length + ' cases fail; first: ' + JSON.stringify(bad[0]));
});
