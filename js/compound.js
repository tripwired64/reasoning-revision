/* Compound Words: two groups of three words. One word from each group joins to make one word.
 * The word from the first group always comes first.
 *
 * Each question: { id, source, groups: [[3], [3]], answer: [first, second], word, explain, hint }
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
  // A question with a note is a tricky one: the sound changes, or the halves are not words on their own.
  function q(g1, g2, first, second, note) {
    if (!g1.includes(first) || !g2.includes(second)) throw new Error('Bad compound question: ' + first + second);
    counter += 1;
    const word = first + second;
    return {
      id: 'cmp-' + counter,
      source: 'Practice',
      tricky: !!note,
      groups: [g1, g2],
      answer: [first, second],
      word,
      hint: `The first half is "${first}". Try it in front of each word in the second group.`,
      explain:
        `<p><strong>${first}</strong> + <strong>${second}</strong> = <strong>${word}</strong>.</p>` +
        (note ? `<p>${note}</p>` : '') +
        '<p>Method: take each word from the first group in turn and say it in front of all three words in the second group. Say them out loud in your head. Only one pair makes a real word.</p>',
    };
  }

  /* ---------- Practice bank ----------
   * Distractors are chosen so no other pair makes a word.
   */
  const BANK = [
    q(['race', 'run', 'lap'], ['side', 'bottom', 'top'], 'lap', 'top',
      'Laptop. Runside and racetop sound almost right, which is the point: say each one and check it is a word you know.'),
    q(['dam', 'lake', 'ore'], ['new', 'age', 'fort'], 'dam', 'age',
      'Damage. The joined word does not have to sound like its parts: dam + age is said "DAM-ij".'),
    q(['fore', 'prim', 'boat'], ['ate', 'grow', 'port'], 'prim', 'ate',
      'Primate (an ape or monkey). Watch for parts that are not whole words on their own: "prim" and "ate" only make sense together.'),
    q(['free', 'fact', 'felt'], ['if', 'or', 'owe'], 'fact', 'or',
      'Factor. Tiny second-group words like "or" and "if" are easy to skip past, so try them all.'),
    q(['bun', 'art', 'rig'], ['tip', 'ant', 'our'], 'rig', 'our',
      'Rigour. Another one where the sound changes: rig + our is said "RIG-er".'),
    q(['so', 'met', 'pin'], ['on', 'free', 'her'], 'so', 'on',
      'Soon. The shortest words can hide the answer. So + on looks too simple to be right, but it is.'),
    q(['help', 'plea', 'want'], ['know', 'sure', 'ask'], 'plea', 'sure',
      'Pleasure. Plea + sure is said "PLEZH-er", so you cannot rely on the sound.'),
    q(['link', 'cart', 'wet'], ['ridge', 'cede', 'king'], 'cart', 'ridge',
      'Cartridge. Linking sounds like a word but it is link + ing, and "ing" is not in the second group.'),
    q(['type', 'pen', 'mode'], ['ping', 'read', 'rate'], 'mode', 'rate',
      'Moderate. Typing is the trap: type + ping would spell "typeping", which is not a word.'),
    q(['rain', 'hat', 'fish'], ['bow', 'tie', 'cup'], 'rain', 'bow'),
    q(['foot', 'cup', 'door'], ['ball', 'ring', 'map'], 'foot', 'ball'),
    q(['tooth', 'cat', 'bed'], ['brush', 'rug', 'lamp'], 'tooth', 'brush'),
    q(['snow', 'cup', 'milk'], ['flake', 'ink', 'egg'], 'snow', 'flake'),
    q(['butter', 'hand', 'paper'], ['fly', 'tin', 'lid'], 'butter', 'fly'),
    q(['sea', 'pen', 'back'], ['weed', 'lid', 'hole'], 'sea', 'weed'),
    q(['play', 'day', 'dog'], ['ground', 'cup', 'ring'], 'play', 'ground'),
    q(['cup', 'rain', 'star'], ['coat', 'pan', 'lid'], 'rain', 'coat'),
    q(['arm', 'pig', 'hen'], ['chair', 'boy', 'hat'], 'arm', 'chair'),
    q(['birth', 'mud', 'cup'], ['day', 'tin', 'ring'], 'birth', 'day'),
    q(['pan', 'hat', 'fog'], ['cake', 'lid', 'map'], 'pan', 'cake'),
    q(['hair', 'rug', 'tin'], ['brush', 'fox', 'mat'], 'hair', 'brush'),
    q(['sea', 'log', 'jam'], ['shell', 'bin', 'net'], 'sea', 'shell'),
    q(['moon', 'key', 'cat'], ['light', 'bin', 'sip'], 'moon', 'light'),
    q(['eye', 'leg', 'bat'], ['brow', 'tub', 'fig'], 'eye', 'brow'),
    q(['news', 'web', 'pig'], ['paper', 'egg', 'lid'], 'news', 'paper'),
    q(['foot', 'wall', 'ink'], ['print', 'bag', 'hen'], 'foot', 'print'),
    q(['wall', 'bus', 'egg'], ['paper', 'fan', 'ring'], 'wall', 'paper'),
    q(['cup', 'fish', 'pen'], ['board', 'lid', 'map'], 'cup', 'board'),
    q(['some', 'rat', 'hen'], ['thing', 'wig', 'fan'], 'some', 'thing'),
    q(['in', 'cat', 'hen'], ['side', 'hat', 'bin'], 'in', 'side'),
    q(['for', 'cap', 'bag'], ['get', 'tin', 'rod'], 'for', 'get',
      'Forget. "For" is a whole word on its own, and so is "get", but joined they mean something new.'),
    q(['car', 'hat', 'mud'], ['pet', 'nap', 'sun'], 'car', 'pet'),
    q(['be', 'pot', 'rug'], ['come', 'rim', 'hut'], 'be', 'come'),
    q(['with', 'sit', 'hop'], ['out', 'net', 'bag'], 'with', 'out'),
    q(['tea', 'rat', 'fig'], ['spoon', 'egg', 'tip'], 'tea', 'spoon'),
    q(['bed', 'dog', 'tin'], ['room', 'lid', 'pen'], 'bed', 'room'),
    q(['sun', 'pot', 'jam'], ['set', 'rim', 'rod'], 'sun', 'set'),
    q(['hand', 'cat', 'log'], ['bag', 'rug', 'fin'], 'hand', 'bag'),
    q(['air', 'hen', 'pig'], ['port', 'cap', 'lid'], 'air', 'port'),
    q(['fire', 'tin', 'cow'], ['work', 'egg', 'rim'], 'fire', 'work'),
    q(['bath', 'cup', 'hen'], ['room', 'tin', 'ink'], 'bath', 'room'),
    q(['post', 'hat', 'mud'], ['card', 'fin', 'lip'], 'post', 'card'),
    q(['short', 'pot', 'fog'], ['hand', 'egg', 'rim'], 'short', 'hand',
      'Shorthand: a quick way of writing. Both halves are ordinary words that make a new meaning together.'),
    q(['grand', 'fig', 'tub'], ['father', 'rug', 'pen'], 'grand', 'father'),
    q(['week', 'cat', 'mud'], ['end', 'fan', 'tip'], 'week', 'end'),
    q(['home', 'hat', 'rod'], ['work', 'fin', 'lip'], 'home', 'work'),
    q(['blue', 'pin', 'fog'], ['bell', 'rim', 'hat'], 'blue', 'bell'),
    q(['gold', 'pot', 'bin'], ['fish', 'rim', 'egg'], 'gold', 'fish'),
    q(['under', 'rat', 'fog'], ['stand', 'lip', 'nut'], 'under', 'stand'),
    q(['over', 'log', 'jam'], ['take', 'rim', 'fig'], 'over', 'take'),
    q(['light', 'cup', 'fog'], ['house', 'tin', 'rod'], 'light', 'house'),
    q(['pass', 'hat', 'log'], ['word', 'bin', 'fan'], 'pass', 'word'),
    q(['up', 'cat', 'mud'], ['stairs', 'fin', 'lid'], 'up', 'stairs'),
    q(['sky', 'pen', 'fog'], ['lark', 'cup', 'rim'], 'sky', 'lark'),
    q(['hedge', 'tin', 'cup'], ['hog', 'rim', 'fan'], 'hedge', 'hog'),
    q(['rain', 'hen', 'mud'], ['fall', 'tip', 'fin'], 'rain', 'fall'),
    q(['note', 'hat', 'fog'], ['book', 'rim', 'lip'], 'note', 'book'),
    q(['sea', 'pot', 'rug'], ['side', 'fin', 'lid'], 'sea', 'side'),
    q(['bag', 'hen', 'fog'], ['pipe', 'rim', 'tin'], 'bag', 'pipe'),
    // Harder: the halves are not obvious words, or the sound changes when joined.
    q(['dam', 'pea', 'fig'], ['age', 'lid', 'rim'], 'dam', 'age',
      'Damage. Said "DAM-ij", so the sound changes when the halves join.'),
    q(['car', 'bin', 'fin'], ['rot', 'age', 'ink'], 'car', 'rot',
      'Carrot. Two r\'s in the middle: one from each half.'),
    q(['prim', 'boat', 'fore'], ['ate', 'rim', 'lid'], 'prim', 'ate',
      'Primate. "Prim" and "ate" are odd on their own, which is the clue that they belong together.'),
    q(['fact', 'free', 'felt'], ['or', 'ash', 'ice'], 'fact', 'or',
      'Factor. Try the tiny words too: "or" is easy to skip past.'),
    q(['cab', 'dot', 'leg'], ['in', 'rim', 'hop'], 'cab', 'in',
      'Cabin. Cab + in.'),
    q(['don', 'pen', 'ban'], ['key', 'tin', 'ill'], 'don', 'key',
      'Donkey. "Don" is not much of a word on its own, so it must be half of something.'),
    q(['leg', 'fig', 'pot'], ['end', 'tip', 'rim'], 'leg', 'end',
      'Legend. Said "LEJ-end", not "leg-end".'),
    q(['bar', 'hat', 'mud'], ['gain', 'fin', 'lip'], 'bar', 'gain',
      'Bargain. Said "BAR-gin".'),
    q(['car', 'mat', 'sun'], ['ton', 'rim', 'fog'], 'car', 'ton',
      'Carton.'),
    q(['pun', 'fog', 'rim'], ['ish', 'hat', 'lid'], 'pun', 'ish',
      'Punish. "Ish" is not a word on its own, so it must be the end of something.'),
    q(['ham', 'fog', 'rim'], ['let', 'tin', 'egg'], 'ham', 'let',
      'Hamlet: a small village.'),
    q(['pig', 'hen', 'mud'], ['let', 'fin', 'hop'], 'pig', 'let',
      'Piglet.'),
    q(['rig', 'hat', 'fog'], ['our', 'rim', 'tip'], 'rig', 'our',
      'Rigour. The one most people miss: said "RIG-er".'),
    q(['plea', 'hat', 'fog'], ['sure', 'rim', 'lid'], 'plea', 'sure',
      'Pleasure. Said "PLEZH-er".'),
    q(['cart', 'mud', 'pen'], ['ridge', 'fin', 'lid'], 'cart', 'ridge',
      'Cartridge.'),
    q(['mode', 'fog', 'hat'], ['rate', 'rim', 'lid'], 'mode', 'rate',
      'Moderate. Said "MOD-er-it".'),
    q(['so', 'hat', 'fog'], ['on', 'rim', 'tip'], 'so', 'on',
      'Soon. Two tiny words that make one.'),
    q(['pan', 'fog', 'hat'], ['try', 'rim', 'lid'], 'pan', 'try',
      'Pantry: a cupboard for food.'),
    q(['bud', 'fog', 'hat'], ['get', 'rim', 'tip'], 'bud', 'get',
      'Budget. Said "BUJ-it".'),
    q(['tar', 'fog', 'hat'], ['get', 'rim', 'tip'], 'tar', 'get',
      'Target.'),
    q(['mar', 'bin', 'fog'], ['ket', 'rim', 'tip'], 'mar', 'ket',
      'Market. Neither half is a proper word on its own.'),
    q(['pas', 'fog', 'hat'], ['sage', 'rim', 'tip'], 'pas', 'sage',
      'Passage. "Pas" is not a word, so it must join with something.'),
    q(['sea', 'hat', 'fog'], ['son', 'rim', 'tip'], 'sea', 'son',
      'Season. Said "SEE-zun", not "sea-son".'),
    q(['cot', 'bin', 'hat'], ['ton', 'rim', 'tip'], 'cot', 'ton',
      'Cotton.'),
  ];

  const decks = { all: [], tricky: [] };
  function next(filter) {
    const key = filter === 'tricky' ? 'tricky' : 'all';
    if (decks[key].length === 0) decks[key] = shuffle(key === 'tricky' ? BANK.filter((b) => b.tricky) : BANK);
    const base = decks[key].pop();
    // Shuffle the order inside each group so positions can't be learned. First group stays first.
    return Object.assign({}, base, { groups: [shuffle(base.groups[0]), shuffle(base.groups[1])] });
  }

  global.CompoundWords = { next, bankSize: BANK.length, trickySize: BANK.filter((b) => b.tricky).length };
})(window);
