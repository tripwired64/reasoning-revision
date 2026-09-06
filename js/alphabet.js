/* Alphabet Codes: question generator.
 *
 * A question is:
 *   { id, given: ['TE','VC','XA','ZY'], answer: 'BW', options: ['BX','AW','AX','BW','AZ'],
 *     explain: [ {html} ... ], source }
 * Options are always 5 and the answer is somewhere among them.
 */
(function (global) {
  'use strict';

  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const idx = (c) => ALPHA.indexOf(c);
  const wrap = (n) => ((n % 26) + 26) % 26;
  const letter = (n) => ALPHA[wrap(n)];
  const signed = (n) => (n > 0 ? '+' + n : String(n));

  const rand = (n) => Math.floor(Math.random() * n);
  const pick = (arr) => arr[rand(arr.length)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /* ---------- Step patterns ---------- */
  // Each returns { steps: [...], rule: 'plain English', next: number }
  // `steps` are the jumps between the GIVEN letters; `next` is the jump to the answer.

  function constantPattern(count) {
    const s = pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]);
    return {
      steps: Array(count).fill(s),
      next: s,
      rule: `the jump is the same every time (${signed(s)})`,
    };
  }

  function growingPattern(count) {
    const dir = pick([1, -1]);
    const start = pick([1, 1, 2]);
    const steps = Array.from({ length: count }, (_, i) => dir * (start + i));
    return {
      steps,
      next: dir * (start + count),
      rule: `the jumps get bigger by 1 each time`,
    };
  }

  function shrinkingPattern(count) {
    const dir = pick([1, -1]);
    const start = count + pick([1, 2]);
    const steps = Array.from({ length: count }, (_, i) => dir * (start - i));
    return {
      steps,
      next: dir * (start - count),
      rule: `the jumps get smaller by 1 each time`,
    };
  }

  function alternatingPattern(count) {
    let a = pick([1, 2, 3, 4, 5]);
    let b = pick([1, 2, 3, 4, 5]);
    if (a === b) b = (b % 5) + 1;
    const sa = pick([1, -1]);
    const sb = pick([1, -1, sa]);
    const pair = [sa * a, sb * b];
    const steps = Array.from({ length: count }, (_, i) => pair[i % 2]);
    return {
      steps,
      next: pair[count % 2],
      rule: `the jumps take turns: ${signed(pair[0])}, ${signed(pair[1])}, ${signed(pair[0])}, ${signed(pair[1])}...`,
    };
  }

  function pairsPattern(count) {
    // Letters come in doubles: S S P P M M -> J. Needs an even number of given letters.
    const s = pick([-4, -3, -2, 2, 3, 4]);
    const steps = Array.from({ length: count }, (_, i) => (i % 2 === 0 ? 0 : s));
    return {
      steps,
      next: count % 2 === 0 ? 0 : s,
      rule: `the letters come in matching pairs, and each new pair jumps ${signed(s)}`,
    };
  }

  const FAMILIES = {
    easy: [constantPattern, constantPattern, constantPattern, alternatingPattern],
    mixed: [constantPattern, constantPattern, growingPattern, alternatingPattern, shrinkingPattern, pairsPattern],
    hard: [growingPattern, shrinkingPattern, alternatingPattern, pairsPattern, constantPattern],
  };

  /* ---------- Build one letter position ---------- */
  function buildPosition(difficulty, count) {
    for (let attempt = 0; attempt < 40; attempt++) {
      let fam = pick(FAMILIES[difficulty]);
      if (fam === pairsPattern && count % 2 !== 0) fam = constantPattern;
      // Growing or shrinking jumps beyond 5 letters don't appear on the paper; keep those to 4 jumps.
      if ((fam === growingPattern || fam === shrinkingPattern) && count > 4) fam = alternatingPattern;
      const pat = fam(count);
      const start = rand(26);
      const raw = [start];
      for (const s of pat.steps) raw.push(raw[raw.length - 1] + s);
      const rawNext = raw[raw.length - 1] + pat.next;
      const wrapped = [...raw, rawNext].some((n) => n < 0 || n > 25);
      if (difficulty === 'easy' && wrapped) continue;
      if (difficulty === 'hard' && !wrapped && attempt < 20) continue; // prefer wrap-arounds on hard
      return {
        letters: raw.map(letter),
        answer: letter(rawNext),
        rawNext,
        steps: pat.steps,
        next: pat.next,
        rule: pat.rule,
        wrapped,
      };
    }
    // Fallback: simple constant, whatever it wraps.
    const pat = constantPattern(count);
    const raw = [rand(26)];
    for (const s of pat.steps) raw.push(raw[raw.length - 1] + s);
    const rawNext = raw[raw.length - 1] + pat.next;
    return {
      letters: raw.map(letter),
      answer: letter(rawNext),
      rawNext,
      steps: pat.steps,
      next: pat.next,
      rule: pat.rule,
      wrapped: false,
    };
  }

  // Does moving `step` from the letter `from` cross the end of the alphabet?
  function crosses(from, step) {
    const n = idx(from) + step;
    return n < 0 || n > 25;
  }

  /* ---------- Number-line style picture of one row ----------
   * Letters sit on a line; a crescent arc joins each pair with the jump written on it.
   * The final arc (to the answer) is dashed and the answer letter is highlighted.
   * pos = { letters: ['T','V','X','Z'], steps: [2,2,2], next: 2, answer: 'B' }
   */
  function jumpPicture(pos) {
    const all = [...pos.letters, pos.answer];
    const steps = [...pos.steps, pos.next];
    // Line across the middle; arcs and jump labels above it, letters below it.
    const gap = 52, pad = 22, baseY = 44, arcTop = 14, labelY = 12, letterY = 68;
    const w = pad * 2 + gap * (all.length - 1);
    const h = 76;
    const x = (i) => pad + i * gap;
    let svg = `<svg class="jumps" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${all.join(' ')}">`;
    svg += `<line x1="${pad - 12}" y1="${baseY}" x2="${w - pad + 12}" y2="${baseY}" class="jl-line"/>`;
    steps.forEach((st, i) => {
      const x1 = x(i), x2 = x(i + 1), mx = (x1 + x2) / 2;
      const last = i === steps.length - 1;
      svg += `<path d="M ${x1} ${baseY - 4} Q ${mx} ${arcTop} ${x2} ${baseY - 4}" class="jl-arc${last ? ' last' : ''}"/>`;
      svg += `<text x="${mx}" y="${labelY}" text-anchor="middle" class="jl-step${last ? ' last' : ''}">${signed(st)}</text>`;
    });
    all.forEach((l, i) => {
      const last = i === all.length - 1;
      svg += `<circle cx="${x(i)}" cy="${baseY}" r="3" class="jl-dot${last ? ' last' : ''}"/>`;
      svg += `<text x="${x(i)}" y="${letterY}" text-anchor="middle" class="jl-letter${last ? ' last' : ''}">${l}</text>`;
    });
    svg += '</svg>';
    return `<div class="picture">${svg}</div>`;
  }

  function explainPosition(which, pos) {
    const last = pos.letters[pos.letters.length - 1];

    // Notes for any jump inside the given letters that went round the end.
    const midNotes = [];
    pos.steps.forEach((s, i) => {
      if (crosses(pos.letters[i], s)) {
        midNotes.push(`${pos.letters[i]} ${signed(s)} goes round the end of the alphabet to ${pos.letters[i + 1]}`);
      }
    });
    const midNote = midNotes.length ? ` Notice ${midNotes.join(', and ')}.` : '';

    let wrapNote = '';
    if (crosses(last, pos.next)) {
      wrapNote = pos.next > 0
        ? ` Going forwards past Z carries on from A, so you land on ${pos.answer}.`
        : ` Going backwards past A carries on from Z, so you land on ${pos.answer}.`;
    }
    return (
      `<p><strong>${which} letters:</strong></p>` +
      jumpPicture(pos) +
      `<p>${pos.rule.charAt(0).toUpperCase() + pos.rule.slice(1)}.${midNote} ` +
      `The next jump is <strong>${signed(pos.next)}</strong>: ${last} ${signed(pos.next)} = <strong>${pos.answer}</strong>.${wrapNote}</p>`
    );
  }

  // Build the full explanation for a question from its two rows.
  function explainQuestion(first, second, intro) {
    return (intro ? `<p>${intro}</p>` : '') +
      explainPosition('First', first) + explainPosition('Second', second) +
      `<p>Put them together: <strong>${first.answer + second.answer}</strong>.</p>`;
  }

  // A hint shows the first-letter row and its jumps, but not the answer.
  function hintFor(pos) {
    return `Look at the first letters only: ${pos.letters.join(' ')}. The jumps are ${pos.steps.map(signed).join(', ')}. ` +
      `Work out the next jump, then do the same for the second letters.`;
  }

  /* ---------- Distractors ---------- */
  function makeOptions(first, second) {
    const correct = first.answer + second.answer;
    const a = idx(first.answer);
    const b = idx(second.answer);
    // Plausible wrong answers: one letter right, the other off by a bit; or both slightly off.
    const candidates = shuffle([
      letter(a + 1) + second.answer,
      letter(a - 1) + second.answer,
      first.answer + letter(b + 1),
      first.answer + letter(b - 1),
      letter(a + 2) + second.answer,
      first.answer + letter(b - 2),
      letter(a - first.next) + second.answer, // forgot to move the first letter
      first.answer + letter(b - second.next), // forgot to move the second letter
      letter(a + 1) + letter(b - 1),
      letter(a - 1) + letter(b + 1),
    ]);
    const options = [correct];
    for (const c of candidates) {
      if (options.length === 5) break;
      if (!options.includes(c)) options.push(c);
    }
    return shuffle(options);
  }

  /* ---------- Public: generate ---------- */
  let counter = 0;
  function generate(difficulty) {
    difficulty = FAMILIES[difficulty] ? difficulty : 'mixed';
    const count = difficulty === 'hard' ? pick([3, 4, 5]) : pick([3, 4]); // number of jumps between given pairs
    const first = buildPosition(difficulty, count);
    let second = buildPosition(difficulty, count);
    // Avoid both rows being identical letters (looks silly).
    if (second.letters.join('') === first.letters.join('')) second = buildPosition(difficulty, count);

    const given = first.letters.map((l, i) => l + second.letters[i]);
    const answer = first.answer + second.answer;
    counter += 1;
    return {
      id: 'gen-' + counter,
      source: 'Practice',
      given,
      answer,
      options: makeOptions(first, second),
      explain: explainQuestion(first, second),
      hint: hintFor(first),
    };
  }

  global.AlphabetCodes = { generate };
})(window);
