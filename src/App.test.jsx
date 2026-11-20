import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { SEED, badgeList, computeMatches, computeStreak, goalProgress, levelInfo, points, ratingInfo, weekStart } from './data.js';
import { buildCalendarContent } from './calendar.js';
import { buildShareText } from './components/SwapCard.jsx';

beforeEach(() => {
  cleanup();
  localStorage.clear();
  window.history.replaceState({}, '', '/');
});

function Broken() {
  throw new Error('test render failure');
}

describe('matching logic', () => {
  const profile = { teaches: ['Python', 'Excel'], wants: ['Guitar', 'French'], when: 'Weekday evenings', mode: 'Online' };

  it('ranks mutual swaps first and explains them', () => {
    const res = computeMatches(profile);
    expect(res[0].kind).toBe('mutual');
    expect(res[0].c.id).toBe('rohan'); // teaches Guitar, wants Python + Excel
    expect(res[0].theyTeach).toContain('Guitar');
    expect(res[0].theyWant).toEqual(expect.arrayContaining(['Python', 'Excel']));
  });

  it('never exceeds 100 and skips unrelated students', () => {
    const res = computeMatches(profile);
    expect(res.every(r => r.score <= 100 && r.score > 0)).toBe(true);
    expect(res.length).toBeLessThan(SEED.length);
  });

  it('computes points and levels', () => {
    const reqs = [{ status: 'pending' }, { status: 'done' }];
    expect(points(reqs)).toBe(110);
    expect(points([{ status: 'done', review: { rating: 5 } }])).toBe(120);
    expect(levelInfo(110).name).toBe('Swapper');
    expect(levelInfo(120).name).toBe('Swapper');
    expect(levelInfo(0).name).toBe('Newcomer');
  });

  it('combines a seeded rating with the user reviews for that student', () => {
    const amara = SEED.find(student => student.id === 'amara');
    const rating = ratingInfo(amara, [
      { mid: 'amara', review: { rating: 5 } },
      { mid: 'amara', review: { rating: 3 } },
      { mid: 'rohan', review: { rating: 1 } }
    ]);

    expect(rating.count).toBe(14);
    expect(rating.average).toBeCloseTo(4.69, 2);
  });

  it('counts completed learning sessions toward goals using same-skill matching', () => {
    const goal = { skill: 'Python', target: 2 };
    const progress = goalProgress(goal, [
      { status: 'done', learn: 'Python basics' },
      { status: 'accepted', learn: 'Python' },
      { status: 'done', learn: 'Guitar' }
    ]);
    expect(progress).toEqual({ completed: 1, complete: false });
    expect(goalProgress(goal, [
      { status: 'done', learn: 'Python' },
      { status: 'done', learn: 'Python practice' }
    ])).toEqual({ completed: 2, complete: true });
  });

  it('starts weeks on local Monday for both Sunday and Monday dates', () => {
    const sunday = weekStart(new Date(2026, 1, 1, 18, 30));
    const monday = weekStart(new Date(2026, 1, 2, 9, 15));
    expect([sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), sunday.getHours()]).toEqual([2026, 0, 26, 0]);
    expect([monday.getFullYear(), monday.getMonth(), monday.getDate(), monday.getHours()]).toEqual([2026, 1, 2, 0]);
  });

  it('computes a live streak, resets it after a missed week, and handles no history', () => {
    const done = day => ({ status: 'done', doneAt: new Date(2026, 2, day, 12).getTime() });
    const now = new Date(2026, 2, 18, 12).getTime();
    expect(computeStreak([done(3), done(10)], now)).toEqual({ current: 2, best: 2, thisWeekDone: false });
    expect(computeStreak([done(3)], now)).toEqual({ current: 0, best: 1, thisWeekDone: false });
    expect(computeStreak([], now)).toEqual({ current: 0, best: 0, thisWeekDone: false });
  });

  it('unlocks goal and streak badges', () => {
    const now = new Date(2026, 2, 18, 12).getTime();
    const requests = [3, 10, 17].map(day => ({
      status: 'done',
      learn: 'Python',
      doneAt: new Date(2026, 2, day, 12).getTime()
    }));
    const badges = badgeList(null, requests, [{ id: 'python', skill: 'Python', target: 1 }], now);
    expect(badges.find(badge => badge.name === 'Goal getter').on).toBe(true);
    expect(badges.find(badge => badge.name === 'On a roll').on).toBe(true);
  });
});

