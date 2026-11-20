export const BASE_SWAPS = 128; // fictional community total shown in the stats

export const CATS = {
  Tech: ['Python', 'JavaScript', 'Git', 'Excel', 'Data analysis', 'Statistics'],
  Design: ['Figma', 'UI design', 'Illustration', 'Photography', 'Video editing'],
  Languages: ['French', 'Spanish', 'Japanese'],
  Music: ['Guitar', 'Music production'],
  Academics: ['Calculus', 'Physics', 'Writing', 'Resume review'],
  Life: ['Public speaking', 'Debate', 'Budgeting', 'Baking'],
  Fitness: ['Yoga', 'Meditation', 'Calisthenics']
};

const m = (id, name, college, teaches, wants, when, mode, bio) => ({ id, name, college, teaches, wants, when, mode, bio });

export const SEED = [
  m('amara', 'Amara Okafor', 'Riverside Institute', ['Python', 'Statistics'], ['Guitar', 'Public speaking'], 'Weekday evenings', 'Online', 'Debugs for fun. Yes, really.'),
  m('rohan', 'Rohan Kapoor', 'Lakeview University', ['Guitar', 'Music production'], ['Python', 'Excel'], 'Weekends', 'In person', 'Will trade chords for code.'),
  m('camille', 'Camille Laurent', 'Metro Design School', ['French', 'Photography'], ['Excel', 'Figma'], 'Weekday mornings', 'Either', 'Native speaker, very patient.'),
  m('diego', 'Diego Fernández', 'Harbor City College', ['Spanish', 'Calisthenics'], ['Python', 'Public speaking'], 'Weekday evenings', 'In person', 'Handstands by graduation.'),
  m('priya', 'Priya Nair', 'Riverside Institute', ['Figma', 'UI design'], ['Calculus', 'Guitar'], 'Flexible', 'Online', 'Pixels are my love language.'),
  m('kwame', 'Kwame Mensah', 'St. Marlowe College', ['Public speaking', 'Debate'], ['Excel', 'Photography'], 'Weekends', 'Either', 'Captain of the debate society.'),
  m('yuki', 'Yuki Tanaka', 'Lakeview University', ['Japanese', 'Illustration'], ['French', 'Python'], 'Weekday evenings', 'Online', 'Sketchbook always in my bag.'),
  m('fatima', 'Fatima Al-Sayed', 'Metro Design School', ['Calculus', 'Physics'], ['Figma', 'Public speaking'], 'Weekday mornings', 'In person', 'Maths tutor who hates jargon.'),
  m('liam', "Liam O'Brien", 'Harbor City College', ['Excel', 'Data analysis'], ['Guitar', 'Spanish'], 'Flexible', 'Either', 'Pivot tables are a personality.'),
  m('zainab', 'Zainab Bello', 'St. Marlowe College', ['Baking', 'Budgeting'], ['Python', 'Photography'], 'Weekends', 'In person', 'Pays in banana bread.'),
  m('mateo', 'Mateo Rossi', 'Riverside Institute', ['Video editing', 'Photography'], ['Calculus', 'Japanese'], 'Weekday evenings', 'Online', 'Cuts a mean highlight reel.'),
  m('aisha', 'Aisha Khan', 'Lakeview University', ['Yoga', 'Meditation'], ['Excel', 'Budgeting'], 'Weekday mornings', 'In person', 'Calm is a skill. I teach it.'),
  m('sven', 'Sven Lindqvist', 'Harbor City College', ['JavaScript', 'Git'], ['Spanish', 'Yoga'], 'Flexible', 'Online', 'Merge conflicts are my cardio.'),
  m('chioma', 'Chioma Eze', 'Metro Design School', ['Writing', 'Resume review'], ['JavaScript', 'Video editing'], 'Weekends', 'Either', 'I make CVs impossible to ignore.')
];

