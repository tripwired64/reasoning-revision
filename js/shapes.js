/* Non-verbal reasoning: a small shape engine plus two generators.
 *
 * A figure is a plain object:
 *   { shape, fill, size, rot, mark, dots }
 *   shape: triangle | square | pentagon | hexagon | heptagon | octagon | circle | star | arrow | tee
 *   fill:  white | grey | black | stripes
 *   size:  s | m | l
 *   rot:   degrees, clockwise on screen
 *   mark:  null or a frame corner 0..3 (top-left, top-right, bottom-right, bottom-left) holding a small black square
 *   dots:  0..4 small dots along the bottom of the frame
 *
 * figureSvg(fig) draws one frame. sequence() and transformation() build questions with explanations.
 */
(function (global) {
  'use strict';

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
  const clone = (f) => Object.assign({}, f);
  const key = (f) => [f.shape, f.fill, f.size, ((f.rot % 360) + 360) % 360, f.mark, f.dots].join('|');

  const POLY = { triangle: 3, square: 4, pentagon: 5, hexagon: 6, heptagon: 7, octagon: 8 };
  const BASIC = ['triangle', 'square', 'pentagon', 'hexagon', 'circle', 'star', 'arrow', 'tee'];
  const ROTATABLE = ['arrow', 'tee', 'triangle'];
  const FILLS = ['white', 'grey', 'black', 'stripes'];
  const SIZES = ['s', 'm', 'l'];
  const RADIUS = { s: 16, m: 24, l: 32 };
  const FILL_WORD = { white: 'white', grey: 'grey', black: 'black', stripes: 'striped' };
  const SIZE_WORD = { s: 'small', m: 'medium', l: 'large' };
  const CORNER_WORD = ['top left', 'top right', 'bottom right', 'bottom left'];

  /* ---------- Drawing ---------- */
  let uid = 0;
  function shapeElement(shape, r) {
    if (shape === 'circle') return `<circle r="${r}"/>`;
    let pts = [];
    if (POLY[shape]) {
      const n = POLY[shape];
      // Squares and octagons sit flat; the others have a point at the top.
      const offset = n === 4 ? 45 : n === 8 ? 22.5 : 0;
      for (let i = 0; i < n; i++) {
        const a = (-90 + offset + (360 / n) * i) * Math.PI / 180;
        pts.push([r * Math.cos(a), r * Math.sin(a)]);
      }
    } else if (shape === 'star') {
      for (let i = 0; i < 10; i++) {
        const rr = i % 2 === 0 ? r : r * 0.45;
        const a = (-90 + 36 * i) * Math.PI / 180;
        pts.push([rr * Math.cos(a), rr * Math.sin(a)]);
      }
    } else if (shape === 'arrow') {
      pts = [[0, -r], [r * 0.7, -r * 0.15], [r * 0.28, -r * 0.15], [r * 0.28, r], [-r * 0.28, r], [-r * 0.28, -r * 0.15], [-r * 0.7, -r * 0.15]];
    } else if (shape === 'tee') {
      pts = [[-r, -r], [r, -r], [r, -r * 0.45], [r * 0.28, -r * 0.45], [r * 0.28, r], [-r * 0.28, r], [-r * 0.28, -r * 0.45], [-r, -r * 0.45]];
    }
    return `<polygon points="${pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}"/>`;
  }

  // One 90x90 frame. `blank` draws a question mark instead of a figure.
  function figureSvg(fig, blank) {
    uid += 1;
    const id = 'st' + uid;
    let inner = '';
    if (blank) {
      inner = '<text x="45" y="56" text-anchor="middle" class="fig-q">?</text>';
    } else {
      const r = RADIUS[fig.size];
      const fill = fig.fill === 'stripes' ? `url(#${id})` : fig.fill === 'grey' ? '#b8bec8' : fig.fill === 'black' ? '#1b1f24' : '#ffffff';
      inner =
        `<defs><pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
        `<rect width="5" height="5" fill="#fff"/><line x1="0" y1="0" x2="0" y2="5" stroke="#1b1f24" stroke-width="1.6"/></pattern></defs>` +
        `<g transform="translate(45 45) rotate(${fig.rot || 0})" fill="${fill}" stroke="#1b1f24" stroke-width="2" stroke-linejoin="round">` +
        shapeElement(fig.shape, r) + '</g>';
      if (fig.mark !== null && fig.mark !== undefined) {
        const pos = [[6, 6], [74, 6], [74, 74], [6, 74]][fig.mark];
        inner += `<rect x="${pos[0]}" y="${pos[1]}" width="10" height="10" fill="#1b1f24"/>`;
      }
      if (fig.dots) {
        const startX = 45 - (fig.dots - 1) * 5;
        for (let i = 0; i < fig.dots; i++) inner += `<circle cx="${startX + i * 10}" cy="84" r="2.6" fill="#1b1f24"/>`;
      }
    }
    return `<svg class="fig" viewBox="0 0 90 90" role="img"><rect x="1" y="1" width="88" height="88" rx="6" class="fig-frame"/>${inner}</svg>`;
  }

  /* ---------- Figure helpers ---------- */
  function randomFigure(opts) {
    opts = opts || {};
    const shape = opts.rotatable ? pick(ROTATABLE) : pick(BASIC);
    return {
      shape,
      fill: pick(FILLS),
      size: opts.size || 'm',
      rot: ROTATABLE.includes(shape) ? pick([0, 90, 180, 270]) : 0,
      mark: opts.mark === undefined ? null : opts.mark,
      dots: opts.dots === undefined ? 0 : opts.dots,
    };
  }

  // Change one property to a different valid value. Used for distractors.
  function mutate(fig, prop) {
    const f = clone(fig);
    switch (prop) {
      case 'shape': f.shape = pick(BASIC.filter((s) => s !== f.shape)); if (!ROTATABLE.includes(f.shape)) f.rot = 0; break;
      case 'fill': f.fill = pick(FILLS.filter((x) => x !== f.fill)); break;
      case 'size': f.size = pick(SIZES.filter((x) => x !== f.size)); break;
      case 'rot': f.rot = ((f.rot + pick([90, 180, 270])) % 360); if (!ROTATABLE.includes(f.shape)) f.shape = pick(ROTATABLE); break;
      case 'mark': f.mark = f.mark === null ? rand(4) : pick([0, 1, 2, 3].filter((c) => c !== f.mark)); break;
      case 'dots': f.dots = pick([0, 1, 2, 3, 4].filter((d) => d !== f.dots)); break;
    }
    return f;
  }

  // Build 4 distractors that are all different from the answer and each other.
  function distractors(correct, preferredProps, avoidKeys) {
    const out = [];
    const seen = new Set([key(correct)].concat(avoidKeys || []));
    const props = preferredProps.concat(['fill', 'shape', 'dots', 'mark', 'size', 'rot']);
    let guard = 0;
    while (out.length < 4 && guard < 200) {
      guard += 1;
      const p = props[out.length < preferredProps.length ? out.length : rand(props.length)];
      let f = mutate(correct, p);
      if (guard > 60) f = mutate(f, pick(props)); // stir harder if stuck
      const k = key(f);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(f);
    }
    return out;
  }

  function optionsFor(correct, preferredProps, avoidKeys) {
    const opts = shuffle([correct].concat(distractors(correct, preferredProps, avoidKeys)));
    return { options: opts, answer: opts.findIndex((o) => key(o) === key(correct)) };
  }

  /* ---------- Sequences ----------
   * Five frames in a row, one missing. One or two properties change by a rule; the rest stay the same.
   */
  const SEQ_RULES = {
    shape: () => {
      if (rand(2) === 0) {
        const list = ['triangle', 'square', 'pentagon', 'hexagon', 'heptagon', 'octagon'];
        const start = rand(2);
        return { values: [0, 1, 2, 3, 4].map((i) => list[start + i]), rule: 'the shape gets one more side each step' };
      }
      const a = pick(BASIC), b = pick(BASIC.filter((s) => s !== a));
      return { values: [a, b, a, b, a], rule: `the shape alternates: ${a}, ${b}, ${a}, ${b}` };
    },
    fill: () => {
      if (rand(2) === 0) {
        const cyc = shuffle(['white', 'grey', 'black']);
        return { values: [0, 1, 2, 3, 4].map((i) => cyc[i % 3]), rule: `the fill cycles ${cyc.map((c) => FILL_WORD[c]).join(', ')}, then starts again` };
      }
      const a = pick(FILLS), b = pick(FILLS.filter((x) => x !== a));
      return { values: [a, b, a, b, a], rule: `the fill alternates ${FILL_WORD[a]}, ${FILL_WORD[b]}` };
    },
    rot: () => {
      const step = pick([90, -90, 45]);
      const start = pick([0, 90, 180, 270]);
      const word = step === 90 ? 'a quarter turn clockwise' : step === -90 ? 'a quarter turn anticlockwise' : 'an eighth of a turn clockwise';
      return { values: [0, 1, 2, 3, 4].map((i) => ((start + step * i) % 360 + 360) % 360), rule: `the shape turns ${word} each step` };
    },
    dots: () => {
      const up = rand(2) === 0;
      return { values: up ? [0, 1, 2, 3, 4] : [4, 3, 2, 1, 0], rule: up ? 'the number of dots goes up by one each step' : 'the number of dots goes down by one each step' };
    },
    mark: () => {
      const cw = rand(2) === 0;
      const start = rand(4);
      return {
        values: [0, 1, 2, 3, 4].map((i) => ((start + (cw ? i : -i)) % 4 + 4) % 4),
        rule: `the small black square moves one corner ${cw ? 'clockwise' : 'anticlockwise'} each step`,
      };
    },
    size: () => {
      if (rand(2) === 0) return { values: ['s', 'l', 's', 'l', 's'], rule: 'the size alternates small, large' };
      return { values: ['s', 'm', 'l', 's', 'm'], rule: 'the size grows small, medium, large, then starts again' };
    },
  };

  const WORDS = {
    shape: (v) => v,
    fill: (v) => FILL_WORD[v],
    size: (v) => SIZE_WORD[v],
    rot: (v) => v + '°',
    dots: (v) => String(v),
    mark: (v) => CORNER_WORD[v],
  };

  let seqCounter = 0;
  function sequence() {
    const n = rand(10) < 3 ? 1 : 2;
    let props = shuffle(['shape', 'fill', 'rot', 'dots', 'mark', 'size']).slice(0, n);
    if (props.includes('rot') && props.includes('shape')) props = props.filter((p) => p !== 'shape');
    const rules = {};
    props.forEach((p) => { rules[p] = SEQ_RULES[p](); });

    // Constant values for everything else.
    const base = randomFigure({ rotatable: props.includes('rot') });
    if (!props.includes('mark')) base.mark = rand(5) === 0 ? rand(4) : null;
    if (!props.includes('dots')) base.dots = rand(4) === 0 ? 1 + rand(2) : 0;
    if (!props.includes('rot')) base.rot = ROTATABLE.includes(base.shape) ? pick([0, 90, 180, 270]) : 0;

    const frames = [0, 1, 2, 3, 4].map((i) => {
      const f = clone(base);
      props.forEach((p) => { f[p] = rules[p].values[i]; });
      if (!ROTATABLE.includes(f.shape)) f.rot = 0;
      return f;
    });
    const blank = pick([4, 4, 4, 3, 2, 1, 0]);
    const correct = frames[blank];
    const { options, answer } = optionsFor(correct, props, []);

    let explain = '<p>Look at one thing at a time and ask what it does along the row.</p>';
    props.forEach((p) => {
      const vals = rules[p].values.map((v, i) => (i === blank ? '<b>?</b>' : WORDS[p](v)));
      explain += `<p><strong>${p === 'rot' ? 'Turning' : p === 'mark' ? 'Black square' : p.charAt(0).toUpperCase() + p.slice(1)}:</strong> ` +
        `${vals.join(', ')}. So ${rules[p].rule}. The missing one is <strong>${WORDS[p](rules[p].values[blank])}</strong>.</p>`;
    });
    const same = ['shape', 'fill', 'size', 'rot', 'dots', 'mark'].filter((p) => !props.includes(p));
    explain += `<p>Everything else stays the same. Find the option that matches on ${props.length === 1 ? 'that' : 'both'} and changes nothing else: <strong>${'ABCDE'[answer]}</strong>.</p>`;
    void same;

    seqCounter += 1;
    return {
      id: 'seq-' + seqCounter,
      source: 'Practice',
      frames, blank, options, answer,
      hint: `Look at the ${props[0] === 'rot' ? 'way the shape turns' : props[0] === 'mark' ? 'small black square' : props[0]} only, frame by frame. What does it do each step?`,
      explain,
    };
  }

  /* ---------- Transformations ----------
   * A is to B as C is to ?. One or two changes are applied to A to get B; apply the same to C.
   */
  const CHANGES = {
    rotate: {
      apply: (f, o) => { f.rot = (f.rot + o.deg + 360) % 360; if (f.mark !== null) f.mark = ((f.mark + (o.deg > 0 ? 1 : -1)) % 4 + 4) % 4; },
      word: (o) => (o.deg === 90 ? 'turns a quarter turn clockwise' : o.deg === -90 ? 'turns a quarter turn anticlockwise' : 'turns upside down (half a turn)'),
      options: () => ({ deg: pick([90, -90, 180]) }),
    },
    mirror: {
      apply: (f) => { f.rot = (360 - f.rot) % 360; if (f.mark !== null) f.mark = [1, 0, 3, 2][f.mark]; },
      word: () => 'flips over left to right, like a mirror image',
      options: () => ({}),
    },
    fill: {
      apply: (f, o) => { f.fill = o.to; },
      word: (o) => `the fill changes from ${FILL_WORD[o.from]} to ${FILL_WORD[o.to]}`,
      options: () => { const from = pick(FILLS); return { from, to: pick(FILLS.filter((x) => x !== from)) }; },
    },
    size: {
      apply: (f, o) => { f.size = o.grow ? (f.size === 's' ? 'm' : 'l') : (f.size === 'l' ? 'm' : 's'); },
      word: (o) => (o.grow ? 'gets bigger' : 'gets smaller'),
      options: () => ({ grow: rand(2) === 0 }),
    },
    dots: {
      apply: (f, o) => { f.dots = Math.max(0, Math.min(4, f.dots + o.delta)); },
      word: (o) => (o.delta > 0 ? `gains ${o.delta === 1 ? 'one dot' : 'two dots'}` : `loses ${o.delta === -1 ? 'one dot' : 'two dots'}`),
      options: () => ({ delta: pick([1, 2, -1]) }),
    },
  };

  let trCounter = 0;
  function transformation() {
    const n = rand(10) < 4 ? 1 : 2;
    let names = shuffle(['rotate', 'mirror', 'fill', 'size', 'dots']).slice(0, n);
    if (names.includes('rotate') && names.includes('mirror')) names = names.filter((x) => x !== 'mirror');
    const changes = names.map((name) => ({ name, o: CHANGES[name].options() }));

    const needsOrientation = names.includes('rotate') || names.includes('mirror');
    const A = randomFigure({ rotatable: needsOrientation });
    const C = randomFigure({ rotatable: needsOrientation });
    if (C.shape === A.shape) C.shape = pick((needsOrientation ? ROTATABLE : BASIC).filter((s) => s !== A.shape));
    // Make the change visible and possible.
    changes.forEach((c) => {
      if (c.name === 'fill') { A.fill = c.o.from; C.fill = c.o.from; }
      if (c.name === 'size') { const s = c.o.grow ? pick(['s', 'm']) : pick(['m', 'l']); A.size = s; C.size = s; }
      if (c.name === 'dots') { const d = c.o.delta > 0 ? rand(3) : 2 + rand(3); A.dots = d; C.dots = d; }
      if (c.name === 'mirror') {
        // Sideways shapes show a flip clearly; add a corner square so it always shows.
        A.rot = pick([90, 270]); C.rot = pick([90, 270]);
        A.mark = rand(4); C.mark = rand(4);
      }
      if (c.name === 'rotate' && rand(2) === 0) { A.mark = rand(4); C.mark = rand(4); }
    });
    if (!names.includes('fill') && C.fill === A.fill && rand(2) === 0) C.fill = pick(FILLS.filter((x) => x !== A.fill));

    const apply = (fig) => { const f = clone(fig); changes.forEach((c) => CHANGES[c.name].apply(f, c.o)); return f; };
    const B = apply(A);
    const D = apply(C);

    // Distractors: C with only some of the changes, the wrong direction, or B itself.
    const cands = [];
    if (n === 2) {
      changes.forEach((c) => { const f = clone(C); CHANGES[c.name].apply(f, c.o); cands.push(f); });
    }
    if (names.includes('rotate')) {
      const f = clone(C); changes.forEach((c) => CHANGES[c.name].apply(f, c.name === 'rotate' ? { deg: -c.o.deg } : c.o)); cands.push(f);
    }
    cands.push(clone(C));
    cands.push(B);
    const seen = new Set([key(D)]);
    const picked = [];
    for (const f of shuffle(cands)) { const k = key(f); if (!seen.has(k)) { seen.add(k); picked.push(f); } if (picked.length === 3) break; }
    const extra = distractors(D, names.map((x) => (x === 'rotate' || x === 'mirror' ? 'rot' : x)), Array.from(seen));
    while (picked.length < 4) { const f = extra.shift(); if (!seen.has(key(f))) { seen.add(key(f)); picked.push(f); } }
    const options = shuffle([D].concat(picked));
    const answer = options.findIndex((o) => key(o) === key(D));

    const words = changes.map((c) => CHANGES[c.name].word(c.o));
    const explain =
      `<p><strong>From the first picture to the second:</strong> the shape ${words.join(', and ')}. Nothing else changes.</p>` +
      `<p><strong>Do the same to the third picture.</strong> It is a ${FILL_WORD[C.fill]} ${C.shape}${C.dots ? ` with ${C.dots} dot${C.dots > 1 ? 's' : ''}` : ''}. ` +
      `After the change${n > 1 ? 's' : ''} it must be a ${FILL_WORD[D.fill]} ${D.shape}${D.dots ? ` with ${D.dots} dot${D.dots > 1 ? 's' : ''}` : ''}` +
      `${names.includes('rotate') || names.includes('mirror') ? ', turned the same way as the second picture was' : ''}: <strong>${'ABCDE'[answer]}</strong>.</p>` +
      '<p>Check the wrong ones: each of them misses a change, does it the wrong way round, or changes something extra.</p>';

    trCounter += 1;
    return {
      id: 'tr-' + trCounter,
      source: 'Practice',
      A, B, C, options, answer,
      hint: `Name what changed between the first two pictures (${n === 1 ? 'one thing' : 'two things'}). Then do exactly that to the third.`,
      explain,
    };
  }

  global.Shapes = { figureSvg, sequence, transformation };
})(window);