describe('app flow', () => {
  it('shows the install button after beforeinstallprompt and invokes its prompt', async () => {
    render(<App />);
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = new Event('beforeinstallprompt', { cancelable: true });
    event.prompt = prompt;
    event.userChoice = Promise.resolve({ outcome: 'accepted' });
    act(() => window.dispatchEvent(event));

    expect(event.defaultPrevented).toBe(true);
    const installButton = screen.getByRole('button', { name: 'Install app' });
    fireEvent.click(installButton);
    await waitFor(() => expect(prompt).toHaveBeenCalledOnce());
    expect(screen.queryByRole('button', { name: 'Install app' })).toBeNull();
  });

  it('toggles the offline banner on network events', () => {
    render(<App />);
    expect(screen.queryByText("You're offline. Your swaps are saved on this device.")).toBeNull();
    act(() => window.dispatchEvent(new Event('offline')));
    expect(document.querySelector('.offline-banner').textContent).toBe("You're offline. Your swaps are saved on this device.");
    act(() => window.dispatchEvent(new Event('online')));
    expect(screen.queryByText("You're offline. Your swaps are saved on this device.")).toBeNull();
  });

  it('hides install guidance while running standalone', () => {
    const matchMedia = vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
      matches: query === '(display-mode: standalone)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));
    try {
      render(<App />);
      const event = new Event('beforeinstallprompt', { cancelable: true });
      event.prompt = vi.fn();
      event.userChoice = Promise.resolve({ outcome: 'accepted' });
      act(() => window.dispatchEvent(event));
      expect(screen.queryByRole('button', { name: 'Install app' })).toBeNull();
      expect(screen.queryByText('Tap Share, then Add to Home Screen')).toBeNull();
    } finally {
      matchMedia.mockRestore();
    }
  });

  it('loads older saved state without goals', () => {
    localStorage.setItem('campus-skill-swap.react.v1', JSON.stringify({
      profile: null,
      requests: []
    }));
    render(<App />);
    expect(screen.getByText('Learning goals')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('campus-skill-swap.react.v1')).goals).toEqual([]);
  });

  it('adds and removes a learning goal', () => {
    localStorage.setItem('campus-skill-swap.react.v1', JSON.stringify({
      profile: {
        name: 'Test Student', college: 'Test Campus', teaches: ['Python'], wants: ['Guitar'],
        when: 'Weekday evenings', mode: 'Online', bio: ''
      },
      requests: []
    }));
    render(<App />);
    fireEvent.change(screen.getByLabelText('Goal target'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add goal' }));
    expect(within(document.querySelector('.goal-list')).getByText('Guitar')).toBeTruthy();
    expect(screen.getByText('0 of 2 sessions')).toBeTruthy();
    const progress = screen.getByRole('progressbar', { name: 'Guitar goal progress' });
    expect(progress.getAttribute('aria-valuenow')).toBe('0');
    expect(progress.getAttribute('aria-valuemin')).toBe('0');
    expect(progress.getAttribute('aria-valuemax')).toBe('2');
    fireEvent.click(screen.getByRole('button', { name: 'Remove Guitar goal' }));
    expect(screen.queryByRole('progressbar', { name: 'Guitar goal progress' })).toBeNull();
  });

  it('shows a toast and reached state when a goal is completed', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('Fill with example data'));
    fireEvent.click(screen.getAllByText('Request swap')[0]);
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Request a swap' })).getByText('Send request'));
    fireEvent.click(screen.getByText('They accepted'));
    fireEvent.change(screen.getByLabelText('Goal target'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add goal' }));
    fireEvent.click(screen.getByText('Mark session done'));
    expect(await screen.findByText('Guitar goal reached!')).toBeTruthy();
    expect(screen.getByText('Goal reached')).toBeTruthy();
  });

  it('suggests teachable skills when no matches are found and reruns matching', () => {
    localStorage.setItem('campus-skill-swap.react.v1', JSON.stringify({
      profile: {
        name: 'Test Student', college: 'Test Campus', teaches: ['Unlisted skill'],
        wants: ['Another unlisted skill'], when: 'Weekday evenings', mode: 'Online', bio: ''
      },
      requests: []
    }));
    render(<App />);
    expect(screen.getByText('No matches yet')).toBeTruthy();
    const suggestions = screen.getByRole('group', { name: 'Skills students can teach' });
    expect(within(suggestions).getByRole('button', { name: '+ Python' })).toBeTruthy();
    fireEvent.click(within(suggestions).getByRole('button', { name: '+ Python' }));
    expect([...document.querySelectorAll('.chip.want')].some(chip => chip.textContent.includes('Python'))).toBe(true);
    expect(screen.queryByText('No matches yet')).toBeNull();
    expect(screen.getByText(/match(?:es)? for Test/)).toBeTruthy();
  });

  it('shows field-level validation errors and focuses the first invalid field', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Find matches' }));
    expect(document.activeElement).toBe(screen.getByLabelText('Your name'));
    expect(screen.getByText('Tell us your name.').getAttribute('role')).toBe('alert');
    expect(screen.getByText('Add your college or campus.').getAttribute('role')).toBe('alert');
    expect(screen.getByText('Add at least one skill you can teach.').getAttribute('role')).toBe('alert');
    expect(screen.getByText('Add at least one skill you want to learn.').getAttribute('role')).toBe('alert');
    expect(screen.getByLabelText('Your name').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText('Your name').getAttribute('aria-describedby')).toBe('nameError');

    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Ada' } });
    expect(screen.queryByText('Tell us your name.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Find matches' }));
    expect(document.activeElement).toBe(screen.getByLabelText('College / campus'));
    fireEvent.change(screen.getByLabelText('College / campus'), { target: { value: 'Campus' } });
    fireEvent.click(screen.getByRole('button', { name: 'Find matches' }));
    expect(document.activeElement).toBe(screen.getAllByPlaceholderText('Add a skill…')[0]);
    fireEvent.click(document.querySelector('.field .suggest button'));
    expect(screen.queryByText('Add at least one skill you can teach.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Find matches' }));
    expect(document.activeElement).toBe(screen.getAllByPlaceholderText('Add a skill…')[1]);
  });

  it('shows the error boundary fallback', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      render(<ErrorBoundary><Broken /></ErrorBoundary>);
      expect(screen.getByRole('alert').textContent).toContain('Something went wrong');
      expect(screen.getByRole('button', { name: 'Reload' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Clear my saved data and reload' })).toBeTruthy();
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('recovers corrupt saved JSON to default state', () => {
    localStorage.setItem('campus-skill-swap.react.v1', '{broken json');
    render(<App />);
    expect(screen.getByText('Your matches will show up here')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('campus-skill-swap.react.v1'))).toEqual({ profile: null, requests: [], goals: [] });
  });

  it('shows a 404 view for paths outside the app root', () => {
    window.history.replaceState({}, '', '/missing-page#section');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Go to Campus Skill Swap' }).getAttribute('href')).toBe('/');
  });

  it('shows a dismissible warning when localStorage cannot be written', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    try {
      render(<App />);
      expect(screen.getByRole('alert').textContent).toContain("Your progress can't be saved in this browser mode.");
      fireEvent.click(screen.getByRole('button', { name: 'Dismiss storage warning' }));
      expect(screen.queryByText("Your progress can't be saved in this browser mode.")).toBeNull();
    } finally {
      setItemSpy.mockRestore();
    }
  });

  it('auto-starts the tour on first visit', () => {
    render(<App autoStartTour />);
    expect(screen.getByRole('dialog', { name: 'Welcome' })).toBeTruthy();
  });

  it('does not auto-start the tour when it has already been seen', () => {
    localStorage.setItem('tourSeen', 'true');
    render(<App autoStartTour />);
    expect(screen.queryByRole('dialog', { name: 'Welcome' })).toBeNull();
  });

  it('supports Next, Back, and Skip and saves tourSeen', () => {
    render(<App autoStartTour={false} />);
    const trigger = screen.getAllByRole('link', { name: 'Take the tour' })[0];
    trigger.focus();
    fireEvent.click(trigger);
    let dialog = screen.getByRole('dialog', { name: 'Welcome' });
    expect(document.activeElement).toBe(within(dialog).getByRole('heading', { name: 'Welcome' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('dialog', { name: 'Tell us your trade' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('dialog', { name: 'Get matched' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    dialog = screen.getByRole('dialog', { name: 'Tell us your trade' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Skip' }));
    expect(screen.queryByRole('dialog', { name: 'Tell us your trade' })).toBeNull();
    expect(localStorage.getItem('tourSeen')).toBe('true');
    expect(document.activeElement).toBe(trigger);
  });

  it('traps keyboard focus and skips the tour on Escape', () => {
    render(<App autoStartTour />);
    const dialog = screen.getByRole('dialog', { name: 'Welcome' });
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: 'Next' }));
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: 'Skip' }));
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Welcome' })).toBeNull();
    expect(localStorage.getItem('tourSeen')).toBe('true');
  });

  it('renders the community', () => {
    render(<App />);
    expect(screen.getByText('Browse the community')).toBeTruthy();
    expect(screen.getByText('Amara Okafor', { selector: '#browse strong' })).toBeTruthy();
  });

  it('opens the share card dialog after saving a profile', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Fill with example data'));
    fireEvent.click(screen.getByRole('button', { name: 'Share my swap card' }));
    const dialog = screen.getByRole('dialog', { name: 'Your SwapSkill card' });
    expect(dialog.open).toBe(true);
    expect(within(dialog).getByText('Tolu Adebayo')).toBeTruthy();
  });

  it('builds the share message with the current page URL', () => {
    expect(buildShareText({
      teaches: ['Python', 'Excel'],
      wants: ['Guitar']
    }, 'https://campus.example/swap')).toBe(
      'I teach Python and Excel. I want to learn Guitar. Swap skills with me on Campus Skill Swap: https://campus.example/swap'
    );
  });

  it('fills demo data, shows matches, and runs a swap end to end', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Fill with example data'));
    expect(screen.getByText(/matches for Tolu/)).toBeTruthy();
    expect(screen.getAllByText('Mutual swap').length).toBeGreaterThan(0);

    // request a swap from the first match
    fireEvent.click(screen.getAllByText('Request swap')[0]);
    const dlg = screen.getByRole('dialog', { name: 'Request a swap' });
    expect(dlg.open).toBe(true);
    fireEvent.click(within(dlg).getByText('Send request'));
    expect(document.querySelectorAll('.req').length).toBe(1);
    expect(document.querySelector('.ring span').textContent).toBe('10');

    fireEvent.click(screen.getByText('They accepted'));
    fireEvent.click(screen.getByText('Mark session done'));
    expect(document.querySelector('.ring span').textContent).toBe('100');
    expect(JSON.parse(localStorage.getItem('campus-skill-swap.react.v1')).requests[0].doneAt).toEqual(expect.any(Number));
    expect(document.querySelector('.level-name').textContent).toBe('Swapper');
  });

  it('schedules an accepted swap and persists its session', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Fill with example data'));
    fireEvent.click(screen.getAllByText('Request swap')[0]);
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Request a swap' })).getByText('Send request'));
    fireEvent.click(screen.getByText('They accepted'));
    fireEvent.click(screen.getByRole('button', { name: 'Schedule session' }));

    const dialog = screen.getByRole('dialog', { name: 'Schedule session' });
    const future = new Date(Date.now() + 86_400_000);
    const dateValue = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
    fireEvent.change(within(dialog).getByLabelText('Date'), { target: { value: dateValue } });
    fireEvent.change(within(dialog).getByLabelText('Start time'), { target: { value: '16:00' } });
    fireEvent.change(within(dialog).getByLabelText('Duration'), { target: { value: '45' } });
    fireEvent.click(within(dialog).getByText('Save session'));

    expect(dialog.open).toBe(false);
    expect(screen.getByLabelText('Scheduled session').textContent).toMatch(/4:00 PM, 45 min/);
    expect(screen.getByRole('button', { name: 'Add to calendar' })).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('campus-skill-swap.react.v1')).requests[0].session.minutes).toBe(45);
  });

  it('saves and edits a review for a completed swap', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Fill with example data'));
    fireEvent.click(screen.getAllByText('Request swap')[0]);
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Request a swap' })).getByText('Send request'));
    fireEvent.click(screen.getByText('They accepted'));
    fireEvent.click(screen.getByText('Mark session done'));
    fireEvent.click(screen.getByRole('button', { name: 'Rate this swap' }));

    let dialog = screen.getByRole('dialog', { name: /Rate your swap with/ });
    fireEvent.click(within(dialog).getByRole('radio', { name: '4 stars' }));
    fireEvent.change(within(dialog).getByLabelText(/Review/), { target: { value: 'Great session!' } });
    fireEvent.click(within(dialog).getByRole('checkbox', { name: "I'd swap with them again" }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save review' }));

    let saved = JSON.parse(localStorage.getItem('campus-skill-swap.react.v1')).requests[0].review;
    expect(saved).toMatchObject({ rating: 4, text: 'Great session!', again: true });
    expect(saved.ts).toEqual(expect.any(Number));
    expect(screen.getByRole('img', { name: 'Rated 4 out of 5 stars' })).toBeTruthy();
    expect(screen.getByText('Great session!')).toBeTruthy();
    expect(document.querySelector('.ring span').textContent).toBe('120');
    expect(screen.getByText('Feedback giver')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Edit review' }));
    dialog = screen.getByRole('dialog', { name: /Rate your swap with/ });
    fireEvent.click(within(dialog).getByRole('radio', { name: '2 stars' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save review' }));
    saved = JSON.parse(localStorage.getItem('campus-skill-swap.react.v1')).requests[0].review;
    expect(saved.rating).toBe(2);
    expect(document.querySelector('.ring span').textContent).toBe('120');
  });

  it('sorts community cards by rating', () => {
    render(<App />);
    const cards = () => [...document.querySelectorAll('#browse .m-card')];
    expect(cards()[0].textContent).toContain('Amara Okafor');
    fireEvent.change(screen.getByRole('combobox', { name: 'Sort by' }), { target: { value: 'rating' } });
    expect(cards()[0].textContent).toContain('Camille Laurent');
    expect(cards()[0].querySelector('.rating').textContent).toContain('4.9 (17)');
  });

  it('creates valid calendar content for a scheduled swap', () => {
    const content = buildCalendarContent({
      id: 'swap-1', offer: 'Guitar', learn: 'Python', mname: 'Amara Okafor'
    }, { start: '2026-11-28T16:00:00.000Z', minutes: 45 }, new Date('2026-11-20T08:00:00.000Z'));

    expect(content).toContain('SUMMARY:Skill swap: Guitar for Python with Amara Okafor');
    expect(content).toContain('DTSTART:20261128T160000Z');
    expect(content).toContain('DTEND:20261128T164500Z');
    expect(content).toContain('BEGIN:VCALENDAR\r\n');
    expect(content).toContain('END:VCALENDAR\r\n');
  });

  it('validates the form', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Find matches' }));
    expect(screen.getByText('Tell us your name.').textContent).toBe('Tell us your name.');
  });

  it('asks you to add skills before requesting a swap', () => {
    render(<App />);
    fireEvent.click(screen.getAllByText('Request swap')[0]);
    expect(document.querySelector('dialog').open).toBe(false);
    expect(screen.getByRole('status').textContent).toMatch(/Add your skills first/);
  });

  it('filters by search and category', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Search students'), { target: { value: 'guitar' } });
    const n = document.querySelectorAll('#browse .m-card').length;
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(SEED.length);
    fireEvent.change(screen.getByLabelText('Search students'), { target: { value: '' } });
    fireEvent.click(screen.getByText('Fitness'));
    expect(document.querySelectorAll('#browse .m-card').length).toBe(2); // Diego, Aisha
    fireEvent.change(screen.getByLabelText('Search students'), { target: { value: 'no-such-student' } });
    expect(screen.getByText('No search results')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(document.querySelectorAll('#browse .m-card').length).toBe(SEED.length);
  });

  it('adds and removes skill chips, and persists the profile', () => {
    const { unmount } = render(<App />);
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Ada Lovelace' } });
    fireEvent.change(screen.getByLabelText('College / campus'), { target: { value: 'Test U' } });
    const [teachInput, wantInput] = screen.getAllByPlaceholderText('Add a skill…');
    fireEvent.change(teachInput, { target: { value: 'python' } });
    fireEvent.keyDown(teachInput, { key: 'Enter' });
    fireEvent.change(wantInput, { target: { value: 'guitar' } });
    fireEvent.keyDown(wantInput, { key: 'Enter' });
    expect(document.querySelector('.chip.teach').textContent).toContain('Python');
    expect(document.querySelector('.chip.want').textContent).toContain('Guitar');
    fireEvent.click(screen.getByLabelText('Remove Python'));
    expect(document.querySelector('.chip.teach')).toBeNull();
    fireEvent.change(teachInput, { target: { value: 'python' } });
    fireEvent.keyDown(teachInput, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Find matches' }));
    expect(screen.getByText(/matches for Ada/)).toBeTruthy();
    unmount();
    render(<App />); // reload
    expect(screen.getByText(/matches for Ada/)).toBeTruthy();
  });

  it('resets everything', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Fill with example data'));
    fireEvent.click(screen.getByText('Reset my data'));
    expect(screen.getByText('Your matches will show up here')).toBeTruthy();
  });

  it('escapes user text instead of injecting HTML', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: '<img src=x onerror=alert(1)>' } });
    fireEvent.change(screen.getByLabelText('College / campus'), { target: { value: 'X' } });
    const [teachInput, wantInput] = screen.getAllByPlaceholderText('Add a skill…');
    fireEvent.change(teachInput, { target: { value: 'Python' } });
    fireEvent.keyDown(teachInput, { key: 'Enter' });
    fireEvent.change(wantInput, { target: { value: 'Guitar' } });
    fireEvent.keyDown(wantInput, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Find matches' }));
    expect(document.querySelector('#browse img')).toBeNull();
  });
});
