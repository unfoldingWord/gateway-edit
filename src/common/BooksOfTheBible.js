export const NT_ORIG_LANG = 'el-x-koine'
export const NT_ORIG_LANG_BIBLE = 'ugnt'
export const OT_ORIG_LANG = 'hbo'
export const OT_ORIG_LANG_BIBLE = 'uhb'

/**
 * Nested version of the books of the bible object.
 */
export const BIBLE_BOOKS = {
  oldTestament: {
    gen: 'Genesis',
    exo: 'Exodus',
    lev: 'Leviticus',
    num: 'Numbers',
    deu: 'Deuteronomy',
    jos: 'Joshua',
    jdg: 'Judges',
    rut: 'Ruth',
    '1sa': '1 Samuel',
    '2sa': '2 Samuel',
    '1ki': '1 Kings',
    '2ki': '2 Kings',
    '1ch': '1 Chronicles',
    '2ch': '2 Chronicles',
    ezr: 'Ezra',
    neh: 'Nehemiah',
    est: 'Esther',
    job: 'Job',
    psa: 'Psalms',
    pro: 'Proverbs',
    ecc: 'Ecclesiastes',
    sng: 'Song of Solomon',
    isa: 'Isaiah',
    jer: 'Jeremiah',
    lam: 'Lamentations',
    ezk: 'Ezekiel',
    dan: 'Daniel',
    hos: 'Hosea',
    jol: 'Joel',
    amo: 'Amos',
    oba: 'Obadiah',
    jon: 'Jonah',
    mic: 'Micah',
    nam: 'Nahum',
    hab: 'Habakkuk',
    zep: 'Zephaniah',
    hag: 'Haggai',
    zec: 'Zechariah',
    mal: 'Malachi',
  },
  newTestament: {
    mat: 'Matthew',
    mrk: 'Mark',
    luk: 'Luke',
    jhn: 'John',
    act: 'Acts',
    rom: 'Romans',
    '1co': '1 Corinthians',
    '2co': '2 Corinthians',
    gal: 'Galatians',
    eph: 'Ephesians',
    php: 'Philippians',
    col: 'Colossians',
    '1th': '1 Thessalonians',
    '2th': '2 Thessalonians',
    '1ti': '1 Timothy',
    '2ti': '2 Timothy',
    tit: 'Titus',
    phm: 'Philemon',
    heb: 'Hebrews',
    jas: 'James',
    '1pe': '1 Peter',
    '2pe': '2 Peter',
    '1jn': '1 John',
    '2jn': '2 John',
    '3jn': '3 John',
    jud: 'Jude',
    rev: 'Revelation',
  },
}

export const NT_BOOKS = Object.keys(BIBLE_BOOKS.newTestament);
export const OT_BOOKS = Object.keys(BIBLE_BOOKS.oldTestament);

export const BIBLES_ABBRV_INDEX = {
  gen: '01',
  exo: '02',
  lev: '03',
  num: '04',
  deu: '05',
  jos: '06',
  jdg: '07',
  rut: '08',
  '1sa': '09',
  '2sa': '10',
  '1ki': '11',
  '2ki': '12',
  '1ch': '13',
  '2ch': '14',
  ezr: '15',
  neh: '16',
  est: '17',
  job: '18',
  psa: '19',
  pro: '20',
  ecc: '21',
  sng: '22',
  isa: '23',
  jer: '24',
  lam: '25',
  ezk: '26',
  dan: '27',
  hos: '28',
  jol: '29',
  amo: '30',
  oba: '31',
  jon: '32',
  mic: '33',
  nam: '34',
  hab: '35',
  zep: '36',
  hag: '37',
  zec: '38',
  mal: '39',
  mat: '41',
  mrk: '42',
  luk: '43',
  jhn: '44',
  act: '45',
  rom: '46',
  '1co': '47',
  '2co': '48',
  gal: '49',
  eph: '50',
  php: '51',
  col: '52',
  '1th': '53',
  '2th': '54',
  '1ti': '55',
  '2ti': '56',
  tit: '57',
  phm: '58',
  heb: '59',
  jas: '60',
  '1pe': '61',
  '2pe': '62',
  '1jn': '63',
  '2jn': '64',
  '3jn': '65',
  jud: '66',
  rev: '67',
}

export const ALL_BIBLE_BOOKS = {
  ...BIBLE_BOOKS.oldTestament,
  ...BIBLE_BOOKS.newTestament,
}

export const TN_FILENAMES = {
  gen: '_tn_01-GEN',
  exo: '_tn_02-EXO',
  lev: '_tn_03-LEV',
  num: '_tn_04-NUM',
  deu: '_tn_05-DEU',
  jos: '_tn_06-JOS',
  jdg: '_tn_07-JDG',
  rut: '_tn_08-RUT',
  '1sa': '_tn_09-1SA',
  '2sa': '_tn_10-2SA',
  '1ki': '_tn_11-1KI',
  '2ki': '_tn_12-2KI',
  '1ch': '_tn_13-1CH',
  '2ch': '_tn_14-2CH',
  ezr: '_tn_15-EZR',
  neh: '_tn_16-NEH',
  est: '_tn_17-EST',
  job: '_tn_18-JOB',
  psa: '_tn_19-PSA',
  pro: '_tn_20-PRO',
  ecc: '_tn_21-ECC',
  sng: '_tn_22-SNG',
  isa: '_tn_23-ISA',
  jer: '_tn_24-JER',
  lam: '_tn_25-LAM',
  ezk: '_tn_26-EZK',
  dan: '_tn_27-DAN',
  hos: '_tn_28-HOS',
  jol: '_tn_29-JOL',
  amo: '_tn_30-AMO',
  oba: '_tn_31-OBA',
  jon: '_tn_32-JON',
  mic: '_tn_33-MIC',
  nam: '_tn_34-NAM',
  hab: '_tn_35-HAB',
  zep: '_tn_36-ZEP',
  hag: '_tn_37-HAG',
  zec: '_tn_38-ZEC',
  mal: '_tn_39-MAL',
  mat: '_tn_41-MAT',
  mrk: '_tn_42-MRK',
  luk: '_tn_43-LUK',
  jhn: '_tn_44-JHN',
  act: '_tn_45-ACT',
  rom: '_tn_46-ROM',
  '1co': '_tn_47-1CO',
  '2co': '_tn_48-2CO',
  gal: '_tn_49-GAL',
  eph: '_tn_50-EPH',
  php: '_tn_51-PHP',
  col: '_tn_52-COL',
  '1th': '_tn_53-1TH',
  '2th': '_tn_54-2TH',
  '1ti': '_tn_55-1TI',
  '2ti': '_tn_56-2TI',
  tit: '_tn_57-TIT',
  phm: '_tn_58-PHM',
  heb: '_tn_59-HEB',
  jas: '_tn_60-JAS',
  '1pe': '_tn_61-1PE',
  '2pe': '_tn_62-2PE',
  '1jn': '_tn_63-1JN',
  '2jn': '_tn_64-2JN',
  '3jn': '_tn_65-3JN',
  jud: '_tn_66-JUD',
  rev: '_tn_67-REV',
}