# Soup Squad — Midnight Roster

Live class/spec roster dashboard for the Soup Squad guild, hosted via GitHub Pages.

Roster data lives in Firestore (project `soup-squad-roster`) and syncs to the page in
real time — no backend, no build step. Guild members with the edit link
(`?key=...`, shared separately) can add, edit, and remove roster entries directly
from the site.

## How edits are stored

Every add/edit/delete is a new Firestore document (never an in-place update) grouped
by a stable `personId`; the page renders only the latest non-deleted entry per person.
This is deliberate: Firestore merges unspecified fields from the prior document into
partial updates, so a security rule that only checks "does the resulting document have
the right key" can be satisfied by a request that never supplies the key, as long as it
targets a document that already has one. Creates have no prior document to merge from,
so this can't be bypassed. See the rules in the Firebase console and the comment at the
top of [`js/app.js`](js/app.js) for details.

## Editing page text

The subtitle and footer notes (e.g. the tier name, or in-memoriam notes) are stored
in Firestore too, editable via the pencil icon next to the subtitle when using the
edit link — no code changes needed when the raid tier changes. Footer notes are a
list (one per line in the edit form); the page shows one at random on each visit.

## Local preview

Any static file server works, e.g. `npx serve .`

