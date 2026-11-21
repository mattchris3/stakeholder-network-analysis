// Builds the bundled demo snapshot from data/data.json.
// The app reads Firebase first and falls back to this file, so the demo
// still works if the database is unreachable. Admin records are left out:
// they never belong in the browser bundle.
import { readFileSync, writeFileSync } from 'node:fs';

const source = JSON.parse(readFileSync(new URL('../data/data.json', import.meta.url), 'utf8'));
const snapshot = {
  unities: source.unities,
  entities: source.entities,
  meetings: source.meetings,
};
const out = new URL('../src/data/demo-snapshot.json', import.meta.url);
writeFileSync(out, JSON.stringify(snapshot));
console.log(
  `Wrote ${Object.keys(snapshot.entities).length} entities and ` +
  `${Object.keys(snapshot.meetings).length} meetings to src/data/demo-snapshot.json`,
);