export const SUGGEST_TEACH = ['Python', 'Guitar', 'Excel', 'Figma', 'Public speaking', 'French', 'Calculus', 'Photography'];
export const SUGGEST_WANT = ['Guitar', 'Python', 'Spanish', 'Video editing', 'Budgeting', 'Japanese', 'JavaScript', 'Yoga'];
export const WHEN_OPTIONS = ['Weekday evenings', 'Weekday mornings', 'Weekends', 'Flexible'];
export const MODE_OPTIONS = ['In person', 'Online', 'Either'];

export const LEVELS = [
  { at: 0, name: 'Newcomer' },
  { at: 10, name: 'Spark' },
  { at: 60, name: 'Swapper' },
  { at: 150, name: 'Connector' },
  { at: 300, name: 'Campus Legend' }
];
export const PTS = { pending: 10, accepted: 30, done: 100 };

/* ---------- helpers ---------- */
export const norm = s => String(s).trim().toLowerCase().replace(/\s+/g, ' ');
export const clean = s => {
  const t = String(s).trim().replace(/\s+/g, ' ').slice(0, 30);
  return t ? t[0].toUpperCase() + t.slice(1) : '';
};
export const initials = n => n.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
export const hue = n => { let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };

export function same(a, b) {
  const x = norm(a), y = norm(b);
  if (x === y) return true;
  return x.length >= 4 && y.length >= 4 && (x.includes(y) || y.includes(x));
}
export const overlap = (a, b) => a.filter(x => b.some(y => same(x, y)));

export function catOf(skill) {
  for (const [c, list] of Object.entries(CATS)) if (list.some(s => same(s, skill))) return c;
  return 'Other';
}

/** Rank every seeded student against a profile. Mutual swaps come first. */
export function computeMatches(p) {
  const out = [];
  for (const c of SEED) {
    const theyTeach = overlap(c.teaches, p.wants); // they teach what I want
    const theyWant = overlap(c.wants, p.teaches);  // they want what I teach
    if (!theyTeach.length && !theyWant.length) continue;
    const a = Math.min(1, theyTeach.length / Math.max(1, p.wants.length));
    const b = Math.min(1, theyWant.length / Math.max(1, c.wants.length));
    let score = 100 * (0.55 * a + 0.45 * b);
    if (c.when === p.when) score += 5;
    if (c.mode === p.mode || c.mode === 'Either' || p.mode === 'Either') score += 3;
    score = Math.min(100, Math.round(score));
    const kind = theyTeach.length && theyWant.length ? 'mutual' : theyTeach.length ? 'learn' : 'teach';
    out.push({ c, theyTeach, theyWant, score, kind });
  }
  const rank = { mutual: 0, learn: 1, teach: 2 };
  return out.sort((x, y) => rank[x.kind] - rank[y.kind] || y.score - x.score);
}

export const points = requests => requests.reduce((n, r) => n + PTS[r.status], 0);

export function levelInfo(pts) {
  let i = 0;
  LEVELS.forEach((l, k) => { if (pts >= l.at) i = k; });
  const cur = LEVELS[i], next = LEVELS[i + 1];
  return {
    name: cur.name,
    pct: next ? Math.round(((pts - cur.at) / (next.at - cur.at)) * 100) : 100,
    next: next ? `${next.at - pts} pts to ${next.name}` : 'Top level reached. Legend.'
  };
}

export function badgeList(profile, requests) {
  const done = requests.filter(x => x.status === 'done').length;
  return [
    { ico: '🤝', name: 'First swap', desc: 'Complete a session', on: done >= 1 },
    { ico: '🌐', name: 'Connector', desc: 'Request 3 different people', on: new Set(requests.map(x => x.mid)).size >= 3 },
    { ico: '📚', name: 'Open book', desc: 'Offer 3 or more skills', on: !!profile && profile.teaches.length >= 3 },
    { ico: '🔭', name: 'Curious mind', desc: 'Want to learn 3 or more skills', on: !!profile && profile.wants.length >= 3 },
    { ico: '🏆', name: 'Triple threat', desc: 'Complete 3 sessions', on: done >= 3 }
  ];
}
