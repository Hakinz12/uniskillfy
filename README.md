# Campus Skill Swap

**Trade what you know for what you want to learn.**
A peer-learning website where students list skills they can teach and skills they want to learn, get ranked matches (mutual swaps first), send swap requests, and earn points and badges as they complete sessions.

Built for the **Build Your Own Website** hackathon by Roxten Studios.

## Features

- **Smart matcher**: scores every student by how well your teach/learn lists line up, flags *mutual swaps* (you each have what the other wants), explains why, and adds small bonuses for matching availability and session style.
- **Chip-based skill input** with suggestions and autocomplete.
- **Browse the community**: search by skill, name or college; filter by category; toggle between "who can teach" and "who wants to learn".
- **Ratings and reviews**: review completed swaps, see community ratings, and sort Browse by top rated. Seeded ratings are illustrative demo data, not real student feedback.
- **Swap requests**: pick what you teach and what you learn, add a message, and track status (pending, accepted, done).
- **Gamification**: points, five levels, and badges.
- **Dark mode**, responsive layout, keyboard accessible, respects reduced-motion settings.
- Your profile and swaps are saved in your browser (`localStorage`). No backend, no sign-up.

## Tech

React 18 + Vite. Vitest and Testing Library for tests. No UI framework; hand-written CSS with design tokens and a light/dark theme.

```
src/
  data.js                  demo students and ratings, matching algorithm, points/levels/badges
  hooks/useAppState.js     persisted state, theme, count-up animation
  components/              Layout, Match, ChipInput, Browse, Cards, Swaps, RequestDialog, ui
  App.jsx                  page assembly + request flow
  App.test.jsx             matching logic and user-flow tests
```

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # run the test suite
npm run build    # production build in dist/
```

## Deploy (pick one)

**Netlify Drop** (fastest): run `npm run build`, then drag the `dist` folder onto https://app.netlify.com/drop.

**Vercel / Netlify from GitHub**: push the repo, import it, and use build command `npm run build` and output directory `dist`.

**GitHub Pages**: build, then publish the contents of `dist` (the Vite `base` is already set to `./`, so it works under a sub-path).

## AI disclosure

This project was designed and written with the help of Claude (Anthropic), an AI assistant. Libraries used: React, Vite, Vitest, Testing Library, and Google Fonts (Bricolage Grotesque, DM Sans). No templates or UI kits. All student profiles shown are fictional demo data.

## Notes

This is a front-end prototype. Seeded students are fictional, and "They accepted" is a manual button because there is no server. A production version would add accounts and real-time messaging.
