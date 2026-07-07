// Static WoW game data (classes/specs don't change week to week).
// Roster data itself lives in Firestore (see js/app.js).

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBZwtoF0ov1Yym7J4GkXHAkevJA_G-DuVQ",
  authDomain: "soup-squad-roster.firebaseapp.com",
  projectId: "soup-squad-roster",
  storageBucket: "soup-squad-roster.firebasestorage.app",
  messagingSenderId: "588162871137",
  appId: "1:588162871137:web:68a3b1cf5dbd5443db9f20",
};

// Shared secret required to add/edit/delete members. Anyone with a link
// containing ?key=<this value> can edit — same trust model as a shared
// Google Sheet link. Change it (and re-share the link) if it ever leaks.
const EDIT_KEY = "K5TaDatoYYAm";

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

const CLASS_SPECS = {
  'Death Knight': ['Blood', 'Frost DK', 'Unholy'],
  'Demon Hunter': ['Havoc', 'Vengeance', 'Devourer'],
  'Druid': ['Balance', 'Feral', 'Guardian', 'Restoration'],
  'Evoker': ['Augmentation', 'Devastation', 'Preservation'],
  'Hunter': ['Beast Mastery', 'Marksmanship', 'Survival'],
  'Mage': ['Arcane', 'Fire', 'Frost'],
  'Monk': ['Brewmaster', 'Mistweaver', 'Windwalker'],
  'Paladin': ['Holy', 'Protection', 'Retribution'],
  'Priest': ['Discipline', 'Holy', 'Shadow'],
  'Rogue': ['Assassination', 'Outlaw', 'Subtlety'],
  'Shaman': ['Elemental', 'Enhancement', 'Restoration'],
  'Warlock': ['Affliction', 'Demonology', 'Destruction'],
  'Warrior': ['Arms', 'Fury', 'Protection'],
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
