/* ============================================================================
   ROADMAP BUILDER — THE SOLVER
   Fixed artefact. Delivered as a CONTEXT FILE of the builder's project,
   named roadmap-solver.js. It is not pasted inside the instruction
   document; that form was weighed and discarded with written reasons.
   The engine reads it and runs it. The engine never writes it.

   Three pieces, in this file and nowhere else:
     1. SOLVER          — one entry point. The only thing that does arithmetic.
     2. ASSERTIONS      — startup (hard stop) and cumulative (obligation).
     3. ORPHAN CHECK    — validation only. Never runs in a real session.

   ---------------------------------------------------------------------------
   PORTABILITY CONSTRAINT — DO NOT BREAK THIS
   ---------------------------------------------------------------------------
   This file is written in bare arithmetic on purpose. It exists in JavaScript
   today only because that is the interpreter that was to hand when it was
   built. Which interpreter the COACH has is not yet verified, and that check
   belongs with the other coach-account check that has to happen before the
   project is shared with anyone.

   So that porting this costs an afternoon and not a rewrite, nothing in here
   may use:
     - any library, any import, any package
     - regular expressions
     - the platform date type, or any date parsing
     - string formatting helpers beyond fixed-decimal output
     - object/array methods that do not exist in every language
     - closures over mutable state as a control structure
     - anything asynchronous

   Everything is integers, floats, plain objects, plain arrays, and loops.
   Dates are day counts from a civil-calendar conversion written out below.

   If you add something, ask first whether it survives being rewritten in
   another language by someone who has never read this file.
   ---------------------------------------------------------------------------

   TWO STATES, NOT THREE. A field that is not resolved does not exist in the
   output. It is not empty, not null, not flagged. Screens read fields; a field
   that is absent cannot be quoted. A missing field does not throw — it invites
   the writer to fill it in, which is why the assertions below are the other
   half of this mechanism and not an extra.

   THE SOLVER NEVER PRINTS. It returns. The screen renders.
   ============================================================================ */

