# Soup Squad — Midnight Roster

Live class/spec roster dashboard for the Soup Squad guild, hosted via GitHub Pages.

Roster data is fetched client-side from a published Google Sheet (no backend, no build step).
Edit the sheet and the site picks up changes on next page load.

## Updating raid targets

When a new tier's target composition changes, edit the `TARGETS` object in
[`js/data.js`](js/data.js) (role counts, armor counts, total raid size).

## Local preview

Any static file server works, e.g. `npx serve .`

