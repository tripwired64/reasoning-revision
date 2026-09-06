/* App shell: home view, practice loop, timer, hints, feedback, timed drill, simple stats.
 * Each question type registers how to draw its question, how to mark it, and how to
 * reveal the answer when time runs out in a drill.
 */
(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const TIME_GUIDE = 30; // seconds per question, the pace the paper needs
  const HINTS_PER_SESSION = 3;
  const DRILL_LENGTH = 10;

  const rand = (n) => Math.floor(Math.random() * n);

  /* ---------- Question types ----------
   * render(q, stage, submit): draw the question; call submit(chosenText, isRight) when answered.
   * reveal(q, stage): mark the correct answer without a pick (used when time runs out).
   * verdict(q, chosen): sentence for a wrong answer.
   */
  const TYPES = {
    alphabet: {
      title: 'Alphabet Codes',
      short: 'Alphabet Codes',
      statsKey: 'kt-stats-alphabet',
      next: () => AlphabetCodes.generate(difficulty),
      render(q, stage, submit) {
        stage.innerHTML =
          '<div class="strip" aria-label="Alphabet">' +
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) => `<span>${l}</span>`).join('') +
          '</div>' +
          '<p class="prompt">Find the letters that best complete the sequence.</p>' +
          `<div class="sequence">${q.given.join('&nbsp;&nbsp;')}&nbsp;&nbsp;<span class="blank">[ ? ]</span></div>` +
          '<div class="hintbar"></div>' +
          '<div class="options"></div>';
        const box = stage.querySelector('.options');
        q.options.forEach((opt, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'opt';
          b.dataset.value = opt;
          b.innerHTML = `<span class="key">${'ABCDE'[i]}</span><span class="val">${opt}</span>`;
          b.addEventListener('click', () => {
            this.reveal(q, stage);
            if (opt !== q.answer) b.classList.add('wrong');
            b.classList.add('chosen');
            submit(opt, opt === q.answer);
          });
          box.appendChild(b);
        });
      },
      reveal(q, stage) {
        stage.querySelectorAll('.opt').forEach((x) => {
          x.disabled = true;
          if (x.dataset.value === q.answer) x.classList.add('correct');
        });
      },
      verdict: (q, chosen) => `You picked ${chosen}, the answer is ${q.answer}.`,
    },

    oddtwo: {
      title: 'Odd Two Out',
      short: 'Odd Two Out',
      statsKey: 'kt-stats-oddtwo',
      next: () => OddTwoOut.next(filters.oddtwo),
      render(q, stage, submit) {
        stage.innerHTML =
          '<p class="prompt">Three of these words go together. Tap the <strong>two</strong> that do not.</p>' +
          '<div class="words"></div>' +
          '<div class="hintbar"></div>';
        const box = stage.querySelector('.words');
        const picked = [];
        q.words.forEach((w) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'word';
          b.textContent = w;
          b.addEventListener('click', () => {
            if (b.disabled) return;
            if (picked.includes(w)) {
              picked.splice(picked.indexOf(w), 1);
              b.classList.remove('picked');
              return;
            }
            picked.push(w);
            b.classList.add('picked');
            if (picked.length < 2) return;
            const right = picked.every((p) => q.answer.includes(p));
            this.reveal(q, stage);
            box.querySelectorAll('.word').forEach((x) => {
              if (picked.includes(x.textContent) && !q.answer.includes(x.textContent)) x.classList.add('wrong');
            });
            submit(picked.join(' and '), right);
          });
          box.appendChild(b);
        });
      },
      reveal(q, stage) {
        stage.querySelectorAll('.word').forEach((x) => {
          x.disabled = true;
          if (q.answer.includes(x.textContent)) x.classList.add('correct');
        });
      },
      verdict: (q, chosen) => `You picked ${chosen}. The odd two out are ${q.answer.join(' and ')}.`,
    },

    compound: {
      title: 'Compound Words',
      short: 'Compound Words',
      statsKey: 'kt-stats-compound',
      next: () => CompoundWords.next(filters.compound),
      render(q, stage, submit) {
        stage.innerHTML =
          '<p class="prompt">One word from each group joins to make <strong>one</strong> word. The first group\'s word comes first.</p>' +
          '<div class="groups"><div class="group" data-g="0"></div><div class="joiner">+</div><div class="group" data-g="1"></div></div>' +
          '<div class="hintbar"></div>';
        const picked = [null, null];
        const labels = [['A', 'B', 'C'], ['X', 'Y', 'Z']];
        q.groups.forEach((words, g) => {
          const box = stage.querySelector(`.group[data-g="${g}"]`);
          words.forEach((w, i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'word';
            b.dataset.g = g;
            b.dataset.value = w;
            b.innerHTML = `<span class="key">${labels[g][i]}</span>${w}`;
            b.addEventListener('click', () => {
              if (b.disabled) return;
              // One pick per group; tapping another word in the same group swaps it.
              box.querySelectorAll('.word').forEach((x) => x.classList.remove('picked'));
              b.classList.add('picked');
              picked[g] = w;
              if (!picked[0] || !picked[1]) return;
              const right = picked[0] === q.answer[0] && picked[1] === q.answer[1];
              this.reveal(q, stage);
              stage.querySelectorAll('.word.picked').forEach((x) => {
                if (!x.classList.contains('correct')) x.classList.add('wrong');
              });
              submit(picked[0] + ' + ' + picked[1], right);
            });
            box.appendChild(b);
          });
        });
      },
      reveal(q, stage) {
        stage.querySelectorAll('.word').forEach((x) => {
          x.disabled = true;
          if (x.dataset.value === q.answer[Number(x.dataset.g)]) x.classList.add('correct');
        });
      },
      verdict: (q, chosen) => `You picked ${chosen}. The word is ${q.word} (${q.answer[0]} + ${q.answer[1]}).`,
    },

    oneletter: {
      title: 'One Letter, Four Words',
      short: 'One Letter',
      statsKey: 'kt-stats-oneletter',
      next: () => OneLetter.next(),
      render(q, stage, submit) {
        const pair = (p) => `<span class="pair">( ${p[0]} <span class="blank">[ ? ]</span> ${p[1]} )</span>`;
        stage.innerHTML =
          '<p class="prompt">The <strong>same</strong> letter finishes the first word and starts the second, in both pairs.</p>' +
          `<div class="sequence pairs">${pair(q.pairs[0])} &nbsp; ${pair(q.pairs[1])}</div>` +
          '<div class="hintbar"></div>' +
          '<div class="options"></div>';
        const box = stage.querySelector('.options');
        q.options.forEach((opt, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'opt';
          b.dataset.value = opt;
          b.innerHTML = `<span class="key">${'ABCDE'[i]}</span><span class="val">${opt}</span>`;
          b.addEventListener('click', () => {
            this.reveal(q, stage);
            if (opt !== q.answer) b.classList.add('wrong');
            b.classList.add('chosen');
            submit(opt, opt === q.answer);
          });
          box.appendChild(b);
        });
      },
      reveal(q, stage) {
        stage.querySelectorAll('.opt').forEach((x) => {
          x.disabled = true;
          if (x.dataset.value === q.answer) x.classList.add('correct');
        });
      },
      verdict: (q, chosen) => `You picked ${chosen}, the answer is ${q.answer} (${q.words.join(', ')}).`,
    },

    nvrseq: {
      title: 'Shape Sequences',
      short: 'Sequences',
      statsKey: 'kt-stats-nvrseq',
      next: () => Shapes.sequence(),
      render(q, stage, submit) {
        stage.innerHTML =
          '<p class="prompt">One frame is missing from the row. Which option fills it?</p>' +
          `<div class="figrow">${q.frames.map((f, i) => `<div class="cell${i === q.blank ? ' blankcell' : ''}">${Shapes.figureSvg(f, i === q.blank)}</div>`).join('')}</div>` +
          '<div class="hintbar"></div>' +
          '<div class="options figopts"></div>';
        figureOptions(q, stage, submit, this);
      },
      reveal(q, stage) {
        revealFigureOptions(q, stage);
        const blankCell = stage.querySelector('.blankcell');
        if (blankCell) blankCell.innerHTML = Shapes.figureSvg(q.frames[q.blank]);
      },
      verdict: (q, chosen) => `You picked ${chosen}, the answer is ${'ABCDE'[q.answer]}.`,
    },

    nvrtrans: {
      title: 'Shape Transformations',
      short: 'Transformations',
      statsKey: 'kt-stats-nvrtrans',
      next: () => Shapes.transformation(),
      render(q, stage, submit) {
        stage.innerHTML =
          '<p class="prompt">The first shape changes into the second. Make the <strong>same</strong> change to the third.</p>' +
          '<div class="figrow analogy">' +
            `<div class="cell">${Shapes.figureSvg(q.A)}</div><div class="glyph">&rarr;</div><div class="cell">${Shapes.figureSvg(q.B)}</div>` +
            '<div class="glyph colon">:</div>' +
            `<div class="cell">${Shapes.figureSvg(q.C)}</div><div class="glyph">&rarr;</div><div class="cell blankcell">${Shapes.figureSvg(null, true)}</div>` +
          '</div>' +
          '<div class="hintbar"></div>' +
          '<div class="options figopts"></div>';
        figureOptions(q, stage, submit, this);
      },
      reveal(q, stage) {
        revealFigureOptions(q, stage);
        const blankCell = stage.querySelector('.blankcell');
        if (blankCell) blankCell.innerHTML = Shapes.figureSvg(q.options[q.answer]);
      },
      verdict: (q, chosen) => `You picked ${chosen}, the answer is ${'ABCDE'[q.answer]}.`,
    },
  };

  // Shared by both shape types: five picture options labelled A to E.
  function figureOptions(q, stage, submit, type) {
    const box = stage.querySelector('.options');
    q.options.forEach((fig, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'opt fig-opt';
      b.dataset.value = String(i);
      b.innerHTML = `<span class="key">${'ABCDE'[i]}</span>${Shapes.figureSvg(fig)}`;
      b.addEventListener('click', () => {
        type.reveal(q, stage);
        if (i !== q.answer) b.classList.add('wrong');
        b.classList.add('chosen');
        submit('ABCDE'[i], i === q.answer);
      });
      box.appendChild(b);
    });
  }
  function revealFigureOptions(q, stage) {
    stage.querySelectorAll('.opt').forEach((x) => {
      x.disabled = true;
      if (Number(x.dataset.value) === q.answer) x.classList.add('correct');
    });
  }

  const DRILL_TYPES = ['alphabet', 'oddtwo', 'compound', 'oneletter', 'nvrseq', 'nvrtrans'];
  const DRILL_STATS = 'kt-stats-drill';

  /* ---------- State ---------- */
  const viewHome = $('#view-home');
  const viewPractice = $('#view-practice');
  const backBtn = $('#back-btn');
  const pageTitle = $('#page-title');
  const stage = $('#stage');

  let difficulty = 'mixed';
  const filters = { oddtwo: 'all', compound: 'all' }; // 'all' | 'tricky'
  let type = TYPES.alphabet;
  let mode = 'generated'; // 'generated' | 'drill'
  let current = null;
  let session = { asked: 0, correct: 0, timedOut: 0, seconds: 0 };
  let hintsLeft = HINTS_PER_SESSION;
  let hintUsed = false;
  let timerId = null;
  let startedAt = 0;
  let answered = false;

  /* ---------- Stats (localStorage, per type) ---------- */
  function loadStats(key) {
    try { return JSON.parse(localStorage.getItem(key)) || { asked: 0, correct: 0 }; }
    catch (e) { return { asked: 0, correct: 0 }; }
  }
  function saveStats(key, s) {
    try { localStorage.setItem(key, JSON.stringify(s)); } catch (e) { /* ignore */ }
  }
  function renderStats() {
    document.querySelectorAll('[data-stats]').forEach((el) => {
      const key = el.dataset.stats === 'drill' ? DRILL_STATS : TYPES[el.dataset.stats].statsKey;
      const s = loadStats(key);
      if (!s.asked) { el.textContent = 'No questions answered yet.'; return; }
      const pct = Math.round((100 * s.correct) / s.asked);
      el.textContent = `All time: ${s.correct} / ${s.asked} correct (${pct}%).`;
    });
  }

  /* ---------- Navigation ---------- */
  function showHome() {
    stopTimer();
    viewPractice.classList.add('hidden');
    viewHome.classList.remove('hidden');
    backBtn.classList.add('hidden');
    pageTitle.textContent = 'Kent Test Practice';
    renderStats();
  }
  function showPractice() {
    viewHome.classList.add('hidden');
    viewPractice.classList.remove('hidden');
    backBtn.classList.remove('hidden');
    pageTitle.textContent = mode === 'drill' ? 'Timed drill' : type.title;
    session = { asked: 0, correct: 0, timedOut: 0, seconds: 0 };
    hintsLeft = mode === 'drill' ? 0 : HINTS_PER_SESSION;
    nextQuestion();
  }

  /* ---------- Timer ---------- */
  // Practice counts up and turns amber past the guide. A drill counts down and forces an answer at zero.
  function startTimer() {
    stopTimer();
    startedAt = Date.now();
    const el = $('#timer');
    el.classList.remove('over');
    const tick = () => {
      const secs = Math.floor((Date.now() - startedAt) / 1000);
      if (mode === 'drill') {
        const left = Math.max(0, TIME_GUIDE - secs);
        el.textContent = left + 's';
        if (left <= 10) el.classList.add('over');
        if (left === 0) timeUp();
      } else {
        el.textContent = secs + 's';
        if (secs >= TIME_GUIDE) el.classList.add('over');
      }
    };
    tick();
    timerId = setInterval(tick, 250);
  }
  function stopTimer() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  /* ---------- Question loop ---------- */
  function nextQuestion() {
    if (mode === 'drill') {
      if (session.asked >= DRILL_LENGTH) { finishDrill(); return; }
      type = TYPES[DRILL_TYPES[rand(DRILL_TYPES.length)]];
      current = type.next();
      renderQuestion(current, DRILL_LENGTH);
    } else {
      current = type.next();
      renderQuestion(current, 0);
    }
    startTimer();
  }

  function finishScreen(title, lines) {
    stopTimer();
    stage.innerHTML = `<div class="sequence">${title}</div>`;
    $('#qlabel').textContent = '';
    const fb = $('#feedback');
    fb.classList.remove('hidden', 'good', 'bad');
    $('#verdict').textContent = lines.shift();
    $('#explanation').innerHTML = lines.map((l) => `<p>${l}</p>`).join('');
    $('#next-btn').textContent = 'Back to home';
    $('#next-btn').onclick = showHome;
  }

  function finishDrill() {
    const pct = Math.round((100 * session.correct) / DRILL_LENGTH);
    const avg = session.asked ? (session.seconds / session.asked).toFixed(1) : '0';
    const all = loadStats(DRILL_STATS);
    all.asked += session.asked;
    all.correct += session.correct;
    saveStats(DRILL_STATS, all);
    const lines = [
      session.timedOut === 0
        ? 'Every question answered. That is the habit.'
        : `${session.timedOut} ran out of time. A guess can score, a blank never does.`,
      `Average ${avg} seconds a question.`,
    ];
    finishScreen(`Drill: ${session.correct} / ${DRILL_LENGTH} (${pct}%)`, lines);
  }

  function renderQuestion(q, total) {
    answered = false;
    $('#score').textContent = `${session.correct} / ${session.asked}`;
    if (mode === 'drill') $('#qlabel').textContent = `${session.asked + 1} of ${total} · ${type.short}`;
    else $('#qlabel').textContent = filters[typeKey()] === 'tricky' ? 'Tricky ones' : 'Practice';

    type.render(q, stage, answer);

    // Hint button lives inside the type's layout so it sits in the right place.
    const bar = stage.querySelector('.hintbar');
    if (mode === 'drill') {
      bar.innerHTML = '';
    } else {
      bar.innerHTML = '<button type="button" class="hint-btn"></button><p class="hint-text hidden"></p>';
      bar.querySelector('.hint-btn').addEventListener('click', showHint);
    }
    hintUsed = false;
    renderHintButton();

    const fb = $('#feedback');
    fb.classList.add('hidden');
    fb.classList.remove('good', 'bad');
    $('#next-btn').textContent = 'Next question';
    $('#next-btn').onclick = nextQuestion;
  }

  function renderHintButton() {
    const b = stage.querySelector('.hint-btn');
    if (!b) return;
    b.disabled = hintsLeft === 0 || hintUsed || !current.hint;
    b.textContent = hintsLeft === 0 ? 'No hints left' : `Hint (${hintsLeft} left)`;
  }

  function showHint() {
    if (hintsLeft === 0 || hintUsed || !current.hint) return;
    hintsLeft -= 1;
    hintUsed = true;
    const t = stage.querySelector('.hint-text');
    t.textContent = current.hint;
    t.classList.remove('hidden');
    renderHintButton();
  }

  function timeUp() {
    if (answered) return;
    type.reveal(current, stage);
    answer(null, false, true);
  }

  function answer(chosen, right, timedOut) {
    if (answered) return;
    answered = true;
    stopTimer();
    const secs = Math.round((Date.now() - startedAt) / 1000);

    session.asked += 1;
    session.seconds += secs;
    if (right) session.correct += 1;
    if (timedOut) session.timedOut += 1;
    if (mode !== 'drill') {
      const all = loadStats(type.statsKey);
      all.asked += 1;
      if (right) all.correct += 1;
      saveStats(type.statsKey, all);
    }
    $('#score').textContent = `${session.correct} / ${session.asked}`;

    const fb = $('#feedback');
    fb.classList.remove('hidden');
    fb.classList.add(right ? 'good' : 'bad');
    const speed = secs <= TIME_GUIDE ? `in ${secs}s.` : `in ${secs}s. Aim for under ${TIME_GUIDE}s.`;
    const hinted = hintUsed ? ' (with a hint)' : '';
    if (timedOut) {
      $('#verdict').textContent = 'Time is up. In the real test, always put something down before moving on.';
    } else {
      $('#verdict').textContent = right
        ? `Correct${hinted}, ${speed}`
        : `Not this time${hinted}. ${type.verdict(current, chosen)}`;
    }
    $('#explanation').innerHTML = current.explain;
    const hb = stage.querySelector('.hint-btn');
    if (hb) hb.classList.add('hidden');
    if (mode === 'drill' && session.asked >= DRILL_LENGTH) $('#next-btn').textContent = 'See results';
    fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function typeKey() {
    return Object.keys(TYPES).find((k) => TYPES[k] === type);
  }

  /* ---------- Wire up home ---------- */
  // Type picker: show one panel at a time, remember the last one.
  function showPanel(name) {
    document.querySelectorAll('.type-btn[data-panel]').forEach((b) => b.classList.toggle('active', b.dataset.panel === name));
    document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('hidden', p.dataset.panel !== name));
    try { localStorage.setItem('kt-last-panel', name); } catch (e) { /* ignore */ }
  }
  document.querySelectorAll('.type-btn[data-panel]').forEach((b) => {
    b.addEventListener('click', () => showPanel(b.dataset.panel));
  });
  try {
    const last = localStorage.getItem('kt-last-panel');
    if (last && document.querySelector(`.panel[data-panel="${last}"]`)) showPanel(last);
  } catch (e) { /* ignore */ }

  document.querySelectorAll('.segmented [data-diff]').forEach((b) => {
    b.addEventListener('click', () => {
      difficulty = b.dataset.diff;
      document.querySelectorAll('.segmented [data-diff]').forEach((x) => x.classList.toggle('active', x === b));
    });
  });
  // All / Tricky only, per type
  document.querySelectorAll('.segmented [data-filter]').forEach((b) => {
    b.addEventListener('click', () => {
      const group = b.closest('.segmented');
      filters[group.dataset.type] = b.dataset.filter;
      group.querySelectorAll('[data-filter]').forEach((x) => x.classList.toggle('active', x === b));
    });
  });
  document.querySelectorAll('[data-start]').forEach((b) => {
    b.addEventListener('click', () => {
      mode = b.dataset.start;
      if (mode !== 'drill') type = TYPES[b.dataset.type];
      showPractice();
    });
  });
  backBtn.addEventListener('click', showHome);

  renderStats();
})();
