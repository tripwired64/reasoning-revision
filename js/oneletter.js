/* One Letter, Four Words: the same letter finishes the word before the brackets and
 * starts the word after them, in both pairs.  (par [?] eep)  (el [?] ing)  ->  k
 *
 * Each question: { id, source, pairs: [[left, right], [left, right]], answer: 'k', options: [5 letters], explain, hint }
 */
(function (global) {
  'use strict';

  const rand = (n) => Math.floor(Math.random() * n);
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  let counter = 0;
  // pairs: 'par|eep', 'el|ing'
  function q(p1, p2, answer, options, note) {
    const pairs = [p1.split('|'), p2.split('|')];
    if (!options.includes(answer) || options.length !== 5) throw new Error('Bad one-letter question: ' + p1);
    counter += 1;
    const words = [
      pairs[0][0] + answer, answer + pairs[0][1],
      pairs[1][0] + answer, answer + pairs[1][1],
    ];
    return {
      id: 'ol-' + counter,
      source: 'Practice',
      pairs,
      answer,
      options,
      words,
      hint: `Start with the first pair only: what one letter finishes "${pairs[0][0]}_" and starts "_${pairs[0][1]}"? Then check it on the second pair.`,
      explain:
        `<p>The letter is <strong>${answer}</strong>. It makes all four words:</p>` +
        `<p class="fourwords">${words.map((w, i) => {
          const left = i % 2 === 0;
          const stem = left ? w.slice(0, -1) : w.slice(1);
          return left ? `${stem}<b>${answer}</b>` : `<b>${answer}</b>${stem}`;
        }).join(' &nbsp; ')}</p>` +
        (note ? `<p>${note}</p>` : '') +
        '<p>Method: find a letter that works for the first pair, then test it on the second pair. If it fails there, go back and try the next letter that fits the first pair.</p>',
    };
  }

  /* ---------- Practice bank ----------
   * Options are chosen so only the answer works for all four words.
   */
  const BANK = [
    q('var|acht', 'bur|earn', 'y', ['t', 'y', 's', 'k', 'p'], 'Vary, yacht, bury, yearn.'),
    q('par|eep', 'el|ing', 'k', ['t', 'g', 's', 'k', 'p'], 'Park, keep, elk, king.'),
    q('the|ot', 'ur|est', 'n', ['n', 'y', 'b', 'c', 'r'], 'Then, not, urn, nest. "They" and "yes" tempt you towards y, but "uy" is not a word.'),
    q('hea|ag', 'you|ink', 'r', ['t', 'r', 's', 'd', 'p'], 'Hear, rag, your, rink. Heat and tag work for t, but "yout" does not.'),
    q('mas|eat', 'plu|ale', 's', ['m', 's', 'h', 'g', 'b'], 'Mass, seat, plus, sale. Mash and heat work for h, but "pluh" does not.'),
    q('co|asp', 'sho|hen', 'w', ['d', 't', 'w', 'p', 'n'], 'Cow, wasp, show, when. Cot and shot work, but "tasp" does not.'),
    q('bal|uch', 'see|ock', 'm', ['l', 'e', 'm', 'k', 's'], 'Balm, much, seem, mock. Ball and seel: "luch" and "lock" do not both work.'),
    q('bor|ats', 'dos|ase', 'e', ['d', 'n', 'v', 's', 'e'], 'Bore, eats, dose, ease. Born and nats: "nats" is not a word.'),
    q('dis|ind', 'clot|oney', 'h', ['m', 'h', 'k', 's', 'w'], 'Dish, hind, cloth, honey. Disk and kind work for k, but "clotk" does not.'),
    q('vei|amb', 'lega|atch', 'l', ['c', 'n', 'w', 'l', 'm'], 'Veil, lamb, legal, latch. Vein and legan: n fails on the second pair.'),
    q('ha|in', 'ba|op', 't', ['t', 'd', 'm', 'n', 's'], 'Hat, tin, bat, top. Had and bad work for d, but "din" and "dop" do not both.'),
    q('pi|ail', 'fu|est', 'n', ['n', 't', 'g', 'r', 'l'], 'Pin, nail, fun, nest. Pit and tail work for t, but "fut" does not.'),
    q('bea|ust', 'loa|ame', 'd', ['d', 'm', 'n', 'r', 't'], 'Bead, dust, load, dame. Beam and must work for m, but "mame" does not.'),
    q('bra|ail', 'pu|ame', 'n', ['n', 'g', 's', 'd', 'b'], 'Bran, nail, pun, name.'),
    q('rea|ent', 'tea|ime', 'r', ['r', 'd', 'm', 't', 'c'], 'Rear, rent, tear, rime. Read and dent work for d, but "tead" does not.'),
    q('cra|ust', 'fla|in', 'b', ['b', 'm', 't', 'w', 'd'], 'Crab, bust, flab, bin. Cram and must work for m, but "flam" does not.'),
    q('chi|ill', 'fla|est', 'p', ['p', 'n', 'm', 'd', 'r'], 'Chip, pill, flap, pest. Chin works for n, but "nill" does not.'),
    q('hea|ip', 'sea|ove', 'l', ['l', 't', 'd', 'm', 'p'], 'Heal, lip, seal, love. Heat, tip and seat work for t, but "tove" does not.'),
    q('bel|ake', 'spo|ime', 't', ['t', 'l', 'd', 'm', 'k'], 'Belt, take, spot, time. Bell and lake work for l, but "spol" does not.'),
    q('gol|ust', 'ban|ial', 'd', ['d', 'f', 'm', 't', 'g'], 'Gold, dust, band, dial. Golf works for f, but "fust" does not.'),
    q('wor|ing', 'fol|ite', 'k', ['k', 'd', 'm', 'n', 't'], 'Work, king, folk, kite. Word, ding and fold work for d, but "dite" does not.'),
    q('sna|ile', 'cla|ath', 'p', ['p', 'g', 'b', 'm', 't'], 'Snap, pile, clap, path. Snag works for g, but "gile" does not.'),
    q('mil|ing', 'sil|eep', 'k', ['k', 'd', 'l', 't', 'e'], 'Milk, king, silk, keep. Mild works for d, but "ding" does not.'),
    q('plan|ick', 'ren|ill', 't', ['t', 'k', 'd', 's', 'e'], 'Plant, tick, rent, till. Plank and kick work for k, but "renk" does not.'),
    q('thin|ale', 'win|ap', 'g', ['g', 'k', 'd', 't', 'e'], 'Thing, gale, wing, gap. Think, kale and wink work for k, but "kap" does not.'),
    q('fla|oat', 'dra|ill', 'g', ['g', 't', 'p', 'w', 'n'], 'Flag, goat, drag, gill. Flat works for t, but "toat" does not.'),
    q('bir|ash', 'har|ust', 'd', ['d', 't', 'c', 'm', 'p'], 'Bird, dash, hard, dust.'),
    q('tra|ill', 'gri|ate', 'm', ['m', 'n', 'd', 'y', 'l'], 'Tram, mill, grim, mate. Tray works for y, but "yill" does not.'),
    q('fea|ip', 'dea|ate', 'r', ['r', 't', 'l', 'd', 'n'], 'Fear, rip, dear, rate. Feat and tip work for t, but "deat" does not.'),
    q('roa|ish', 'lea|ine', 'd', ['d', 'm', 'r', 'n', 'f'], 'Road, dish, lead, dine. Roam and roar work, but "mish" and "rish" do not.'),
    q('pea|ind', 'wea|ite', 'k', ['k', 'l', 't', 'n', 's'], 'Peak, kind, weak, kite. Peal works for l, but "lind" does not.'),
    q('cor|ate', 'ban|ill', 'd', ['d', 'k', 'n', 'e', 't'], 'Cord, date, band, dill. Cork and corn work, but "kate" and "nate" do not.'),
    q('bul|ill', 'sil|ing', 'k', ['k', 'l', 'b', 't', 'd'], 'Bulk, kill, silk, king. Bull and bulb work, but "lill" and "silb" do not.'),
    q('gra|ust', 'dra|ill', 'b', ['b', 'n', 'y', 'd', 't'], 'Grab, bust, drab, bill. Grad and dust work for d, but "drad" does not.'),
    q('san|ime', 'ban|ust', 'd', ['d', 'g', 'k', 't', 'e'], 'Sand, dime, band, dust. Sang and sank work, but "gime" and "kime" do not.'),
    q('dee|ish', 'wee|ay', 'd', ['d', 'p', 'r', 'm', 'k'], 'Deed, dish, weed, day. Deep, deer and deem work, but "pish", "rish" and "mish" do not.'),
    q('pos|ill', 'fas|ail', 't', ['t', 'h', 'e', 'y', 's'], 'Post, till, fast, tail. Posh and hill work for h, but "fash" does not.'),
    q('mea|ow', 'rea|ap', 'l', ['l', 't', 'n', 'd', 'r'], 'Meal, low, real, lap. Meat and tow work for t, but "reat" does not.'),
    q('lam|ail', 'hel|ick', 'p', ['p', 'b', 'e', 'd', 't'], 'Lamp, pail, help, pick. Lamb and bail work for b, but "helb" does not.'),
    q('far|ale', 'wor|ind', 'm', ['m', 'e', 'k', 'd', 'n'], 'Farm, male, worm, mind. Fare works for e, but "eale" does not.'),
    q('hos|ell', 'mis|ea', 't', ['t', 'e', 's', 'p', 'd'], 'Host, tell, mist, tea. Hose works for e, but "eell" does not.'),
    q('cla|ing', 'cro|ide', 'w', ['w', 'p', 'm', 'y', 'n'], 'Claw, wing, crow, wide. Clap, ping and crop work for p, but "pide" does not.'),
    q('stee|ate', 'spee|ish', 'd', ['d', 'l', 'p', 'r', 'm'], 'Steed, date, speed, dish. Steel, late and steer, rate work, but "speel" and "speer" do not.'),
    q('bea|ail', 'pla|ame', 'n', ['n', 't', 'r', 'd', 'm'], 'Bean, nail, plan, name. Beam and mail work for m, but "plam" does not.'),
    q('scar|ail', 'gol|ish', 'f', ['f', 'e', 't', 'p', 'd'], 'Scarf, fail, golf, fish. Scare works for e, but "eail" does not.'),
    q('spi|ill', 'sho|ail', 't', ['t', 'n', 'l', 'p', 'k'], 'Spit, till, shot, tail. Spin works for n, but "nill" does not.'),
    q('hor|ail', 'bar|ose', 'n', ['n', 's', 'e', 'd', 'k'], 'Horn, nail, barn, nose. Bare works for e, but "hore" does not.'),
    q('dar|ell', 'fee|ip', 't', ['t', 'e', 'k', 'n', 'l'], 'Dart, tell, feet, tip. Dark, dare, darn and feel all work on one side, but not on both pairs.'),
    q('bra|ust', 'dra|ate', 'g', ['g', 'n', 't', 'd', 'y'], 'Brag, gust, drag, gate. Bran and brat work, but "nust" and "tust" do not.'),
    q('roo|ame', 'dar|ill', 't', ['t', 'm', 'f', 'k', 'd'], 'Root, tame, dart, till. Room and roof work, but "mame" and "fame, darf" fail.'),
    q('wan|ash', 'ban|ill', 'd', ['d', 't', 'g', 'e', 's'], 'Wand, dash, band, dill. Want works for t, but "tash" does not.'),
    q('poe|ale', 'sof|ake', 't', ['t', 'm', 's', 'd', 'l'], 'Poet, tale, soft, take. Poem and male work for m, but "sofm" does not.'),
    q('sea|ime', 'ru|ill', 't', ['t', 'l', 'n', 'd', 'r'], 'Seat, time, rut, till. Seal and lime work for l, but "rul" does not.'),
    q('hea|ap', 'swa|ill', 't', ['t', 'r', 'l', 'd', 'm'], 'Heat, tap, swat, till. Hear and rap work for r, but "swar" does not.'),
    q('tan|ale', 'pin|ind', 'k', ['k', 'g', 'e', 'd', 't'], 'Tank, kale, pink, kind. Tang, gale and ping work for g, but "gind" does not.'),
    q('fla|ake', 'cla|ing', 'w', ['w', 'p', 'g', 't', 'n'], 'Flaw, wake, claw, wing. Flat and take work for t, but "clat" does not.'),
    q('hea|ust', 'bea|ate', 'd', ['d', 't', 'l', 'm', 'p'], 'Head, dust, bead, date. Heat and beat work for t, but "tust" does not.'),
    q('slo|ish', 'sno|ide', 'w', ['w', 't', 'p', 'b', 'g'], 'Slow, wish, snow, wide. Slot, slop and slob work on the first word only.'),
    q('fil|ale', 'far|ice', 'm', ['m', 'l', 'e', 'n', 'd'], 'Film, male, farm, mice. Fill and file work, but "lale" and "eale" do not.'),
    q('wis|ill', 'das|eat', 'h', ['h', 't', 'p', 'k', 'e'], 'Wish, hill, dash, heat. Wisp and pill work for p, but "dasp" does not.'),
    q('ben|ent', 'tin|ale', 't', ['t', 'd', 'e', 'k', 'g'], 'Bent, tent, tint, tale. Bend and dent work for d, but "tind" does not.'),
    q('gri|ame', 'cla|ail', 'n', ['n', 't', 'p', 'm', 'd'], 'Grin, name, clan, nail. Grit, tame and clat: t fails on "clat". Grid, dame and clad work, but "dail" does not.'),
  ];

  let deck = [];
  function next() {
    if (deck.length === 0) deck = shuffle(BANK);
    const base = deck.pop();
    return Object.assign({}, base, { options: shuffle(base.options) });
  }

  global.OneLetter = { next, bankSize: BANK.length };
})(window);
