import { beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import App from './App.jsx';
import { SEED, computeMatches, levelInfo, points } from './data.js';

beforeEach(() => {
  cleanup();
  localStorage.clear();
});

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
    expect(levelInfo(110).name).toBe('Swapper');
    expect(levelInfo(0).name).toBe('Newcomer');
  });
});

describe('app flow', () => {
  it('renders the community', () => {
    render(<App />);
    expect(screen.getByText('Browse the community')).toBeTruthy();
    expect(screen.getByText('Amara Okafor', { selector: '#browse strong' })).toBeTruthy();
  });

  it('fills demo data, shows matches, and runs a swap end to end', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Fill with example data'));
    expect(screen.getByText(/matches for Tolu/)).toBeTruthy();
    expect(screen.getAllByText('Mutual swap').length).toBeGreaterThan(0);

    // request a swap from the first match
    fireEvent.click(screen.getAllByText('Request swap')[0]);
    const dlg = document.querySelector('dialog');
    expect(dlg.open).toBe(true);
    fireEvent.click(within(dlg).getByText('Send request'));
    expect(document.querySelectorAll('.req').length).toBe(1);
    expect(document.querySelector('.ring span').textContent).toBe('10');

    fireEvent.click(screen.getByText('They accepted'));
    fireEvent.click(screen.getByText('Mark session done'));
    expect(document.querySelector('.ring span').textContent).toBe('100');
    expect(document.querySelector('.level-name').textContent).toBe('Swapper');
  });

  it('validates the form', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Find matches' }));
    expect(screen.getByRole('alert').textContent).toBe('Tell us your name.');
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
