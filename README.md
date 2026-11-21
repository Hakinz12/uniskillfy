# Uniskillfy

**Swap skills on campus.**

[Live demo](https://uniskillfy.vercel.app) | [Demo video](DEMO_VIDEO_LINK) | [GitHub](https://github.com/hakinz12/uniskillfy)

![Uniskillfy home page](docs/screenshot-home.png)

![Uniskillfy matches](docs/screenshot-matches.png)

![Uniskillfy swap card](docs/screenshot-swap-card.png)

## Why it exists

Students often pay for tutors or give up on learning something that a classmate could teach. Uniskillfy makes those connections visible and turns each exchange into an even trade. There is no money involved: students share what they know and learn something useful in return.

## Features

- Ranked skill matching with mutual swaps placed first.
- Community browse with search, category filters, and a top-rated sort.
- Swap requests with pending, accepted, and done statuses.
- Session scheduling with date, start time, duration, and `.ics` calendar downloads.
- Ratings and reviews for completed swaps, including seeded demo ratings.
- Learning goals and weekly swap streaks with progress cards and badges.
- A shareable swap card rendered as a 1080x1350 PNG for sharing or downloading.
- Points, five levels, and gamified badges for completed swaps and participation.
- A guided, one-time tour with replay links in the navigation and footer.
- Installable, offline PWA behavior with service-worker caching and install prompts.
- Light and dark themes.
- Polished empty states, inline form errors, an error boundary, storage recovery, and a 404 page.
- Profile and swap data saved in the browser with `localStorage`, with no backend or sign-up.

## How the matcher works

`computeMatches` in `src/data.js` compares what each student teaches with what the user wants to learn, and what the user teaches with what the student wants to learn. It calculates overlap in both directions, ranks mutual matches first, and sorts other matches by score. Availability and session-style compatibility add small bonuses to the final score.

## Tech

- React 18
- Vite
- vite-plugin-pwa
- Vitest and Testing Library
- Hand-written CSS with light and dark themes
- Google Fonts: Poppins
- Deployed on Vercel

## Run it locally

```bash
npm install
npm run dev
npm test
npm run build
```

## Project structure

```text
src/
  App.jsx
  App.test.jsx
  calendar.js
  data.js
  main.jsx
  styles.css
  components/
    Browse.jsx
    Cards.jsx
    ChipInput.jsx
    ErrorBoundary.jsx
    Layout.jsx
    Match.jsx
    NotFound.jsx
    RequestDialog.jsx
    Swaps.jsx
    SwapCard.jsx
    Tour.jsx
    ui.jsx
  hooks/
    useAppState.js
    usePwa.js
  test-pwa-register.js
  test-setup.js
```

## Lighthouse

Measured on the live site with PageSpeed Insights.

| Device | Performance | Accessibility | Best Practices | SEO |
|---|---:|---:|---:|---:|
| Mobile | 83 | 97 | 100 | 92 |
| Desktop | 100 | 97 | 100 | 92 |

## AI disclosure

Uniskillfy was built with help from Claude (Anthropic) for planning, design, and code, and GitHub Copilot for implementing features and fixes. The project uses React, Vite, vite-plugin-pwa, Vitest, Testing Library, and Poppins. It uses no UI frameworks or templates.

All student profiles and seeded ratings are fictional demo data.

## Limitations and next steps

This is a front-end prototype, and all profiles and swaps are stored locally in the browser. The "They accepted" action is manual because there is no server. A production version would add accounts, shared data, real-time updates, and chat.