var ROADMAP_SOLVER = (function () {

  /* ==========================================================================
     0. NAMED CONSTANTS
     Every parameter is named for the RULE it expresses, never for the value it
     happens to take on the first client.
     ========================================================================== */

  /* The pairing token. Declared ONCE, here, so that advancing the version stays a
     one-line edit on this surface. It is an assertion of PAIRING and not a change
     log: it advances with ANY edit to this file, without exception, because the
     question it answers is whether the document and the solver are still the same
     pair, not whether behaviour changed. A solver and a set of instructions from
     different versions produce a plan neither of them describes. */
  var SOLVER_VERSION = 'solver-1.2';

  var LB_PER_KG = 0.45359237;
  var IN_PER_CM = 0.393700787401575;

  var FOUNDATIONAL_WEEKLY_LOSS_RATE      = 0.0025;  // fixed constant of the model, not editable
  var FOUNDATIONAL_MIN_WEEKS             = 4;
  var FOUNDATIONAL_MAX_WEEKS             = 12;      // hard limit
  var FOUNDATIONAL_WEEKS_PER_COUNTED_UNIT= 2;
  var FOUNDATIONAL_WEEKS_OFFSET          = -2;
  var DIFFICULTY_LOW_EDGE                = 0.8;     // below -> floor of coach range
  var DIFFICULTY_HIGH_EDGE               = 1.3;     // above -> top of coach range

  var FORBES_CONSTANT                    = 10.4;    // FFM = 14.2 + 10.4 ln(FM); fat fraction = FM/(FM+10.4)
  var F_INTERVENTION_OFFSET              = 0.20;    // high protein + resistance training
  var F_CEILING                          = 0.90;

  var FAT_LOSS_BLOCK_MAX_CALENDAR_WEEKS  = 24;      // hard limit
  var BLOCK_MIN_CALENDAR_WEEKS           = 4;
  var DIET_BREAK_WEEKS_PER_CALENDAR_WEEKS= 12;      // one allowance week per 12 calendar weeks, rounded up

  var RATE_STEP_DOWN_PER_FRACTION_LOST   = 0.10;    // range slides 0.1 per 10% of bodyweight lost
  var RATE_STEP_DOWN_AMOUNT              = 0.001;   // 0.1 percentage point, as a fraction
  var RATE_CALCULATION_FLOOR             = 0.004;   // never calculate below 0.4%
  var RATE_HARD_CEILING_FRACTION         = 0.01;    // hard limit: never above 1% of bodyweight per week
  var RATE_HARD_CEILING_LB               = 3.0;     // hard limit: never above 3 lb per week
  var COUNTER_RESET_MAINTENANCE_WEEKS    = 8;       // a maintenance of 8+ weeks resets the counters

  var MAINTENANCE_MIN_WEEKS              = 2;
  var MAINTENANCE_MAX_WEEKS              = 4;
  var MAINTENANCE_DEFAULT_WEEKS          = 2;
  var MAINTENANCE_WEIGHT_ALLOWANCE_LB    = 1.0;     // glycogen, bound water, gut content

  var PREP_MIN_WEEKS                     = 4;
  var PREP_MAX_WEEKS                     = 8;
  var PREP_DEFAULT_WEEKS                 = 6;

  var MUSCLE_GROWTH_MIN_WEEKS            = 16;
  var MUSCLE_GROWTH_MAX_WEEKS            = 32;
  var MUSCLE_GROWTH_WEEKLY_RATE          = 0.003;   // 0.3% for the calculation
  var MUSCLE_GROWTH_LEAN_SHARE           = 0.40;
  var MUSCLE_GROWTH_FAT_SHARE            = 0.60;
  var MUSCLE_GROWTH_BMI_CEILING          = 35;      // measured at intake weight, never at a projected weight

  var LIFESTYLE_DEFAULT_WEEKS            = 12;
  var LIFESTYLE_MIN_WEEKS                = 10;
  var LIFESTYLE_MAX_WEEKS                = 16;

  var PLAN_MAX_WEEKS                     = 104;     // two years shown to the client
  var GOAL_CLASH_THRESHOLD_POINTS        = 2.0;
  var LANDING_TOLERANCE_BODY_FAT_POINTS  = 0.5;
  var LANDING_TOLERANCE_WEIGHT_LB        = 2.0;
  var COVERAGE_ALERT_THRESHOLD           = 0.60;

  var DEFICIT_FAT_ENERGY_DENSITY         = 9000;    // kcal per kg of fat tissue
  var DEFICIT_FAT_FRACTION_OF_TISSUE     = 0.87;
  var DEFICIT_LEAN_ENERGY_DENSITY        = 4000;    // kcal per kg of lean tissue
  var DEFICIT_LEAN_FRACTION_OF_TISSUE    = 0.30;

  var WAYPOINT_DAYS_SIX_MONTHS           = 182;
  var WAYPOINT_DAYS_TWELVE_MONTHS        = 365;

  /* Core habit difficulty. One card each; produce is one card even when it
     counts two units toward duration. */
  var CORE_HABITS = [
    { key: 'protein',       label: 'Protein at meals',        difficulty: 1 },
    { key: 'produce',       label: 'Produce',                 difficulty: 1 },
    { key: 'meal_schedule', label: 'Consistent meal schedule',difficulty: 0 },
    { key: 'sleep',         label: 'Sleep routine',           difficulty: 1 },
    { key: 'steps',         label: 'Daily steps',             difficulty: 2 }
  ];

  /* The fixed tie-break. Chosen so that the same record always produces the
     same plan. Order matters and is not alphabetical. */
  var HABIT_TIE_BREAK_ORDER = ['protein', 'produce', 'meal_schedule', 'sleep', 'steps'];

  var ACTIVITY_FACTORS = [
    { name: 'Sedentary',       multiplier: 1.2   },
    { name: 'Light Activity',  multiplier: 1.375 },
    { name: 'Moderate Activity', multiplier: 1.55 },
    { name: 'Very Active',     multiplier: 1.725 },
    { name: 'Extra Active',    multiplier: 1.9   }
  ];

  var RATE_RANGES = [
    { low: 0.004, high: 0.006 },
    { low: 0.006, high: 0.008 },
    { low: 0.008, high: 0.010 }
  ];

  var MUSCLE_GROWTH_DURATION_CANDIDATES = [16, 20, 24, 32];

  var MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

  /* ==========================================================================
     0b. DECLARED MODEL CHOICES
     Entries, not comments. Each one is a place where the model does something
     on purpose that a reader could otherwise take for a defect. They are
     exported so they can be read out and checked, the same way the cumulative
     assertions are.
     ========================================================================== */

  var DECLARED_MODEL_CHOICES = [

    { id: 'maintenance-pound-travels',
      level: 'plan',
      what: 'The pound a maintenance adds travels. The next fat loss block starts from the weight the client actually carries out of the maintenance, not from the end-of-deficit weight, and that pound is lost again at the block\'s own rate.',
      why: 'Three reasons. First and decisive: the week-by-week annexe carries the pound whatever the block table says, so starting the block from the end-of-deficit weight makes two parts of the SAME document disagree by a pound — measured at 179.3 against 180.3 on the validation fixture. That is the failure a single resolved table exists to make impossible. Second: on the Monday that block opens the client stands on a scale and weighs the heavier number. Every other starting point in this model is a real weight — the intake weight, the post-foundational weight, today\'s weight on a rebuild — and this would be the only invented one, with nothing for the coach to check against. Third: a real maintenance rarely comes out neutral, and where the client ate a little over, some of that pound is fat; losing it at the block\'s rate is not obviously wrong.',
      declared_cost: 'The model holds fat mass CONSTANT across a maintenance and then takes fat out of the whole of the block\'s loss, that pound included. The third reason narrows that inconsistency; it does not model it. Modelling it would mean raising fat mass during the maintenance as well, which is a different change and is not made. Measured effect on the landing: about two tenths of a point of body fat, under the half point the model already declares it cannot resolve.',
      status: 'decided' },

    { id: 'diet-break-week-placement',
      level: 'plan',
      what: 'The non-deficit allowance weeks inside a fat loss block are placed at the end of the block in the week-by-week annexe.',
      why: 'A choice had to be made to draw the annexe at all, and dates are deliberately not assigned to diet breaks. It is no longer an unwritten choice: the instructions now fix these weeks in FOUR places — two that state the placement outright and two that take a dependency on it without saying so — and one of those four is the sentence that closed H-4.',
      declared_cost: 'NOT none, and the earlier reading of none was half the argument. A block\'s LANDING does not move: it depends on the COUNT of its deficit weeks and not on where they sit. But the six month and twelve month waypoints enter the weekly series BY WEEK INDEX, which is an INTERMEDIATE reading, so moving these weeks moves the row each waypoint lands on. Both figures are written to the data file and both are routed to the slide the client reads. The mechanism is verified; the SIZE of the shift has been measured on a synthetic block only, so no magnitude is carried here.',
      status: 'decided. NOT open to being written differently here: moving it falsifies four written places and moves two figures the client reads, so it changes by amending those places and this entry together, never by editing this entry alone.' }
  ];


  /* ==========================================================================
     1. ARITHMETIC AND CALENDAR HELPERS
     ========================================================================== */

  function roundTo(x, places) {
    var f = 1;
    var i;
    for (i = 0; i < places; i++) { f = f * 10; }
    var v = x * f;
    var r;
    if (v >= 0) { r = Math.floor(v + 0.5); } else { r = Math.ceil(v - 0.5); }
    return r / f;
  }

  function fixed(x, places) {
    var v = roundTo(x, places);
    var s = '' + v;
    if (places === 0) { return '' + Math.round(v); }
    var dot = -1;
    var i;
    for (i = 0; i < s.length; i++) { if (s.charAt(i) === '.') { dot = i; } }
    if (dot < 0) { s = s + '.'; dot = s.length - 1; }
    var have = s.length - dot - 1;
    for (i = have; i < places; i++) { s = s + '0'; }
    return s;
  }

  function ceilInt(x) {
    var c = Math.ceil(x);
    /* guard against a float landing a hair above a whole number */
    if (c - x > 0.999999999) { c = c - 1; }
    return c;
  }

  function lbToKg(lb) { return lb * LB_PER_KG; }
  function inToCm(inches) { return inches / IN_PER_CM; }

  /* Civil calendar, written out so it ports. Day 0 is 1970-01-01. */
  function daysFromCivil(y, m, d) {
    var yy = y - (m <= 2 ? 1 : 0);
    var era = Math.floor((yy >= 0 ? yy : yy - 399) / 400);
    var yoe = yy - era * 400;
    var doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
    var doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
    return era * 146097 + doe - 719468;
  }

  function civilFromDays(z) {
    var zz = z + 719468;
    var era = Math.floor((zz >= 0 ? zz : zz - 146096) / 146097);
    var doe = zz - era * 146097;
    var yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
    var y = yoe + era * 400;
    var doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
    var mp = Math.floor((5 * doy + 2) / 153);
    var d = doy - Math.floor((153 * mp + 2) / 5) + 1;
    var m = mp + (mp < 10 ? 3 : -9);
    return { y: y + (m <= 2 ? 1 : 0), m: m, d: d };
  }

  function isoFromDays(z) {
    var c = civilFromDays(z);
    return '' + c.y + '-' + (c.m < 10 ? '0' : '') + c.m + '-' + (c.d < 10 ? '0' : '') + c.d;
  }

  function longDateFromDays(z) {
    var c = civilFromDays(z);
    return '' + c.d + ' ' + MONTH_NAMES[c.m - 1] + ' ' + c.y;
  }

  function daysFromIso(s) {
    var y = 0, m = 0, d = 0, i;
    for (i = 0; i < 4; i++) { y = y * 10 + (s.charCodeAt(i) - 48); }
    for (i = 5; i < 7; i++) { m = m * 10 + (s.charCodeAt(i) - 48); }
    for (i = 8; i < 10; i++) { d = d * 10 + (s.charCodeAt(i) - 48); }
    return daysFromCivil(y, m, d);
  }

  /* ==========================================================================
     2. THE MODEL
     ========================================================================== */

  /* f — the fraction of lost weight that comes off as fat.
     Calculated in three scopes that do not overlap; the caller decides which
     fat mass to hand it. It is never shown on any screen and has no display
     value, so a value of f appearing in a transcript is a finding. */
  function fatFraction(fatMassLb) {
    var fmKg = lbToKg(fatMassLb);
    var base = fmKg / (fmKg + FORBES_CONSTANT);
    var f = base + F_INTERVENTION_OFFSET;
    if (f > F_CEILING) { f = F_CEILING; }
    return f;
  }

  /* Weight to remove to land on a body fat goal, measured against the
     finished, lighter body. Dividing by f alone undershoots. */
  function weightToLose(weightLb, bodyFatFraction, goalBodyFatFraction, f) {
    return weightLb * (bodyFatFraction - goalBodyFatFraction) / (f - goalBodyFatFraction);
  }

  /* Deficit weeks at a rate, by compounding. Never pounds divided by an
     average weekly loss. */
  function deficitWeeksFor(currentWeight, targetWeight, rate) {
    return Math.log(targetWeight / currentWeight) / Math.log(1 - rate);
  }

  function dietBreakAllowance(calendarWeeks) {
    return ceilInt(calendarWeeks / DIET_BREAK_WEEKS_PER_CALENDAR_WEEKS);
  }

  /* Deficit weeks and calendar weeks are different quantities and one is never
     written in place of the other. This is the conversion, and getting it
     wrong is the single most likely way to produce a plan that looks right. */
  function calendarWeeksHolding(deficitWeeksNeeded) {
    var c = deficitWeeksNeeded;
    var guard = 0;
    while (c - dietBreakAllowance(c) < deficitWeeksNeeded) {
      c = c + 1;
      guard = guard + 1;
      if (guard > 500) { break; }
    }
    return c;
  }

  function mifflinBasal(weightLb, heightIn, age, sex) {
    var kg = lbToKg(weightLb);
    var cm = inToCm(heightIn);
    var b = 10 * kg + 6.25 * cm - 5 * age;
    if (sex === 'male') { b = b + 5; } else { b = b - 161; }
    return b;
  }

  /* Daily calories behind one kg of weekly loss, derived from f, never from a
     flat 3500 kcal per pound. */
  function kcalPerKgPerWeekPerDay(f) {
    return (f * DEFICIT_FAT_FRACTION_OF_TISSUE * DEFICIT_FAT_ENERGY_DENSITY +
            (1 - f) * DEFICIT_LEAN_FRACTION_OF_TISSUE * DEFICIT_LEAN_ENERGY_DENSITY) / 7;
  }

  function dailyCaloriesAtRate(maintenance, weightLb, rate, f) {
    var kgPerWeek = lbToKg(weightLb * rate);
    return maintenance - kgPerWeek * kcalPerKgPerWeekPerDay(f);
  }

  function bmi(weightLb, heightIn) {
    var kg = lbToKg(weightLb);
    var m = inToCm(heightIn) / 100;
    return kg / (m * m);
  }

  /* ==========================================================================
     3. HABITS
     Deterministic. Thresholds and the tie-break live here so that two runs of
     the same record produce the same plan — which is what code guarantees and
     prose does not.
     ========================================================================== */

  var PRODUCE_SERVING_SCORES = {
    '2+ servings almost every day': 2,
    '2+ servings some days of the week': 1,
    'About 1 serving almost every day': 1,
    '1 serving or less, only some days': 0,
    'Rarely or almost never': 0
  };

  function produceScore(answer) {
    if (PRODUCE_SERVING_SCORES.hasOwnProperty(answer)) { return PRODUCE_SERVING_SCORES[answer]; }
    return 0;
  }

  function assessHabits(record) {
    var h = record.habits;
    var out = [];
    var i;

    /* Protein — met only at most or almost all meals. */
    var proteinMet = (h.protein === 'Most or almost all meals');
    out.push({ key: 'protein', met: proteinMet, units: proteinMet ? 0 : 1,
               client_answer: [{ label: 'Protein at meals', answer: h.protein }] });

    /* Produce — vegetables and fruit read together, one card. */
    var combined = produceScore(h.produce_vegetables) + produceScore(h.produce_fruit);
    var produceMet = (combined >= 4);
    var produceUnits = 0;
    var produceTarget = null;
    if (!produceMet) {
      if (combined >= 2) { produceUnits = 1; produceTarget = 'four servings'; }
      else { produceUnits = 2; produceTarget = 'two servings, then four'; }
    }
    out.push({ key: 'produce', met: produceMet, units: produceUnits,
               client_answer: [{ label: 'Vegetables', answer: h.produce_vegetables },
                               { label: 'Fruit', answer: h.produce_fruit }],
               produce_target: produceTarget, produce_combined_servings: combined });

    /* Meal schedule — met at very consistent, or at somewhat consistent when
       weekends barely differ AND they do not graze all day. */
    var mealMet = (h.meal_schedule === 'Very consistent') ||
                  (h.meal_schedule === 'Somewhat consistent' &&
                   h.weekend_variation_small === true &&
                   h.grazes_all_day === false);
    out.push({ key: 'meal_schedule', met: mealMet, units: mealMet ? 0 : 1,
               client_answer: [{ label: 'Meal schedule', answer: h.meal_schedule }] });

    /* Sleep — met at very consistent, or at somewhat consistent when they get
       seven hours or more AND sleep through the night and wake rested. */
    var sleepMet = (h.sleep_routine === 'Very consistent') ||
                   (h.sleep_routine === 'Somewhat consistent' &&
                    h.sleep_hours_seven_or_more === true &&
                    h.sleeps_through_and_rested === true);
    out.push({ key: 'sleep', met: sleepMet, units: sleepMet ? 0 : 1,
               client_answer: [{ label: 'Sleep routine', answer: h.sleep_routine }] });

    /* Steps — met at 7,000-9,999 and 10,000+. Assigned at under 5,000,
       5,000-6,999 and not sure. */
    var stepsMet = (h.daily_steps === '7,000-9,999' || h.daily_steps === '10,000+');
    var stepsUnsure = (h.daily_steps === 'Not sure');
    out.push({ key: 'steps', met: stepsMet, units: stepsMet ? 0 : 1,
               client_answer: [{ label: 'Daily steps', answer: h.daily_steps }], target_agreed_on_call: stepsUnsure });

    /* Attach the card label and difficulty. */
    for (i = 0; i < out.length; i++) {
      var j;
      for (j = 0; j < CORE_HABITS.length; j++) {
        if (CORE_HABITS[j].key === out[i].key) {
          out[i].label = CORE_HABITS[j].label;
          out[i].difficulty = CORE_HABITS[j].difficulty;
        }
      }
    }
    return out;
  }

  /* The contradiction flag. This is the ONLY judgement made about these two
     answers, and the only contradiction flagged anywhere. */
  function activityStepsContradiction(record) {
    var lvl = record.activity_level_selected;
    var steps = record.habits.daily_steps;
    if ((lvl === 'Very Active' || lvl === 'Extra Active') && steps === 'Under 5,000') {
      return true;
    }
    return false;
  }

  function rankOf(record, habitKey) {
    /* Vegetables and fruit rank separately but are one card. Produce takes
       whichever ranked higher. */
    var priorities = record.priorities || [];
    var best = -1;
    var i;
    for (i = 0; i < priorities.length; i++) {
      var p = priorities[i];
      var matches = (p.habit_key === habitKey);
      if (habitKey === 'produce' && (p.habit_key === 'produce_vegetables' || p.habit_key === 'produce_fruit')) {
        matches = true;
      }
      if (matches) {
        if (best < 0 || i < best) { best = i; }
      }
    }
    return best; /* -1 when unranked; 0 is ranked first */
  }

  function tieBreakIndex(key) {
    var i;
    for (i = 0; i < HABIT_TIE_BREAK_ORDER.length; i++) {
      if (HABIT_TIE_BREAK_ORDER[i] === key) { return i; }
    }
    return HABIT_TIE_BREAK_ORDER.length;
  }

  /* Order of introduction. Week one is always two: the hardest assigned habit
     (the anchor, which never moves) and the easiest (the companion). Ties are
     normal and break on the client's ranking first, then on the fixed order. */
  function orderHabits(assigned, record) {
    var i, j;
    var pool = [];
    for (i = 0; i < assigned.length; i++) { pool.push(assigned[i]); }

    function harder(a, b) {
      if (a.difficulty !== b.difficulty) { return a.difficulty > b.difficulty; }
      var ra = rankOf(record, a.key), rb = rankOf(record, b.key);
      if (ra !== rb) {
        if (ra < 0) { return false; }
        if (rb < 0) { return true; }
        return ra < rb;
      }
      return tieBreakIndex(a.key) < tieBreakIndex(b.key);
    }
    function easier(a, b) {
      if (a.difficulty !== b.difficulty) { return a.difficulty < b.difficulty; }
      var ra = rankOf(record, a.key), rb = rankOf(record, b.key);
      if (ra !== rb) {
        if (ra < 0) { return false; }
        if (rb < 0) { return true; }
        return ra < rb;
      }
      return tieBreakIndex(a.key) < tieBreakIndex(b.key);
    }

    if (pool.length === 0) { return { order: [], anchor: null, companion: null }; }

    var anchor = pool[0];
    for (i = 1; i < pool.length; i++) { if (harder(pool[i], anchor)) { anchor = pool[i]; } }

    var rest = [];
    for (i = 0; i < pool.length; i++) { if (pool[i].key !== anchor.key) { rest.push(pool[i]); } }

    var companion = null;
    if (rest.length > 0) {
      companion = rest[0];
      for (i = 1; i < rest.length; i++) { if (easier(rest[i], companion)) { companion = rest[i]; } }
    }

    /* If the client ranked an assigned habit first and it is neither anchor
       nor companion, it replaces the COMPANION. Never the anchor. */
    var firstRanked = null;
    for (i = 0; i < pool.length; i++) {
      if (rankOf(record, pool[i].key) === 0) { firstRanked = pool[i]; }
    }
    if (firstRanked !== null && companion !== null &&
        firstRanked.key !== anchor.key && firstRanked.key !== companion.key) {
      companion = firstRanked;
    }

    var order = [];
    order.push(anchor);
    if (companion !== null) { order.push(companion); }

    /* From week two: ranked habits first in the client's order, then unranked
       from hardest to easiest, ties on the fixed order. */
    var remaining = [];
    for (i = 0; i < pool.length; i++) {
      var used = false;
      for (j = 0; j < order.length; j++) { if (order[j].key === pool[i].key) { used = true; } }
      if (!used) { remaining.push(pool[i]); }
    }
    var ranked = [], unranked = [];
    for (i = 0; i < remaining.length; i++) {
      if (rankOf(record, remaining[i].key) >= 0) { ranked.push(remaining[i]); } else { unranked.push(remaining[i]); }
    }
    ranked.sort(function (a, b) { return rankOf(record, a.key) - rankOf(record, b.key); });
    unranked.sort(function (a, b) {
      if (a.difficulty !== b.difficulty) { return b.difficulty - a.difficulty; }
      return tieBreakIndex(a.key) - tieBreakIndex(b.key);
    });
    for (i = 0; i < ranked.length; i++) { order.push(ranked[i]); }
    for (i = 0; i < unranked.length; i++) { order.push(unranked[i]); }

    return { order: order, anchor: anchor, companion: companion };
  }

  function foundationalRow(countedUnits) {
    var proposal = FOUNDATIONAL_WEEKS_PER_COUNTED_UNIT * countedUnits + FOUNDATIONAL_WEEKS_OFFSET;
    if (proposal < FOUNDATIONAL_MIN_WEEKS) { proposal = FOUNDATIONAL_MIN_WEEKS; }
    if (proposal > FOUNDATIONAL_MAX_WEEKS) { proposal = FOUNDATIONAL_MAX_WEEKS; }
    var low = proposal;
    var high = proposal + 2;
    if (countedUnits <= 2) { high = proposal; }               /* the fixed row */
    if (high > FOUNDATIONAL_MAX_WEEKS) { high = FOUNDATIONAL_MAX_WEEKS; }
    return { proposal: proposal, range_low: low, range_high: high, fixed: (low === high) };
  }

  function difficultyAverage(assigned) {
    if (assigned.length === 0) { return 0; }
    var sum = 0, i;
    /* Produce counts as ONE habit here even when it counts 2 for duration —
       it is one card, learned once. */
    for (i = 0; i < assigned.length; i++) { sum = sum + assigned[i].difficulty; }
    return sum / assigned.length;
  }

  function foundationalProposal(row, avg) {
    if (row.fixed) { return row.range_low; }
    if (avg < DIFFICULTY_LOW_EDGE) { return row.range_low; }
    if (avg > DIFFICULTY_HIGH_EDGE) { return row.range_high; }
    return row.proposal;
  }

  /* ==========================================================================
     4. THE SOLVER
     One entry point. There is no function per stop, because two entry points
     is where a second implementation of the same sum goes to live.
     ========================================================================== */

  function fingerprint(answers) {
    var keys = [], k;
    for (k in answers) { if (answers.hasOwnProperty(k)) { keys.push(k); } }
    keys.sort();
    var s = '', i;
    for (i = 0; i < keys.length; i++) {
      var v = answers[keys[i]];
      if (v === undefined || v === null) { continue; }
      if (v instanceof Array) {
        var joined = '', q;
        for (q = 0; q < v.length; q++) { joined = joined + (q > 0 ? '|' : '') + v[q]; }
        v = '[' + joined + ']';
      }
      s = s + keys[i] + '=' + v + ';';
    }
    return s;
  }

  function display(table, path, value, places) {
    table.display[path] = fixed(value, places);
  }

  /* H-11 (seventh run). ONE rounding convention: every displayed figure that is a
     DIFFERENCE of two other displayed figures is worked out FROM THOSE TWO DISPLAYED
     FIGURES, never from the raw values. It is NOT conditioned on whether the figure
     appears next to its operands — adjacency is a property of the SURFACE and not of
     the figure, and there are four outputs plus the kickoff.

     A member DECLARES ITSELF here as it is emitted, and declaring is not decoration:
     the assertion enumerates this family and checks every member, so a new site that
     emits a difference without declaring itself FALLS. That is the lesson of the
     seventh run turned into code. The damage was not having two conventions; it was
     that nothing detected the second. */
  function displayDifference(table, path, a, b, places, useAbs) {
    var v = useAbs ? Math.abs(a - b) : (a - b);
    table.display[path] = fixed(v, places);
    table.difference_family.push({ key: path, a: a, b: b, places: places, abs: (useAbs === true) });
    return v;
  }

  /* A display key that names a member of the difference family. Kept next to the
     H-11 (seventh run) assertion because that is the only thing that reads it. */
  function namesADifference(key) {
    var words = ['weight_lost_lb', 'gained_lb', 'total_change', 'gap_to_basal',
                 'gap_points', 'estimated_destination'];
    var i, j;
    for (i = 0; i < words.length; i++) {
      var w = words[i];
      for (j = 0; j + w.length <= key.length; j++) {
        if (key.substring(j, j + w.length) === w) { return true; }
      }
    }
    return false;
  }

  function solve(input) {
    var startup = startupCheck();
    if (!startup.ok) {
      /* Refuses to emit a table. A broken transcription of this file stops
         being silent here and becomes a hard stop. */
      throw new Error('SOLVER STARTUP ASSERTION FAILED — no table emitted. ' + startup.summary);
    }

    var record = input.record;
    var answers = input.answers || {};
    var history = input.history || null;

    var T = {
      answers_fingerprint: fingerprint(answers),
      frontier: 'record',
      display: {},
      difference_family: [],
      rows: [],
      blocks: [],
      alerts: [],
      notes: []
    };

    /* ---- the starting point ------------------------------------------- */
    var isRebuild = (history !== null && history.is_rebuild === true);
    var startWeight, startBodyFat, startDay, age;

    if (isRebuild) {
      startWeight  = history.today_weight_lb;
      startBodyFat = history.today_body_fat_pct / 100;
      startDay     = daysFromIso(history.today_iso);
      age          = history.age_today;
    } else {
      startWeight  = record.weight_lb;
      startBodyFat = record.body_fat_pct / 100;
      age          = record.age_at_submission;
      if (answers.start_date_iso === undefined) { return T; }
      startDay     = daysFromIso(answers.start_date_iso);
    }

    T.start = {
      weight_lb: startWeight,
      body_fat_fraction: startBodyFat,
      start_day: startDay,
      start_date_iso: isoFromDays(startDay),
      start_date_display: longDateFromDays(startDay),
      is_rebuild: isRebuild
    };
    display(T, 'start.weight_lb', startWeight, 1);
    display(T, 'start.body_fat_pct', startBodyFat * 100, 1);

    var heightIn = record.height_in;
    var sex = record.sex;

    /* the goal */
    var hasGoalWeight = (record.goal_weight_lb !== undefined && record.goal_weight_lb !== null);
    var hasGoalBodyFat = (record.goal_body_fat_pct !== undefined && record.goal_body_fat_pct !== null);
    var goalBodyFat = hasGoalBodyFat ? record.goal_body_fat_pct / 100 : null;
    var goalWeight = hasGoalWeight ? record.goal_weight_lb : null;
    T.goal = { declared_weight_lb: goalWeight, declared_body_fat_pct: hasGoalBodyFat ? record.goal_body_fat_pct : null,
               governs: hasGoalBodyFat ? 'body_fat' : 'weight' };
    if (hasGoalWeight) { display(T, 'goal.declared_weight_lb', goalWeight, 1); }
    if (hasGoalBodyFat) { display(T, 'goal.declared_body_fat_pct', record.goal_body_fat_pct, 1); }

    /* ---- habits -------------------------------------------------------- */
    var assessed = assessHabits(record);
    var assigned = [], i, j;
    for (i = 0; i < assessed.length; i++) {
      var a = assessed[i];
      var coachAdded = false;
      if (answers.coach_added_habits) {
        for (j = 0; j < answers.coach_added_habits.length; j++) {
          if (answers.coach_added_habits[j] === a.key) { coachAdded = true; }
        }
      }
      var coachRemoved = false;
      if (answers.coach_removed_habits) {
        for (j = 0; j < answers.coach_removed_habits.length; j++) {
          if (answers.coach_removed_habits[j] === a.key) { coachRemoved = true; }
        }
      }
      if (coachAdded && a.met) { a.met = false; a.units = (a.key === 'produce' ? 1 : 1); a.coach_added = true; }
      if (coachRemoved && !a.met) { a.met = true; a.units = 0; a.coach_removed = true; }
      if (!a.met) { assigned.push(a); }
    }

    var countedUnits = 0;
    for (i = 0; i < assigned.length; i++) { countedUnits = countedUnits + assigned[i].units; }
    var ordering = orderHabits(assigned, record);
    var row = foundationalRow(countedUnits);
    var avg = difficultyAverage(assigned);
    var proposal = foundationalProposal(row, avg);

    T.foundational_input = {
      assessed: assessed,
      assigned: assigned,
      counted_units: countedUnits,
      difficulty_average: avg,
      row: row,
      proposed_weeks: proposal,
      order: ordering.order,
      anchor: ordering.anchor,
      companion: ordering.companion,
      contradiction_flag: activityStepsContradiction(record)
    };
    T.frontier = 'foundational_length';

    /* Candidates for the length question. Three options from THIS client's
       row, never a fixed set. */
    T.foundational_length_candidates = [];
    if (!row.fixed) {
      for (i = row.range_low; i <= row.range_high; i++) { T.foundational_length_candidates.push(i); }
    } else {
      T.foundational_length_candidates.push(row.range_low);
    }

    if (isRebuild) {
      /* On a rebuild there is no foundational phase ahead. */
      T.foundational = null;
    } else {
      if (answers.foundational_weeks === undefined) { return T; }
      var fWeeks = answers.foundational_weeks;
      if (fWeeks > FOUNDATIONAL_MAX_WEEKS) { fWeeks = FOUNDATIONAL_MAX_WEEKS; }

      /* The foundational fraction: worked out ONCE from the intake figures and
         used across the whole phase. Its scope ends here. */
      var fFoundational = fatFraction(startWeight * startBodyFat);
      var wPost = startWeight * Math.pow(1 - FOUNDATIONAL_WEEKLY_LOSS_RATE, fWeeks);
      var lost = startWeight - wPost;
      var fatMassStart = startWeight * startBodyFat;
      var fatMassPost = fatMassStart - lost * fFoundational;
      var bfPost = fatMassPost / wPost;

      T.foundational = {
        weeks: fWeeks,
        start_day: startDay,
        end_day: startDay + fWeeks * 7 - 1,
        start_date_iso: isoFromDays(startDay),
        end_date_iso: isoFromDays(startDay + fWeeks * 7 - 1),
        start_date_display: longDateFromDays(startDay),
        end_date_display: longDateFromDays(startDay + fWeeks * 7 - 1),
        end_weight_lb: wPost,
        end_body_fat_fraction: bfPost,
        end_fat_mass_lb: fatMassPost,
        f_used: fFoundational,
        likely_change_lb: lost,
        row_kind: 'projected'
      };
      display(T, 'foundational.end_weight_lb', wPost, 1);
      display(T, 'foundational.end_body_fat_pct', bfPost * 100, 1);
      display(T, 'foundational.weeks', fWeeks, 0);
      /* the client-facing range: rounded, plus or minus a pound, lower edge
         never under a pound */
      /* H-11 (seventh run), site 6. Worked out from the two DISPLAYED weights, not
         from the raw loss: the range that reaches the client in the data file is
         built on this figure. */
      var likely = roundTo(parseFloat(fixed(startWeight, 1)) - parseFloat(fixed(wPost, 1)), 0);
      var lowEdge = likely - 1; if (lowEdge < 1) { lowEdge = 1; }
      T.foundational.client_range_low_lb = lowEdge;
      T.foundational.client_range_high_lb = likely + 1;
      display(T, 'foundational.client_range_low_lb', lowEdge, 0);
      display(T, 'foundational.client_range_high_lb', likely + 1, 0);
    }

    /* ---- the weight the first deficit block starts from ----------------
       Named for the rule, not for the value it takes in the normal case.
       On a first run it is the post-foundational weight; on a rebuild it is
       what the client weighs today. */
    var firstDeficitWeight, firstDeficitFatMass, firstDeficitBodyFat, bodyCompStartDay;
    if (isRebuild) {
      firstDeficitWeight = startWeight;
      firstDeficitFatMass = startWeight * startBodyFat;
      bodyCompStartDay = startDay;
    } else {
      firstDeficitWeight = T.foundational.end_weight_lb;
      firstDeficitFatMass = T.foundational.end_fat_mass_lb;
      bodyCompStartDay = T.foundational.end_day + 1;
    }
    firstDeficitBodyFat = firstDeficitFatMass / firstDeficitWeight;

    T.first_deficit_block_weight_lb = firstDeficitWeight;
    T.first_deficit_block_body_fat_fraction = firstDeficitBodyFat;

    /* ---- the sizing estimate (its own named field, never the landing) --- */
    var fSizing = fatFraction(firstDeficitFatMass);
    var goalForSizing = hasGoalBodyFat ? goalBodyFat : null;
    if (hasGoalBodyFat) {
      var toLose = weightToLose(firstDeficitWeight, firstDeficitBodyFat, goalBodyFat, fSizing);
      T.sizing_estimate = {
        weight_to_remove_lb: toLose,
        estimated_destination_weight_lb: firstDeficitWeight - toLose,
        f_used: fSizing
      };
      display(T, 'sizing_estimate.weight_to_remove_lb', toLose, 1);
      /* H-11 (seventh run), site 5. The weight the first deficit block starts from is
         displayed under DIFFERENT KEYS depending on the branch — the post-foundational
         weight on a first run, the start weight on a rebuild — so the displayed
         operand is worked out here once and never reached for by name. */
      var firstDeficitShown = parseFloat(fixed(firstDeficitWeight, 1));
      displayDifference(T, 'sizing_estimate.estimated_destination_weight_lb',
                        firstDeficitShown, parseFloat(fixed(toLose, 1)), 1);

      /* the goal check, measured from the post-foundational figures */
      if (hasGoalWeight) {
        var poundsToGoalWeight = firstDeficitWeight - goalWeight;
        var impliedFat = firstDeficitFatMass - fSizing * poundsToGoalWeight;
        var impliedBodyFat = impliedFat / goalWeight;
        /* H-11 (seventh run), site 4. Both operands are on the screen at one decimal,
           so the gap is the difference of those two and not of the raw fractions. */
        var impliedShown = parseFloat(fixed(impliedBodyFat * 100, 1));
        var goalShown = parseFloat(fixed(record.goal_body_fat_pct, 1));
        var gapPoints = Math.abs(impliedShown - goalShown);
        T.goal_check = {
          implied_body_fat_pct: impliedBodyFat * 100,
          gap_points: gapPoints,
          clash: gapPoints > GOAL_CLASH_THRESHOLD_POINTS
        };
        display(T, 'goal_check.implied_body_fat_pct', impliedBodyFat * 100, 1);
        displayDifference(T, 'goal_check.gap_points', impliedShown, goalShown, 1, true);
      }
    } else {
      T.sizing_estimate = {
        estimated_destination_weight_lb: goalWeight,
        f_used: fSizing
      };
      display(T, 'sizing_estimate.estimated_destination_weight_lb', goalWeight, 1);
    }
    T.frontier = 'activity_factor';

    /* ---- the activity factor and the calories -------------------------- */
    if (answers.activity_factor_name === undefined) { return T; }
    var factor = null;
    for (i = 0; i < ACTIVITY_FACTORS.length; i++) {
      if (ACTIVITY_FACTORS[i].name === answers.activity_factor_name) { factor = ACTIVITY_FACTORS[i]; }
    }
    if (factor === null) { return T; }

    var basal = mifflinBasal(firstDeficitWeight, heightIn, age, sex);
    var maintenance = basal * factor.multiplier;
    T.calories = {
      basal: basal,
      maintenance: maintenance,
      activity_factor_name: factor.name,
      activity_factor_multiplier: factor.multiplier,
      calculated_on_weight_lb: firstDeficitWeight,
      bands: []
    };
    display(T, 'calories.basal', basal, 0);
    display(T, 'calories.maintenance', maintenance, 0);
    display(T, 'calories.calculated_on_weight_lb', firstDeficitWeight, 1);

    for (i = 0; i < RATE_RANGES.length; i++) {
      var rr = RATE_RANGES[i];
      var mid = (rr.low + rr.high) / 2;
      var kcal = dailyCaloriesAtRate(maintenance, firstDeficitWeight, mid, fSizing);
      var band = {
        range_low_pct: rr.low * 100,
        range_high_pct: rr.high * 100,
        midpoint_pct: mid * 100,
        daily_calories: kcal,
        below_basal: (roundTo(kcal, 0) < roundTo(basal, 0)),
        gap_to_basal: basal - kcal
      };
      T.calories.bands.push(band);
      display(T, 'calories.bands.' + i + '.daily_calories', kcal, 0);
      /* H-11 (seventh run), site 3. Both operands are displayed at zero decimals. */
      if (band.below_basal) {
        displayDifference(T, 'calories.bands.' + i + '.gap_to_basal',
                          parseFloat(fixed(basal, 0)), parseFloat(fixed(kcal, 0)), 0);
      }
    }
    T.frontier = 'rate_range';

    if (answers.rate_range_1_low_pct === undefined) { return T; }

    /* ---- lay out the plan ---------------------------------------------- */
    var wantsMuscleGrowth = (answers.muscle_growth === true);
    var bmiAtIntake = bmi(isRebuild ? startWeight : record.weight_lb, heightIn);
    var bmiBlocks = (bmiAtIntake >= MUSCLE_GROWTH_BMI_CEILING);
    T.bmi_check = { measured_on_weight_lb: isRebuild ? startWeight : record.weight_lb, bmi: bmiAtIntake, blocks_muscle_growth: bmiBlocks };
    if (bmiBlocks) {
      display(T, 'bmi_check.bmi', bmiAtIntake, 1);
      display(T, 'bmi_check.measured_on_weight_lb', isRebuild ? startWeight : record.weight_lb, 1);
    }

    var plan = layout(T, {
      record: record, answers: answers,
      startDay: bodyCompStartDay,
      weight: firstDeficitWeight,
      fatMass: firstDeficitFatMass,
      goalBodyFat: goalBodyFat,
      goalWeight: goalWeight,
      hasGoalBodyFat: hasGoalBodyFat,
      hasGoalWeight: hasGoalWeight,
      maintenance: maintenance,
      wantsMuscleGrowth: wantsMuscleGrowth && !bmiBlocks,
      compressionStep: 0
    });

    /* two-year window */
    var totalWeeks = plan.total_weeks + (T.foundational ? T.foundational.weeks : 0);
    if (totalWeeks > PLAN_MAX_WEEKS && plan.had_muscle_growth) {
      /* step 1 of the compression order: remove muscle growth and RE-SOLVE.
         Never subtract the weeks that were deleted. */
      plan = layout(T, {
        record: record, answers: answers,
        startDay: bodyCompStartDay,
        weight: firstDeficitWeight,
        fatMass: firstDeficitFatMass,
        goalBodyFat: goalBodyFat,
        goalWeight: goalWeight,
        hasGoalBodyFat: hasGoalBodyFat,
        hasGoalWeight: hasGoalWeight,
        maintenance: maintenance,
        wantsMuscleGrowth: false,
        compressionStep: 1
      });
      totalWeeks = plan.total_weeks + (T.foundational ? T.foundational.weeks : 0);
      T.compression_step_landed_on = 1;
    }
    if (totalWeeks > PLAN_MAX_WEEKS) {
      T.compression_step_landed_on = 3; /* adjust the fat loss objective to what fits */
      plan.objective_adjusted = true;
    }

    /* ---- no calories per block -----------------------------------------
       H-11, closed. Calories exist for exactly one purpose: so the coach can
       pick the starting rate range. They govern nothing else in the roadmap.
       So they appear on the rate-choice screen and nowhere else, and no block
       carries a calorie figure — not in the coach document, not in the data
       file, not anywhere.

       The field is not emitted empty. It does not exist in the output, by the
       rule of two states and not three. The assertion that holds this is in
       the cumulative list under H-11. */

    T.blocks = plan.blocks;
    T.body_composition = plan.summary;
    T.lifestyle = plan.lifestyle;
    T.plan = {
      total_weeks: totalWeeks,
      start_day: startDay,
      end_day: plan.lifestyle.end_day,
      start_date_iso: isoFromDays(startDay),
      end_date_iso: isoFromDays(plan.lifestyle.end_day),
      start_date_display: longDateFromDays(startDay),
      end_date_display: longDateFromDays(plan.lifestyle.end_day),
      start_weight_lb: startWeight,
      start_body_fat_fraction: startBodyFat,
      end_weight_lb: plan.final_weight,
      end_body_fat_fraction: plan.final_body_fat,
      /* H-11 (seventh run), site 2. Corrected ON THE OBJECT, because the data file
         formats this field a second time: correcting only the display value would
         leave the data file emitting the raw one. Signed here, shown absolute. */
      total_change_lb: parseFloat(fixed(plan.final_weight, 1)) - parseFloat(fixed(startWeight, 1)),
      objective_adjusted: (plan.objective_adjusted === true)
    };
    display(T, 'plan.total_weeks', totalWeeks, 0);
    display(T, 'plan.end_weight_lb', plan.final_weight, 1);
    display(T, 'plan.end_body_fat_pct', plan.final_body_fat * 100, 1);
    displayDifference(T, 'plan.total_change_lb',
                      parseFloat(fixed(plan.final_weight, 1)), parseFloat(fixed(startWeight, 1)), 1, true);

    /* ---- the landing test, measured on the ROUNDED figures -------------- */
    var landedInside = false;
    if (hasGoalBodyFat) {
      landedInside = Math.abs(roundTo(plan.final_body_fat * 100, 1) - roundTo(record.goal_body_fat_pct, 1))
                     <= LANDING_TOLERANCE_BODY_FAT_POINTS;
    } else {
      landedInside = Math.abs(roundTo(plan.final_weight, 1) - roundTo(goalWeight, 1))
                     <= LANDING_TOLERANCE_WEIGHT_LB;
    }
    T.plan.landed_inside_threshold = landedInside;
    if (landedInside) { T.plan.objective_adjusted = false; }

    /* ---- alerts --------------------------------------------------------- */
    if (T.plan.objective_adjusted) {
      T.alerts.push({ id: 'objective_adjusted', governing: hasGoalBodyFat ? 'body_fat' : 'weight' });
    }
    var coverage = 1;
    if (hasGoalBodyFat) {
      var wanted = firstDeficitBodyFat * 100 - record.goal_body_fat_pct;
      var got = firstDeficitBodyFat * 100 - plan.final_body_fat * 100;
      if (wanted > 0) { coverage = got / wanted; }
    } else {
      var wantedW = firstDeficitWeight - goalWeight;
      var gotW = firstDeficitWeight - plan.final_weight;
      if (wantedW > 0) { coverage = gotW / wantedW; }
    }
    T.plan.goal_coverage = coverage;
    if (coverage < COVERAGE_ALERT_THRESHOLD) {
      T.alerts.push({ id: 'coverage_under_threshold', coverage: coverage });
      display(T, 'plan.goal_coverage_pct', coverage * 100, 0);
    }
    if (record.asked_for_muscle_growth === true && !plan.had_muscle_growth) {
      T.alerts.push({ id: 'no_muscle_growth', reason: bmiBlocks ? 'bmi_ceiling' : 'did_not_fit' });
    }

    /* ---- weekly series, band, waypoints --------------------------------- */
    T.weekly = weeklySeries(T, plan, answers);
    T.waypoints = waypoints(T, startDay);

    T.frontier = 'training';
    if (answers.training_days_per_week !== undefined) {
      T.training = {
        days_per_week: answers.training_days_per_week,
        split: answers.training_split,
        objective: answers.training_objective,
        open_field: answers.training_open_field
      };
      display(T, 'training.days_per_week', answers.training_days_per_week, 0);
      T.frontier = 'complete';
    }

    T.data_file = buildDataFile(T, record, answers);
    return T;
  }

  /* --------------------------------------------------------------------------
     The layout. One pass, and the only place a block is built.
     -------------------------------------------------------------------------- */
  function layout(T, ctx) {
    var blocks = [];
    var day = ctx.startDay;
    var weight = ctx.weight;
    var fatMass = ctx.fatMass;

    var chosenLow = ctx.answers.rate_range_1_low_pct / 100;
    var chosenHigh = ctx.answers.rate_range_1_high_pct / 100;

    /* counters, measured from the last reset, never from the start of the plan */
    var counterDeficitWeeks = 0;
    var counterWindowBaseWeight = weight;
    var counterPercentLost = 0;

    var hadMuscleGrowth = false;
    var guard = 0;
    var phase = 'fat_loss_before_surplus';
    var lastDeficitEndWeight = weight;

    while (guard < 60) {
      guard = guard + 1;

      if (phase === 'fat_loss_before_surplus' || phase === 'fat_loss_after_surplus') {
        var stepsDown = Math.floor(counterPercentLost / RATE_STEP_DOWN_PER_FRACTION_LOST);
        var baseLow, baseHigh;
        if (phase === 'fat_loss_after_surplus') {
          baseLow = ctx.answers.rate_range_2_low_pct / 100;
          baseHigh = ctx.answers.rate_range_2_high_pct / 100;
          if (ctx.answers.rate_range_2_low_pct === undefined) { break; }
        } else {
          baseLow = chosenLow; baseHigh = chosenHigh;
        }
        var rangeLow = baseLow - stepsDown * RATE_STEP_DOWN_AMOUNT;
        var rangeHigh = baseHigh - stepsDown * RATE_STEP_DOWN_AMOUNT;
        var mid = (rangeLow + rangeHigh) / 2;
        if (mid < RATE_CALCULATION_FLOOR) { mid = RATE_CALCULATION_FLOOR; }
        if (mid > RATE_HARD_CEILING_FRACTION) { mid = RATE_HARD_CEILING_FRACTION; }
        if (weight * mid > RATE_HARD_CEILING_LB) { mid = RATE_HARD_CEILING_LB / weight; }

        var bf = fatMass / weight;
        var fBlock = fatFraction(fatMass);

        /* which goal closes a block early: body fat closes it, the goal weight
           never does when both were given */
        var target;
        if (ctx.hasGoalBodyFat) {
          target = weight - weightToLose(weight, bf, ctx.goalBodyFat, fBlock);
        } else {
          target = ctx.goalWeight;
        }

        if (target >= weight) { phase = (phase === 'fat_loss_before_surplus' ? 'to_surplus' : 'done'); continue; }

        var needRaw = deficitWeeksFor(weight, target, mid);
        var needDeficit = ceilInt(needRaw);           /* always round up */
        var calendar = calendarWeeksHolding(needDeficit);
        var closedReason = 'goal_reached';
        if (calendar > FAT_LOSS_BLOCK_MAX_CALENDAR_WEEKS) {
          calendar = FAT_LOSS_BLOCK_MAX_CALENDAR_WEEKS;
          needDeficit = calendar - dietBreakAllowance(calendar);
          closedReason = 'ceiling';
        }
        if (calendar < BLOCK_MIN_CALENDAR_WEEKS && blocks.length > 0) {
          /* fewer than four weeks remain: absorb into the previous block.
             Nothing moves; the block simply runs long. */
          var prev = null, bi;
          for (bi = blocks.length - 1; bi >= 0; bi--) { if (blocks[bi].type === 'fat_loss') { prev = blocks[bi]; break; } }
          if (prev !== null) {
            prev.calendar_weeks = prev.calendar_weeks + calendar;
            prev.deficit_weeks = prev.calendar_weeks - dietBreakAllowance(prev.calendar_weeks);
            prev.end_day = prev.end_day + calendar * 7;
            prev.closed_reason = 'absorbed_remainder';
            day = day + calendar * 7;
          }
          phase = (phase === 'fat_loss_before_surplus' ? 'to_surplus' : 'done');
          continue;
        }

        var endWeight = weight * Math.pow(1 - mid, needDeficit);
        var lostLb = weight - endWeight;
        var fatLost = lostLb * fBlock;
        var endFatMass = fatMass - fatLost;

        counterDeficitWeeks = counterDeficitWeeks + needDeficit;
        counterPercentLost = (counterWindowBaseWeight - endWeight) / counterWindowBaseWeight;

        blocks.push({
          type: 'fat_loss',
          calendar_weeks: calendar,
          deficit_weeks: needDeficit,
          diet_break_allowance_weeks: dietBreakAllowance(calendar),
          start_day: day,
          end_day: day + calendar * 7 - 1,
          start_weight_lb: weight,
          end_weight_lb: endWeight,
          end_fat_mass_lb: endFatMass,
          end_body_fat_fraction: endFatMass / endWeight,
          rate_range_low_pct: rangeLow * 100,
          rate_range_high_pct: rangeHigh * 100,
          rate_midpoint_pct: mid * 100,
          f_used: fBlock,
          closed_reason: closedReason,
          deficit_weeks_since_reset: counterDeficitWeeks,
          percent_bodyweight_lost_since_reset: counterPercentLost * 100,
          client_label: 'Losing fat',
          row_kind: 'projected'
        });

        day = day + calendar * 7;
        weight = endWeight;
        fatMass = endFatMass;
        lastDeficitEndWeight = endWeight;

        if (closedReason === 'ceiling') {
          /* another fat loss block follows, so a mandatory maintenance sits
             between them */
          var mWeeks = maintenanceWeeksFor(ctx.answers, blocks.length);
          var after = pushMaintenance(blocks, day, weight, fatMass, mWeeks, true,
                                      counterDeficitWeeks, counterPercentLost);
          day = after.day; weight = after.weight; fatMass = after.fatMass;
          if (mWeeks >= COUNTER_RESET_MAINTENANCE_WEEKS) {
            counterDeficitWeeks = 0; counterPercentLost = 0; counterWindowBaseWeight = weight;
            blocks[blocks.length - 1].deficit_weeks_since_reset = 0;
            blocks[blocks.length - 1].percent_bodyweight_lost_since_reset = 0;
          }
          continue;
        }

        phase = (phase === 'fat_loss_before_surplus' ? 'to_surplus' : 'done');
        continue;
      }

      if (phase === 'to_surplus') {
        if (!ctx.wantsMuscleGrowth) { phase = 'done'; continue; }
        /* prep: a maintenance with a declared objective. Projected the same
           way as a maintenance — neutral plus one pound, once, because it
           follows a deficit. No mandatory maintenance in front of it. */
        var prepWeeks = ctx.answers.prep_weeks === undefined ? PREP_DEFAULT_WEEKS : ctx.answers.prep_weeks;
        if (prepWeeks < PREP_MIN_WEEKS) { prepWeeks = PREP_MIN_WEEKS; }
        if (prepWeeks > PREP_MAX_WEEKS) { prepWeeks = PREP_MAX_WEEKS; }
        weight = weight + MAINTENANCE_WEIGHT_ALLOWANCE_LB;
        blocks.push({
          type: 'muscle_growth_prep',
          calendar_weeks: prepWeeks,
          start_day: day,
          end_day: day + prepWeeks * 7 - 1,
          end_weight_lb: weight,
          end_fat_mass_lb: fatMass,
          end_body_fat_fraction: fatMass / weight,
          deficit_weeks_since_reset: counterDeficitWeeks,
          percent_bodyweight_lost_since_reset: counterPercentLost * 100,
          client_label: 'Getting ready to build',
          row_kind: 'projected'
        });
        day = day + prepWeeks * 7;

        var mgWeeks = ctx.answers.muscle_growth_weeks;
        if (mgWeeks === undefined) { break; }
        if (mgWeeks < MUSCLE_GROWTH_MIN_WEEKS) { mgWeeks = MUSCLE_GROWTH_MIN_WEEKS; }
        if (mgWeeks > MUSCLE_GROWTH_MAX_WEEKS) { mgWeeks = MUSCLE_GROWTH_MAX_WEEKS; }
        var mgEnd = weight * Math.pow(1 + MUSCLE_GROWTH_WEEKLY_RATE, mgWeeks);
        var gained = mgEnd - weight;
        fatMass = fatMass + gained * MUSCLE_GROWTH_FAT_SHARE;
        weight = mgEnd;
        hadMuscleGrowth = true;

        /* a muscle growth phase resets both counters; the block it ends on
           carries zero */
        counterDeficitWeeks = 0;
        counterPercentLost = 0;

        blocks.push({
          type: 'muscle_growth',
          calendar_weeks: mgWeeks,
          start_day: day,
          end_day: day + mgWeeks * 7 - 1,
          end_weight_lb: weight,
          end_fat_mass_lb: fatMass,
          end_body_fat_fraction: fatMass / weight,
          gained_lb: gained,
          gained_lean_lb: gained * MUSCLE_GROWTH_LEAN_SHARE,
          gained_fat_lb: gained * MUSCLE_GROWTH_FAT_SHARE,
          deficit_weeks_since_reset: 0,
          percent_bodyweight_lost_since_reset: 0,
          client_label: 'Building muscle',
          row_kind: 'projected'
        });
        day = day + mgWeeks * 7;

        /* muscle growth -> fat loss block: mandatory maintenance, and it does
           NOT get the pound, because food is coming down, not up */
        var mW = maintenanceWeeksFor(ctx.answers, blocks.length);
        var res = pushMaintenance(blocks, day, weight, fatMass, mW, false,
                                  counterDeficitWeeks, counterPercentLost);
        day = res.day; weight = res.weight; fatMass = res.fatMass;
        counterWindowBaseWeight = weight;

        phase = 'fat_loss_after_surplus';
        continue;
      }

      break;
    }

    /* lifestyle: reserved, never compressed, never moved */
    var lsWeeks = ctx.answers.lifestyle_weeks === undefined ? LIFESTYLE_DEFAULT_WEEKS : ctx.answers.lifestyle_weeks;
    if (lsWeeks < LIFESTYLE_MIN_WEEKS) { lsWeeks = LIFESTYLE_MIN_WEEKS; }
    if (lsWeeks > LIFESTYLE_MAX_WEEKS) { lsWeeks = LIFESTYLE_MAX_WEEKS; }
    var lifestyle = {
      type: 'lifestyle',
      calendar_weeks: lsWeeks,
      start_day: day,
      end_day: day + lsWeeks * 7 - 1,
      end_weight_lb: weight,
      end_fat_mass_lb: fatMass,
      end_body_fat_fraction: fatMass / weight,
      row_kind: 'projected'
    };

    var totalBody = 0, i;
    for (i = 0; i < blocks.length; i++) { totalBody = totalBody + blocks[i].calendar_weeks; }

    var summary = { fat_loss_weeks: 0, maintenance_weeks: 0, prep_weeks: 0, muscle_growth_weeks: 0,
                    total_weeks: totalBody, start_day: ctx.startDay, end_day: day - 1 };
    for (i = 0; i < blocks.length; i++) {
      if (blocks[i].type === 'fat_loss') { summary.fat_loss_weeks += blocks[i].calendar_weeks; }
      if (blocks[i].type === 'maintenance') { summary.maintenance_weeks += blocks[i].calendar_weeks; }
      if (blocks[i].type === 'muscle_growth_prep') { summary.prep_weeks += blocks[i].calendar_weeks; }
      if (blocks[i].type === 'muscle_growth') { summary.muscle_growth_weeks += blocks[i].calendar_weeks; }
    }

    /* display values for every block, emitted here so no screen ever rounds */
    for (i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      var n = i + 1;
      b.position = n;
      b.start_date_iso = isoFromDays(b.start_day);
      b.end_date_iso = isoFromDays(b.end_day);
      b.start_date_display = longDateFromDays(b.start_day);
      b.end_date_display = longDateFromDays(b.end_day);
      T.display['block.' + n + '.end_weight_lb'] = fixed(b.end_weight_lb, 1);
      T.display['block.' + n + '.end_body_fat_pct'] = fixed(b.end_body_fat_fraction * 100, 1);
      T.display['block.' + n + '.calendar_weeks'] = fixed(b.calendar_weeks, 0);
      if (b.type === 'muscle_growth' && n > 1) {
        /* The duration screen is ordered to show what the client gains, so the
           figure has to be handed over rounded like every other one. Until this
           existed the engine read gained_lb raw and rounded it itself, which the
           screen rules forbid outright. Taken from the two DISPLAYED weights and
           not from the raw difference: the coach reads prep ending at 180.7 and
           the build ending at 194.1, and a gain of 13.5 printed beside them is a
           tenth he has to account for. Raw 13.466 rounds to 13.5; the displayed
           weights give 13.4, and the displayed figure is the one he can check.
           Prep always precedes muscle growth, so block n-1 is the start. */
        displayDifference(T, 'block.' + n + '.gained_lb',
                          parseFloat(T.display['block.' + n + '.end_weight_lb']),
                          parseFloat(T.display['block.' + (n - 1) + '.end_weight_lb']), 1);
      }
      if (b.type === 'fat_loss') {
        T.display['block.' + n + '.deficit_weeks'] = fixed(b.deficit_weeks, 0);
        T.display['block.' + n + '.rate_range'] = fixed(b.rate_range_low_pct, 1) + '-' + fixed(b.rate_range_high_pct, 1) + '%';
        T.display['block.' + n + '.rate_midpoint_pct'] = fixed(b.rate_midpoint_pct, 1);
        /* the pounds that came off in this block: legitimate cause material on
           a maintenance screen, so it is emitted rather than worked out there */
        /* H-11 (seventh run), site 1. The exact mirror of gained_lb above, same n-1
           neighbour. Block 1 starts from the first deficit block weight, which is
           displayed under two different keys depending on the branch, so that operand
           is worked out rather than reached for by name. */
        b.weight_lost_lb = b.start_weight_lb - b.end_weight_lb;
        var startShown = (n > 1)
          ? parseFloat(T.display['block.' + (n - 1) + '.end_weight_lb'])
          : parseFloat(fixed(T.first_deficit_block_weight_lb, 1));
        displayDifference(T, 'block.' + n + '.weight_lost_lb',
                          startShown,
                          parseFloat(T.display['block.' + n + '.end_weight_lb']), 1);
      }
      T.display['block.' + n + '.deficit_weeks_since_reset'] = fixed(b.deficit_weeks_since_reset, 0);
      T.display['block.' + n + '.percent_bodyweight_lost_since_reset'] = fixed(b.percent_bodyweight_lost_since_reset, 1);
    }
    lifestyle.start_date_iso = isoFromDays(lifestyle.start_day);
    lifestyle.end_date_iso = isoFromDays(lifestyle.end_day);
    lifestyle.start_date_display = longDateFromDays(lifestyle.start_day);
    lifestyle.end_date_display = longDateFromDays(lifestyle.end_day);
    T.display['lifestyle.end_weight_lb'] = fixed(lifestyle.end_weight_lb, 1);
    T.display['lifestyle.end_body_fat_pct'] = fixed(lifestyle.end_body_fat_fraction * 100, 1);

    return {
      blocks: blocks,
      lifestyle: lifestyle,
      summary: summary,
      total_weeks: totalBody + lsWeeks,
      final_weight: weight,
      final_body_fat: fatMass / weight,
      had_muscle_growth: hadMuscleGrowth
    };
  }

  function maintenanceWeeksFor(answers, indexSoFar) {
    var key = 'maintenance_weeks_' + (indexSoFar + 1);
    if (answers[key] !== undefined) {
      var v = answers[key];
      if (v < MAINTENANCE_MIN_WEEKS) { v = MAINTENANCE_MIN_WEEKS; }
      if (v > MAINTENANCE_MAX_WEEKS) { v = MAINTENANCE_MAX_WEEKS; }
      return v;
    }
    return MAINTENANCE_DEFAULT_WEEKS;
  }

  /* A maintenance is weight-neutral plus one pound when it follows a deficit.
     A maintenance that follows a muscle growth phase does not get it — food is
     coming down, not up, and there is nothing left to refill.
     Fat mass does not change here, and the pound TRAVELS: the next block opens
     at the heavier weight. See the declared choice 'maintenance-pound-travels'
     for why, and for the cost that carries. */
  function pushMaintenance(blocks, day, weight, fatMass, weeks, comingOutOfDeficit,
                           counterWeeks, counterPercent) {
    var w = weight;
    if (comingOutOfDeficit) { w = w + MAINTENANCE_WEIGHT_ALLOWANCE_LB; }
    blocks.push({
      type: 'maintenance',
      calendar_weeks: weeks,
      start_day: day,
      end_day: day + weeks * 7 - 1,
      end_weight_lb: w,
      end_fat_mass_lb: fatMass,
      end_body_fat_fraction: fatMass / w,
      carried_allowance_lb: comingOutOfDeficit ? MAINTENANCE_WEIGHT_ALLOWANCE_LB : 0,
      deficit_weeks_since_reset: counterWeeks,
      percent_bodyweight_lost_since_reset: counterPercent * 100,
      client_label: 'Holding steady',
      row_kind: 'projected'
    });
    return { day: day + weeks * 7, weight: w, fatMass: fatMass };
  }

  /* --------------------------------------------------------------------------
     Weekly series and the band. The band widens ONLY in deficit weeks: it is
     carried across everything else at constant width.

     DECLARED BUILD CHOICE, flagged rather than hidden: nothing written fixes
     WHICH weeks inside a block are the non-deficit allowance weeks. Dates are
     deliberately not assigned to diet breaks. This places them at the end of
     the block. It moves no end figure — a block's landing depends on the COUNT
     of deficit weeks, not on where they sit — so it is presentation only.
     -------------------------------------------------------------------------- */
  function weeklySeries(T, plan, answers) {
    var rows = [];
    var i, w;
    var target = T.first_deficit_block_weight_lb;
    var fatMass = T.first_deficit_block_weight_lb * T.first_deficit_block_body_fat_fraction;
    var floor = target, ceiling = target;
    var weekNo = 0;

    if (T.foundational) {
      var fw = T.start.weight_lb;
      var ffm = T.start.weight_lb * T.start.body_fat_fraction;
      for (w = 1; w <= T.foundational.weeks; w++) {
        var before = fw;
        fw = fw * (1 - FOUNDATIONAL_WEEKLY_LOSS_RATE);
        ffm = ffm - (before - fw) * T.foundational.f_used;
        weekNo = weekNo + 1;
        rows.push({ week: weekNo, phase: 'foundational', target_lb: fw, floor_lb: fw, ceiling_lb: fw,
                    body_fat_fraction: ffm / fw });
      }
      target = fw; floor = fw; ceiling = fw; fatMass = ffm;
    }

    for (i = 0; i < plan.blocks.length; i++) {
      var b = plan.blocks[i];
      if (b.type === 'fat_loss') {
        var lowRate = b.rate_range_low_pct / 100;
        var highRate = b.rate_range_high_pct / 100;
        var midRate = b.rate_midpoint_pct / 100;
        if (lowRate < RATE_CALCULATION_FLOOR) { lowRate = RATE_CALCULATION_FLOOR; }
        var d;
        for (d = 1; d <= b.deficit_weeks; d++) {
          var prevW = target;
          target = target * (1 - midRate);
          fatMass = fatMass - (prevW - target) * b.f_used;
          floor = floor * (1 - highRate);   /* fastest loss -> lowest weight */
          ceiling = ceiling * (1 - lowRate);
          weekNo = weekNo + 1;
          rows.push({ week: weekNo, phase: 'fat_loss', target_lb: target, floor_lb: floor, ceiling_lb: ceiling,
                      body_fat_fraction: fatMass / target });
        }
        var flat;
        for (flat = 0; flat < b.calendar_weeks - b.deficit_weeks; flat++) {
          weekNo = weekNo + 1;
          rows.push({ week: weekNo, phase: 'diet_break', target_lb: target, floor_lb: floor, ceiling_lb: ceiling,
                      body_fat_fraction: fatMass / target });
        }
      } else if (b.type === 'muscle_growth') {
        var g;
        var bandLow = target - floor, bandHigh = ceiling - target;
        for (g = 1; g <= b.calendar_weeks; g++) {
          var prevG = target;
          target = target * (1 + MUSCLE_GROWTH_WEEKLY_RATE);
          fatMass = fatMass + (target - prevG) * MUSCLE_GROWTH_FAT_SHARE;
          weekNo = weekNo + 1;
          rows.push({ week: weekNo, phase: 'muscle_growth', target_lb: target,
                      floor_lb: target - bandLow, ceiling_lb: target + bandHigh,
                      body_fat_fraction: fatMass / target });
        }
        floor = target - bandLow; ceiling = target + bandHigh;
      } else {
        var bl = target - floor, bh = ceiling - target;
        var add = 0;
        if (b.type === 'maintenance') { add = b.carried_allowance_lb; }
        if (b.type === 'muscle_growth_prep') { add = MAINTENANCE_WEIGHT_ALLOWANCE_LB; }
        var k;
        for (k = 1; k <= b.calendar_weeks; k++) {
          /* fat mass is held flat here; see 'maintenance-pound-travels' */
          if (k === 1 && add > 0) { target = target + add; }
          weekNo = weekNo + 1;
          rows.push({ week: weekNo, phase: b.type, target_lb: target,
                      floor_lb: target - bl, ceiling_lb: target + bh,
                      body_fat_fraction: fatMass / target });
        }
        floor = target - bl; ceiling = target + bh;
      }
    }
    var l;
    for (l = 1; l <= plan.lifestyle.calendar_weeks; l++) {
      var bl2 = target - floor, bh2 = ceiling - target;
      weekNo = weekNo + 1;
      rows.push({ week: weekNo, phase: 'lifestyle', target_lb: target, floor_lb: target - bl2, ceiling_lb: target + bh2,
                  body_fat_fraction: fatMass / target });
    }
    return rows;
  }

  function waypoints(T, startDay) {
    var out = {};
    var pick = function (days, label) {
      /* day 0 is the first day of week one, so the week a day falls in is
         floor(days / 7) + 1 */
      var weekIndex = Math.floor(days / 7) + 1;
      if (weekIndex < 1) { weekIndex = 1; }
      if (T.weekly.length === 0) { return; }
      if (weekIndex > T.weekly.length) { return; }
      var r = T.weekly[weekIndex - 1];
      out[label] = { weight_lb: r.target_lb, body_fat_fraction: r.body_fat_fraction };
      T.display['waypoints.' + label + '.weight_lb'] = fixed(r.target_lb, 1);
      T.display['waypoints.' + label + '.body_fat_pct'] = fixed(r.body_fat_fraction * 100, 1);
    };
    pick(WAYPOINT_DAYS_SIX_MONTHS, 'six_months');
    pick(WAYPOINT_DAYS_TWELVE_MONTHS, 'twelve_months');
    return out;
  }

  /* --------------------------------------------------------------------------
     The data file. Numbering is the position of the block WITHIN BODY
     COMPOSITION. Foundational and Lifestyle are phases and live in the phase
     group with their own end figures; they are not blocks and never take a
     block number.
     -------------------------------------------------------------------------- */
  function buildDataFile(T, record, answers) {
    var f = {}, i;

    f['plan_start_weight_lb'] = fixed(T.plan.start_weight_lb, 1) + ' lb';
    f['plan_start_body_fat_pct'] = fixed(T.plan.start_body_fat_fraction * 100, 1) + ' %';
    f['plan_start_date'] = T.plan.start_date_iso;
    f['plan_end_weight_lb'] = fixed(T.plan.end_weight_lb, 1) + ' lb';
    f['plan_end_body_fat_pct'] = fixed(T.plan.end_body_fat_fraction * 100, 1) + ' %';
    f['plan_end_date'] = T.plan.end_date_iso;
    f['plan_total_change_lb'] = fixed(T.plan.total_change_lb, 1) + ' lb';
    f['plan_total_weeks'] = fixed(T.plan.total_weeks, 0) + ' weeks';
    f['plan_objective_adjusted'] = T.plan.objective_adjusted ? 'yes' : 'no';

    if (T.foundational) {
      f['phase_foundational_start_date'] = T.foundational.start_date_iso;
      f['phase_foundational_end_date'] = T.foundational.end_date_iso;
      f['phase_foundational_weeks'] = fixed(T.foundational.weeks, 0) + ' weeks';
      f['phase_foundational_end_weight_lb'] = fixed(T.foundational.end_weight_lb, 1) + ' lb';
      f['phase_foundational_end_body_fat_pct'] = fixed(T.foundational.end_body_fat_fraction * 100, 1) + ' %';
    }
    f['phase_body_composition_start_date'] = isoFromDays(T.body_composition.start_day);
    f['phase_body_composition_end_date'] = isoFromDays(T.body_composition.end_day);
    f['phase_body_composition_weeks'] = fixed(T.body_composition.total_weeks, 0) + ' weeks';
    f['phase_body_composition_fat_loss_weeks'] = fixed(T.body_composition.fat_loss_weeks, 0) + ' weeks';
    f['phase_body_composition_maintenance_weeks'] = fixed(T.body_composition.maintenance_weeks, 0) + ' weeks';
    f['phase_body_composition_prep_weeks'] = fixed(T.body_composition.prep_weeks, 0) + ' weeks';
    f['phase_body_composition_muscle_growth_weeks'] = fixed(T.body_composition.muscle_growth_weeks, 0) + ' weeks';
    f['phase_lifestyle_start_date'] = T.lifestyle.start_date_iso;
    f['phase_lifestyle_end_date'] = T.lifestyle.end_date_iso;
    f['phase_lifestyle_weeks'] = fixed(T.lifestyle.calendar_weeks, 0) + ' weeks';
    f['phase_lifestyle_end_weight_lb'] = fixed(T.lifestyle.end_weight_lb, 1) + ' lb';
    f['phase_lifestyle_end_body_fat_pct'] = fixed(T.lifestyle.end_body_fat_fraction * 100, 1) + ' %';

    for (i = 0; i < T.blocks.length; i++) {
      var b = T.blocks[i];
      var p = 'block_' + (i + 1) + '_';
      f[p + 'type'] = b.type;
      f[p + 'calendar_weeks'] = fixed(b.calendar_weeks, 0) + ' weeks';
      if (b.type === 'fat_loss') {
        f[p + 'deficit_weeks'] = fixed(b.deficit_weeks, 0) + ' deficit weeks';
        f[p + 'rate_range'] = fixed(b.rate_range_low_pct, 1) + '-' + fixed(b.rate_range_high_pct, 1) + ' %';
        f[p + 'rate_midpoint'] = fixed(b.rate_midpoint_pct, 1) + ' %';
        /* No calorie key here. H-11, closed: calories live on the rate-choice
           screen and nowhere else, so the data file gains no calorie field. */
      }
      f[p + 'start_date'] = b.start_date_iso;
      f[p + 'end_date'] = b.end_date_iso;
      f[p + 'client_label'] = b.client_label;
      f[p + 'end_weight_lb'] = fixed(b.end_weight_lb, 1) + ' lb';
      f[p + 'end_body_fat_pct'] = fixed(b.end_body_fat_fraction * 100, 1) + ' %';
      f[p + 'deficit_weeks_since_reset'] = fixed(b.deficit_weeks_since_reset, 0) + ' deficit weeks';
      f[p + 'percent_bodyweight_lost_since_reset'] = fixed(b.percent_bodyweight_lost_since_reset, 1) + ' %';
    }

    if (T.waypoints.six_months) {
      f['waypoint_six_months_weight_lb'] = fixed(T.waypoints.six_months.weight_lb, 1) + ' lb';
      f['waypoint_six_months_body_fat_pct'] = fixed(T.waypoints.six_months.body_fat_fraction * 100, 1) + ' %';
    }
    if (T.waypoints.twelve_months) {
      f['waypoint_twelve_months_weight_lb'] = fixed(T.waypoints.twelve_months.weight_lb, 1) + ' lb';
      f['waypoint_twelve_months_body_fat_pct'] = fixed(T.waypoints.twelve_months.body_fat_fraction * 100, 1) + ' %';
    }

    f['housekeeping_activity_factor_used'] = T.calories.activity_factor_name;
    f['housekeeping_activity_factor_multiplier'] = '' + T.calories.activity_factor_multiplier;
    f['housekeeping_activity_factor_client_selected'] = record.activity_level_selected;
    f['housekeeping_maintenance_calculation_weight_lb'] = fixed(T.calories.calculated_on_weight_lb, 1) + ' lb';
    f['housekeeping_start_date'] = T.plan.start_date_iso;
    /* H-2, the TRACE half. The token check is irreducibly an instruction: this file
       cannot enforce it, because it does not read the document, and the stop exists
       precisely when this file is ABSENT — there is nothing running that could
       refuse to run. What IS tractable is leaving a mark. When the engine went out
       to Drive and chose between two candidate solver files, WHICH ONE IT CHOSE was
       not visible anywhere. It is visible here now: whatever produced this data file
       says so in the data file. */
    f['housekeeping_solver_version'] = SOLVER_VERSION;

    return f;
  }

  /* --------------------------------------------------------------------------
     Candidates. A screen that offers options has to say where each one lands,
     and that is the sum again. One call, several tables, the same code.
     -------------------------------------------------------------------------- */
  function solveCandidates(input, answerKey, candidates) {
    var out = [], i, k;
    for (i = 0; i < candidates.length; i++) {
      var a = {};
      for (k in input.answers) { if (input.answers.hasOwnProperty(k)) { a[k] = input.answers[k]; } }
      if (answerKey === 'rate_range_1') {
        a.rate_range_1_low_pct = candidates[i].low;
        a.rate_range_1_high_pct = candidates[i].high;
      } else {
        a[answerKey] = candidates[i];
      }
      out.push({ candidate: candidates[i],
                 table: solve({ record: input.record, history: input.history, answers: a }) });
    }
    return out;
  }

  /* ==========================================================================
     5. ASSERTIONS
     ========================================================================== */

  /* ---- 5.1 STARTUP — a hard stop, not a warning ---------------------------
     Runs on hardcoded inputs before the solver emits anything. If any point
     fails, no table is emitted. This is what turns a broken transcription of
     this file from a silent failure into a stop. */

  var BASELINE = {
    input: { weight_lb: 212, body_fat_pct: 26, goal_body_fat_pct: 15, foundational_weeks: 10 },
    points: [
      { name: 'f at intake, before the ceiling', expected: 0.906, places: 3 },
      { name: 'f at intake, after the ceiling',  expected: 0.900, places: 3 },
      { name: 'post-foundational weight',        expected: 206.8, places: 1 },
      { name: 'post-foundational body fat',      expected: 24.4,  places: 1 },
      { name: 'f post-foundational',             expected: 0.887, places: 3 },
      { name: 'sizing estimate destination',     expected: 180.5, places: 1 }
    ]
  };

  function startupCheck() {
    var b = BASELINE.input;
    var results = [];
    var ok = true;

    var fmIntake = b.weight_lb * (b.body_fat_pct / 100);
    var fRaw = lbToKg(fmIntake) / (lbToKg(fmIntake) + FORBES_CONSTANT) + F_INTERVENTION_OFFSET;
    var fCapped = fRaw > F_CEILING ? F_CEILING : fRaw;
    var wPost = b.weight_lb * Math.pow(1 - FOUNDATIONAL_WEEKLY_LOSS_RATE, b.foundational_weeks);
    var fatPost = fmIntake - (b.weight_lb - wPost) * fCapped;
    var bfPost = fatPost / wPost;
    var fPost = fatFraction(fatPost);
    var dest = wPost - weightToLose(wPost, bfPost, b.goal_body_fat_pct / 100, fPost);

    var actual = [fRaw, fCapped, wPost, bfPost * 100, fPost, dest];
    var i;
    for (i = 0; i < BASELINE.points.length; i++) {
      var p = BASELINE.points[i];
      var got = roundTo(actual[i], p.places);
      var pass = (got === roundTo(p.expected, p.places));
      if (!pass) { ok = false; }
      results.push({ name: p.name, expected: p.expected, got: got, pass: pass });
    }

    var summary = '';
    for (i = 0; i < results.length; i++) {
      if (!results[i].pass) {
        summary = summary + results[i].name + ': expected ' + results[i].expected + ', got ' + results[i].got + '. ';
      }
    }
    return { ok: ok, points: results, summary: summary };
  }

  /* ---- 5.2 CUMULATIVE — an obligation, not a recommendation ---------------
     An arithmetic finding is not closed until its assertion is written here.
     Each entry names the finding it came from. An entry with status 'open'
     is a finding that is not closed and has a line waiting for it.

     Run these against a solved table after any change to this file. */

  var CUMULATIVE_ASSERTIONS = [

    { id: 'H-4 (fifth run)',
      status: 'closed',
      from: 'fifth run — the journey screen ran the goal formula instead of the resolved week counts',
      what: 'The plan total equals the sum of its own rows, and the landing equals the last row.',
      check: function (T) {
        var sum = (T.foundational ? T.foundational.weeks : 0), i;
        for (i = 0; i < T.blocks.length; i++) { sum = sum + T.blocks[i].calendar_weeks; }
        sum = sum + T.lifestyle.calendar_weeks;
        if (sum !== T.plan.total_weeks) { return 'total weeks ' + T.plan.total_weeks + ' does not equal the sum of rows ' + sum; }
        if (fixed(T.lifestyle.end_weight_lb, 1) !== fixed(T.plan.end_weight_lb, 1)) {
          return 'the landing does not equal the last row';
        }
        return null;
      } },

    { id: 'H-4b (fourth and fifth runs)',
      status: 'closed',
      from: 'fourth and fifth runs — the muscle growth duration table quoted a body fat the plan does not reach',
      what: 'The figures behind the muscle growth durations are read from where the surplus STARTS, which is the end of prep, and never from the sizing estimate.',
      check: function (T) {
        var i, prep = null, mg = null;
        for (i = 0; i < T.blocks.length; i++) {
          if (T.blocks[i].type === 'muscle_growth_prep') { prep = T.blocks[i]; }
          if (T.blocks[i].type === 'muscle_growth') { mg = T.blocks[i]; }
        }
        if (prep === null || mg === null) { return null; }
        var expectedGain = prep.end_weight_lb * (Math.pow(1 + MUSCLE_GROWTH_WEEKLY_RATE, mg.calendar_weeks) - 1);
        if (fixed(mg.gained_lb, 1) !== fixed(expectedGain, 1)) {
          return 'the muscle growth gain was not computed from the end of prep';
        }
        if (T.sizing_estimate && fixed(prep.end_body_fat_fraction * 100, 1) === fixed(T.sizing_estimate.estimated_destination_weight_lb, 1)) {
          return 'the surplus start was read from the sizing estimate';
        }
        return null;
      } },

    { id: 'H-9 (fifth run)',
      status: 'closed',
      from: 'fifth run — the step-down counter summed every deficit week in the plan and ignored the reset',
      what: 'A block that resets the counters ends at zero on both, and the block after a reset is measured from the reset and not from the start of the plan.',
      check: function (T) {
        var i;
        for (i = 0; i < T.blocks.length; i++) {
          var b = T.blocks[i];
          if (b.type === 'muscle_growth') {
            if (b.deficit_weeks_since_reset !== 0 || b.percent_bodyweight_lost_since_reset !== 0) {
              return 'a muscle growth phase did not reset both counters';
            }
            if (i + 1 < T.blocks.length && T.blocks[i + 1].deficit_weeks_since_reset !== 0) {
              return 'the block after a muscle growth phase carries a counter from before the reset';
            }
          }
          if (b.type === 'maintenance' && b.calendar_weeks >= COUNTER_RESET_MAINTENANCE_WEEKS) {
            if (b.deficit_weeks_since_reset !== 0) { return 'an 8-week-or-longer maintenance did not reset the counters'; }
          }
        }
        return null;
      } },

    { id: 'C-2 (fourth run)',
      status: 'closed',
      from: 'fourth run — which weight the maintenance calculation runs on',
      what: 'Maintenance and basal run on the weight the FIRST deficit block starts from — the post-foundational weight on a first run, today\'s weight on a rebuild.',
      check: function (T) {
        if (fixed(T.calories.calculated_on_weight_lb, 1) !== fixed(T.first_deficit_block_weight_lb, 1)) {
          return 'maintenance was calculated on a weight other than the one the first deficit block starts from';
        }
        return null;
      } },

    { id: 'D-1 (third run)',
      status: 'closed',
      from: 'third run — f recalculated after foundational against a rule that fixed it once',
      what: 'f has three scopes that do not overlap: one for foundational from the intake figures, one for the sizing estimate from the post-foundational figures, and one per fat loss block from what the plan projects at that block\'s start.',
      check: function (T) {
        var i;
        for (i = 0; i < T.blocks.length; i++) {
          var b = T.blocks[i];
          if (b.type !== 'fat_loss') { continue; }
          var expect = fatFraction(b.start_weight_lb * (i === 0 ? T.first_deficit_block_body_fat_fraction : (b.end_fat_mass_lb + (b.start_weight_lb - b.end_weight_lb) * b.f_used) / b.start_weight_lb));
          if (Math.abs(expect - b.f_used) > 0.0005) {
            return 'block ' + (i + 1) + ' did not recalculate f from its own starting figures';
          }
        }
        return null;
      } },

    /* ------------------------------------------------------------------
       CLOSED. This line was open and waiting; the decision was taken and
       the assertion is written. It holds both halves of the decision.
       ------------------------------------------------------------------ */
    { id: 'H-11 (fifth run)',
      status: 'closed',
      from: 'fifth run — a block\'s daily calories were computed on the maintenance of the post-foundational body, twenty pounds heavier than that block',
      what: 'Calories exist for one purpose: so the coach can pick the starting rate range. They govern nothing else, so they appear at the rate-choice point and NOWHERE else. No block carries a calorie figure anywhere — not on its object, not in a display value, not in the data file — and the field is absent rather than empty, by the rule of two states and not three.',
      check: function (T) {
        var i, k;

        /* half one: no block carries a calorie figure, anywhere */
        for (i = 0; i < T.blocks.length; i++) {
          if (T.blocks[i].daily_calories !== undefined) {
            return 'block ' + (i + 1) + ' carries a calorie figure on its object';
          }
        }
        for (k in T.display) {
          if (!T.display.hasOwnProperty(k)) { continue; }
          if (k.length >= 6 && k.substring(0, 6) === 'block.' && isCalorieKey(k)) {
            return 'a block emits a calorie display value: ' + k;
          }
        }
        if (T.data_file) {
          for (k in T.data_file) {
            if (!T.data_file.hasOwnProperty(k)) { continue; }
            if (k.length >= 6 && k.substring(0, 6) === 'block_' && isCalorieKey(k)) {
              return 'the data file carries a block calorie field: ' + k;
            }
          }
        }

        /* half two: every calorie figure the solver emits sits at the
           rate-choice point, and the five that belong there are all present */
        for (k in T.display) {
          if (!T.display.hasOwnProperty(k)) { continue; }
          if (!isCalorieKey(k)) { continue; }
          if (!(k.length >= 9 && k.substring(0, 9) === 'calories.')) {
            return 'a calorie figure is emitted outside the rate-choice point: ' + k;
          }
        }
        var required = ['calories.basal', 'calories.maintenance',
                        'calories.bands.0.daily_calories',
                        'calories.bands.1.daily_calories',
                        'calories.bands.2.daily_calories'];
        for (i = 0; i < required.length; i++) {
          if (T.display[required[i]] === undefined) {
            return 'the rate-choice point is missing a figure it must carry: ' + required[i];
          }
        }
        return null;
      } },

    { id: 'H-11 (seventh run)',
      status: 'closed',
      from: 'seventh run — the client image said about 8.6 lb come off between two displayed weights that subtract to 8.5, because this file carried TWO rounding conventions at once',
      what: 'ONE convention, and it does not enumerate the sites it knows about: it enumerates the FAMILY and checks every member. Every displayed figure that is a difference of two other displayed figures is worked out from those two, and declares itself as it is emitted. SEVEN sites carry the family and there are EIGHT occurrences against the validation fixture; SIX were changed and the seventh, the muscle growth gain, already held the convention and is the reference implementation the other six were copied from. That is why seven sites cost six edits.',
      check: function (T) {
        var i, k, m;
        var fam = T.difference_family === undefined ? [] : T.difference_family;

        /* half one: every declared member IS the difference of its two displayed operands */
        for (i = 0; i < fam.length; i++) {
          m = fam[i];
          if (T.display[m.key] !== fixed(m.abs ? Math.abs(m.a - m.b) : (m.a - m.b), m.places)) {
            return 'the displayed figure ' + m.key + ' is not the difference of its two displayed operands';
          }
        }

        /* half two: nothing emits a difference without declaring itself. This is the
           half that catches a site that does not exist yet. */
        for (k in T.display) {
          if (!T.display.hasOwnProperty(k)) { continue; }
          if (!namesADifference(k)) { continue; }
          /* the destination is a difference ONLY when a body fat goal governs; on the
             weight branch it is the goal weight itself and no subtraction happens */
          if (k === 'sizing_estimate.estimated_destination_weight_lb' &&
              T.goal && T.goal.governs === 'weight') { continue; }
          var declared = false;
          for (i = 0; i < fam.length; i++) { if (fam[i].key === k) { declared = true; } }
          if (!declared) {
            return 'a displayed difference was emitted without declaring itself to the family: ' + k;
          }
        }

        /* site 6 is corrected UPSTREAM of its display keys — the client range is built
           on the rounded difference and then widened by a pound either side — so it is
           not a direct member and is checked here by name. */
        if (T.foundational && T.display['foundational.client_range_low_lb'] !== undefined) {
          var shownLoss = roundTo(parseFloat(T.display['start.weight_lb']) -
                                  parseFloat(T.display['foundational.end_weight_lb']), 0);
          var wantLow = shownLoss - 1; if (wantLow < 1) { wantLow = 1; }
          if (T.display['foundational.client_range_low_lb'] !== fixed(wantLow, 0) ||
              T.display['foundational.client_range_high_lb'] !== fixed(shownLoss + 1, 0)) {
            return 'the client-facing foundational range was not built on the two displayed weights';
          }
        }
        return null;
      } }
  ];

  /* A display or data-file key that names a calorie figure. Kept next to the
     H-11 assertion because that is the only thing that reads it. */
  function isCalorieKey(key) {
    var needles = ['daily_calories', 'maintenance', 'basal'];
    var i, j;
    for (i = 0; i < needles.length; i++) {
      var n = needles[i];
      for (j = 0; j + n.length <= key.length; j++) {
        if (key.substring(j, j + n.length) === n) {
          /* the weight the maintenance was calculated on is a weight, not a
             calorie figure, and neither are the maintenance BLOCK's own fields */
          if (key.indexOf('calculated_on_weight') >= 0) { return false; }
          if (key.indexOf('maintenance_weeks') >= 0) { return false; }
          return true;
        }
      }
    }
    return false;
  }

  function runCumulativeAssertions(T) {
    var out = [], i;
    for (i = 0; i < CUMULATIVE_ASSERTIONS.length; i++) {
      var a = CUMULATIVE_ASSERTIONS[i];
      if (a.status !== 'closed') { out.push({ id: a.id, status: a.status, failure: null }); continue; }
      var res = a.check(T);
      out.push({ id: a.id, status: res === null ? 'pass' : 'FAIL', failure: res });
    }
    return out;
  }

  /* ==========================================================================
     6. THE ORPHAN CHECK
     Validation only. Never runs in a real session; the coach does not see it,
     does not call it and does not know it exists.

     The transcript is PASTED BY HAND. This never reads the engine's own
     context: an engine that hands itself the transcript is auditing itself and
     transcribing at the same time, which is the failure already traced with
     the images.
     ========================================================================== */

  /* Fixed false positives: sources that legitimately put a number on a screen
     without the solver having produced it. This list is maintained — every new
     false positive that turns up gets added here with its reason. */
  var MODEL_CONSTANTS_NAMED_IN_PROSE = [
    '0.25', '0.3', '40', '60', '24', '4', '0.4', '2', '35',
    '1.2', '1.375', '1.55', '1.725', '1.9', '12', '16', '20', '32', '10', '8', '3',
    '0.5', '0.6', '0.7', '0.8', '0.9', '1.0', '100', '104'
  ];

  function isDigit(c) { return c >= '0' && c <= '9'; }

  /* Scans a transcript and returns every number that appears in it, with the
     text around it. Written as a character scanner rather than a pattern so it
     ports without a regular-expression dialect coming with it. */
  function extractNumbers(text) {
    var out = [];
    var i = 0, n = text.length;
    while (i < n) {
      var c = text.charAt(i);
      if (!isDigit(c)) { i = i + 1; continue; }
      var start = i;
      var buf = '';
      var seenDecimal = false;
      while (i < n) {
        var ch = text.charAt(i);
        if (isDigit(ch)) { buf = buf + ch; i = i + 1; continue; }
        if ((ch === ',' || ch === '.') && i + 1 < n && isDigit(text.charAt(i + 1))) {
          /* a separator only continues the number when digits follow */
          var isThousands = (ch === ',' &&
                             i + 3 < n && isDigit(text.charAt(i + 1)) && isDigit(text.charAt(i + 2)) && isDigit(text.charAt(i + 3)) &&
                             !(i + 4 < n && isDigit(text.charAt(i + 4))));
          if (isThousands) { i = i + 1; continue; }        /* skip the separator */
          if (seenDecimal) { break; }
          seenDecimal = true;
          buf = buf + '.';
          i = i + 1;
          continue;
        }
        break;
      }
      var ctxStart = start - 40; if (ctxStart < 0) { ctxStart = 0; }
      var ctxEnd = i + 40; if (ctxEnd > n) { ctxEnd = n; }
      out.push({ raw: text.substring(start, i), value: buf, context: text.substring(ctxStart, ctxEnd) });
    }
    return out;
  }

  /* Figures are compared AT THE PRECISION THEY WERE WRITTEN. 18.0 and 18 are
     not the same entry: one is a body fat percentage and the other is a day of
     the month, and treating them as equal is what let H-4b through the first
     time this was built. The rounding rule fixes the precision of every output
     already, so a screen citing a figure at a precision the solver never
     emitted is itself worth looking at. */
  function canonical(numericString) {
    var s = numericString;
    var i = 0;
    while (i < s.length - 1 && s.charAt(i) === '0' && s.charAt(i + 1) !== '.') { i = i + 1; }
    return s.substring(i);
  }

  /* Walks any value and enters every number inside it. No regular expressions
     and no type inspection beyond typeof, so it ports with the rest of the file. */
  function addEveryNumberIn(set, value) {
    var k, i, nums;
    if (value === undefined || value === null) { return set; }
    if (typeof value === 'number') { set[canonical('' + value)] = true; return set; }
    if (typeof value === 'string') {
      nums = extractNumbers(value);
      for (i = 0; i < nums.length; i++) { set[canonical(nums[i].value)] = true; }
      return set;
    }
    if (typeof value === 'object') {
      if (Object.prototype.toString.call(value) === '[object Array]') {
        for (i = 0; i < value.length; i++) { addEveryNumberIn(set, value[i]); }
        return set;
      }
      for (k in value) {
        if (!value.hasOwnProperty(k)) { continue; }
        /* Form item IDs are metadata, not an answer the client gave. On the
           Marcus fixture they are 68 of the 92 entries this walk would
           otherwise add, and a nine-digit form key can never be a figure on
           a screen. */
        if (k === 'item_id') { continue; }
        addEveryNumberIn(set, value[k]);
      }
    }
    return set;
  }

  /* Blanks file-name timestamps of the shape yyyy-mm-dd hh.mm.ss before the
     transcript is scanned. A character walk and not a pattern, because this
     file carries no regular expressions. The data file names carry one each,
     and on the first run of this check they came back as 17, 22.27 and 22.42. */
  function blankFileTimestamps(text) {
    var out = '', i = 0, j, ok, c, shape = 'dddd-dd-dd dd.dd.dd';
    while (i < text.length) {
      ok = (i + shape.length <= text.length);
      if (ok) {
        for (j = 0; j < shape.length; j++) {
          c = text.charAt(i + j);
          if (shape.charAt(j) === 'd') { if (!isDigit(c)) { ok = false; break; } }
          else if (c !== shape.charAt(j)) { ok = false; break; }
        }
      }
      if (ok) { out = out + ' '; i = i + shape.length; }
      else { out = out + text.charAt(i); i = i + 1; }
    }
    return out;
  }

  /* Blanks whole URLs before the transcript is scanned. A Google document or
     folder ID is a long run of characters that carries digits, and those digits
     are not figures on a screen — they are an address. They produced three of
     the six orphans on the seventh run, and the class appeared then because the
     closing list had just started carrying links.

     THIS DELIBERATELY HAS NO SHAPE. The first form of this fix anchored on the
     document path and so missed folder URLs, which the closing list also
     carries; against the fixture both forms returned the SAME orphan count and
     only a control built with a folder ID containing digits separated them. A
     remedy for a blindness class has to be tried against a case built to fail
     it, never against the fixture. So this anchors on 'http' and consumes to
     the next space, which covers both of today's URL forms and any that turns
     up tomorrow.

     HONEST LIMIT, KEPT: a bare ID sitting outside a URL still orphans. That is
     the price of anchoring on something real instead of guessing at a shape. */
  function blankUrls(text) {
    var out = '', i = 0, j, ok, n = text.length;
    var mark = 'http';
    while (i < n) {
      ok = (i + mark.length <= n);
      if (ok) {
        for (j = 0; j < mark.length; j++) {
          if (text.charAt(i + j) !== mark.charAt(j)) { ok = false; break; }
        }
      }
      if (ok) {
        /* consume to the next space, or to the end of the text */
        while (i < n && text.charAt(i) !== ' ' && text.charAt(i) !== '\n' &&
               text.charAt(i) !== '\t' && text.charAt(i) !== '\r') { i = i + 1; }
        out = out + ' ';
      } else {
        out = out + text.charAt(i); i = i + 1;
      }
    }
    return out;
  }

  function buildReferenceSet(T, record) {
    var set = {}, k, i;
    /* A figure enters the reference set at the precision the solver emitted it
       and at no other. Widening it — accepting 18 where the solver emitted
       17.7 — masks the exact class of finding this check exists to catch, and
       it masked H-4b the first time this was tried. The rounding rule already
       fixes the precision of every output, so a screen citing a figure at a
       different precision is itself a finding. */
    var add = function (v) {
      if (v === undefined || v === null) { return; }
      /* a display value can be composite — a rate range is "0.3-0.5%" — so it
         contributes each of its own figures */
      var nums = extractNumbers('' + v), q;
      for (q = 0; q < nums.length; q++) { set[canonical(nums[q].value)] = true; }
    };

    /* every display value the solver produced */
    for (k in T.display) { if (T.display.hasOwnProperty(k)) { add(T.display[k]); } }

    /* dates, which appear as day and year numbers */
    for (i = 0; i < T.blocks.length; i++) {
      var b = T.blocks[i];
      var c1 = civilFromDays(b.start_day), c2 = civilFromDays(b.end_day);
      add(c1.d); add(c1.y); add(c2.d); add(c2.y);
    }
    if (T.foundational) {
      var f1 = civilFromDays(T.foundational.start_day), f2 = civilFromDays(T.foundational.end_day);
      add(f1.d); add(f1.y); add(f2.d); add(f2.y);
    }
    var l1 = civilFromDays(T.lifestyle.start_day), l2 = civilFromDays(T.lifestyle.end_day);
    add(l1.d); add(l1.y); add(l2.d); add(l2.y);

    /* EVERY figure the record holds, both layers, walked whole. The client gave
       these and nobody calculates them, so naming fields one by one only ever
       produced avoidable orphans: the steps bucket and the client's own quoted
       prose both came back as orphans on the first run of this check, because
       neither was named here. This is NOT the widening the comment above warns
       against — that one is about accepting a DERIVED figure at a precision the
       solver did not emit. These are inputs. Nothing the engine could get wrong
       hides behind them. Measured on the Marcus fixture: 9 entries before, 30
       after, and every one of the 21 new ones is something the client wrote. */
    addEveryNumberIn(set, record);

    /* constants of the model, named in prose */
    for (i = 0; i < MODEL_CONSTANTS_NAMED_IN_PROSE.length; i++) { add(MODEL_CONSTANTS_NAMED_IN_PROSE[i]); }

    return set;
  }

  /* Same as buildReferenceSet, merging into a set that already exists, so a
     second resolved table adds its figures instead of replacing them. */
  function buildReferenceSet2(set, T, record) {
    var more = buildReferenceSet(T, record), k;
    for (k in more) { if (more.hasOwnProperty(k)) { set[k] = true; } }
    return set;
  }

  /* Numbers the coach wrote or chose. Handed in explicitly rather than guessed. */
  function addCoachAnswers(set, answers) {
    var k;
    for (k in answers) {
      if (!answers.hasOwnProperty(k)) { continue; }
      var v = answers[k];
      if (typeof v === 'number') { set[canonical('' + v)] = true; }
      if (typeof v === 'string') {
        var nums = extractNumbers(v), i;
        for (i = 0; i < nums.length; i++) { set[canonical(nums[i].value)] = true; }
      }
    }
    return set;
  }

  /*
    orphanCheck(transcript, input, also)
      transcript — the run transcript, PASTED BY HAND
      input      — { record, history, answers } exactly as the run was driven
      also       — OPTIONAL array of further { record, history, answers } inputs
                   whose resolved tables also count as sources. THREE things need
                   it. The first run of this check found the first two; the
                   seventh run found the third:

                   (1) THE OPTIONS THE ENGINE OFFERED ON SCREEN. The foundational
                       lengths and the muscle growth duration table come from the
                       candidates call, which resolves one plan per option. Those
                       figures are on screen, are correct, and orphan every time.
                       Pass the same input carrying each option's own answer.

                   (2) A RUN WITH A RETURN PATH HAS TWO RESOLVED TABLES. Pass the
                       second generation here. Adding both tables to one
                       reference set is the same thing as running the check once
                       per generation and intersecting the two orphan lists — a
                       figure survives only if NO generation produced it — in one
                       pass instead of two, and without the intersection done by
                       hand.

                   (3) THE PARTIAL PLANS THE ENGINE SHOWS WHILE IT BUILDS. A
                       plan resolved with an answer still missing is NOT one of
                       the options in (1): an option is a candidate being
                       offered, and this is the plan as it stands at that
                       moment, with a question still open. Both reach the
                       screen and only the first was covered, so the seventh
                       run raised three orphans of this kind and every one of
                       them was a correct figure of an intermediate state. Two
                       inputs cover it: the plan resolved with muscle_growth
                       unanswered, and the plan resolved with muscle_growth
                       chosen and rate_range_2 unanswered. Without them the
                       same three come back.

                   This parameter finds nothing on its own. It receives what it
                   is given, so the run protocol has to name what goes in it.

    Returns a LIST TO REVIEW, not a pass or a fail. An orphan is an entry to
    resolve, as a finding or as a false positive with its reason written. A
    legitimate orphan blocks nothing.
  */
  function orphanCheck(transcript, input, also) {
    var T = solve(input);
    var set = buildReferenceSet(T, input.record);
    set = addCoachAnswers(set, input.answers);

    var extra = (also === undefined || also === null) ? [] : also;
    var x, Tx;
    for (x = 0; x < extra.length; x++) {
      Tx = solve(extra[x]);
      set = buildReferenceSet2(set, Tx, extra[x].record);
      set = addCoachAnswers(set, extra[x].answers);
    }

    var found = extractNumbers(blankUrls(blankFileTimestamps(transcript)));
    var orphans = [];
    var seen = {};
    var i;
    for (i = 0; i < found.length; i++) {
      var c = canonical(found[i].value);
      if (set.hasOwnProperty(c)) { continue; }
      if (seen.hasOwnProperty(c)) { continue; }
      seen[c] = true;
      orphans.push({ figure: found[i].raw, context: found[i].context, resolution: '' });
    }
    return {
      ran: true,
      answers_fingerprint: T.answers_fingerprint,
      numbers_in_transcript: found.length,
      orphans: orphans,
      note: 'This is a list to review, not a verdict. Resolve every entry as a finding or as a false positive, with its reason written. A run whose log does not carry this section is an incomplete run.'
    };
  }

  /* ========================================================================== */

  return {
    VERSION: SOLVER_VERSION,
    solve: solve,
    solveCandidates: solveCandidates,
    startupCheck: startupCheck,
    cumulativeAssertions: CUMULATIVE_ASSERTIONS,
    declaredModelChoices: DECLARED_MODEL_CHOICES,
    runCumulativeAssertions: runCumulativeAssertions,
    orphanCheck: orphanCheck,
    RATE_RANGES: RATE_RANGES,
    ACTIVITY_FACTORS: ACTIVITY_FACTORS,
    MUSCLE_GROWTH_DURATION_CANDIDATES: MUSCLE_GROWTH_DURATION_CANDIDATES,
    _internal: {
      fatFraction: fatFraction,
      weightToLose: weightToLose,
      deficitWeeksFor: deficitWeeksFor,
      calendarWeeksHolding: calendarWeeksHolding,
      dietBreakAllowance: dietBreakAllowance,
      isoFromDays: isoFromDays,
      daysFromIso: daysFromIso,
      longDateFromDays: longDateFromDays,
      fixed: fixed,
      roundTo: roundTo
    }
  };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = ROADMAP_SOLVER; }
