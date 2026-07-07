// Static WoW game data (classes/specs don't change week to week).
// Only the roster itself is fetched live from the Google Sheet.

const SHEET_ID = '1hVwHQ2ZHCjC2pSKhaD9ekOdGnBcrM8E0oyN632VVtUk';
const SHEET_TAB = 'Midnight Indication of interest';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TAB)}`;

// Update these if the raid's target composition changes for a new tier.
const TARGETS = {
  roles: { Tank: 2, Healer: 5, Melee: 8, Ranged: 8 },
  armor: { Cloth: 5, Leather: 6, Mail: 6, Plate: 6 },
  total: 23,
};

const CLASS_COLORS = {
  'Death Knight': '#C41F3B',
  'Demon Hunter': '#A330C9',
  'Druid': '#FF7D0A',
  'Evoker': '#33937F',
  'Hunter': '#ABD473',
  'Mage': '#69CCF0',
  'Monk': '#00FF96',
  'Paladin': '#F58CBA',
  'Priest': '#F0F0F0',
  'Rogue': '#FFF569',
  'Shaman': '#0070DE',
  'Warlock': '#9482C9',
  'Warrior': '#C79C6E',
};

const CLASS_ARMOR = {
  'Mage': 'Cloth', 'Priest': 'Cloth', 'Warlock': 'Cloth',
  'Druid': 'Leather', 'Demon Hunter': 'Leather', 'Monk': 'Leather', 'Rogue': 'Leather',
  'Hunter': 'Mail', 'Shaman': 'Mail', 'Evoker': 'Mail',
  'Death Knight': 'Plate', 'Paladin': 'Plate', 'Warrior': 'Plate',
};

const SPEC_ROLE = {
  // Tank
  'Vengeance': 'Tank', 'Guardian': 'Tank', 'Protection': 'Tank', 'Brewmaster': 'Tank', 'Blood': 'Tank',
  // Healer
  'Restoration': 'Healer', 'Preservation': 'Healer', 'Holy': 'Healer', 'Discipline': 'Healer', 'Mistweaver': 'Healer',
  // Melee
  'Havoc': 'Melee', 'Feral': 'Melee', 'Survival': 'Melee', 'Retribution': 'Melee', 'Assassination': 'Melee',
  'Outlaw': 'Melee', 'Subtlety': 'Melee', 'Enhancement': 'Melee', 'Windwalker': 'Melee', 'Arms': 'Melee',
  'Fury': 'Melee', 'Frost DK': 'Melee', 'Unholy': 'Melee',
  // Ranged
  'Balance': 'Ranged', 'Augmentation': 'Ranged', 'Devastation': 'Ranged', 'Beast Mastery': 'Ranged',
  'Marksmanship': 'Ranged', 'Arcane': 'Ranged', 'Fire': 'Ranged', 'Frost': 'Ranged', 'Shadow': 'Ranged',
  'Elemental': 'Ranged', 'Affliction': 'Ranged', 'Demonology': 'Ranged', 'Destruction': 'Ranged', 'Devourer': 'Ranged',
};

const ROLE_ICON = { Tank: '\u{1F6E1}', Healer: '❤️', Melee: '⚔️', Ranged: '\u{1F3F9}' };
