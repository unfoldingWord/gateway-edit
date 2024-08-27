/* eslint-env jest */
import * as Languages from '../languages';

describe('Test Languages',()=>{
  const minimumLangCount = 9000;

  test('getLanguage() should work with mixed and lower case', () => {
    const codes = ['sr-latn', 'sr-Latn', 'SR-LATN', 'ur-deva', 'ur-Deva', 'UR-DEVA', 'ZH'];

    for (let languageId of codes) {
      const languageData = Languages.getLanguage({languageId});
      expect(languageData).toBeTruthy();
      expect(languageData.languageId.toLowerCase()).toEqual(languageId.toLowerCase());
    }
  });

  test('getLanguages() should work', () => {
    const languages = Languages.getLanguages();
    const langCount = languages.length;
    expect(langCount).toBeLessThan(minimumLangCount * 1.2);

    // make sure fields are valid and in sequence
    for (let i = 1; i < langCount; i++) {
      const lang = languages[i - 1];
      expect(lang.languageId.length).toBeGreaterThan(0);
      const languageName = lang.languageName || lang.localized
      if (!languageName.length) {
        console.log(`invalid languageName ${languageName} for languageId ${lang.languageId}`)
      }
      expect(lang.localized.length).toBeGreaterThan(0);
      if (!lang.localized.length) {
        console.log(`invalid localized ${lang.localized} for languageId ${lang.languageId}`)
      }
      expect(lang.localized.length).toBeGreaterThan(0);
      const directionValid = lang.direction === 'ltr' || lang.direction === 'rtl'
      if (!lang.localized.length) {
        console.log(`invalid direction ${lang.direction} for languageId ${lang.languageId}`)
      }
      expect(directionValid).toBeTruthy();
    }
  });

  test('getLanguages() verify no dupes among language codes.', () => {
    let languages = Languages.getLanguages();
    let localLanguageCodes = languages.map(language => language.languageId);

    const sorted = localLanguageCodes.sort();
    let dupsFound = 0;

    for ( let idx = 1; idx < sorted.length; idx++ ) {
      if ( sorted[idx] == sorted[idx-1]) {
        dupsFound++;
      }
    }

    expect(dupsFound).toBeLessThan(1);
    expect(sorted.length).toBeGreaterThan(minimumLangCount);
  });

  test('getGatewayLanguages() verify no dupes among language codes.', async () => {
    let languages = await Languages.getGatewayLanguages();
    let localLanguageCodes = languages.map(language => language.languageId);

    const sorted = localLanguageCodes.sort();
    let dupsFound = 0;

    for ( let idx = 1; idx < sorted.length; idx++ ) {
      if ( sorted[idx] == sorted[idx-1]) {
        dupsFound++;
      }
    }

    expect(dupsFound).toBeLessThan(1);
    const minimumGwLangs = 40;
    const maximumGwLangs = 100;
    expect(sorted.length).toBeGreaterThan(minimumGwLangs);
    expect(sorted.length).not.toBeGreaterThan(maximumGwLangs);
  });

  describe('getLanguage()',()=>{
    test('Nepali ne should succeed', () => {
      const code = 'ne';
      const name = 'Nepali';
      let foundLanguage = Languages.getLanguage({ languageId: code });

      expect(foundLanguage.languageName).toEqual(name);
      expect(foundLanguage.languageId).toEqual(code);
    });

    test('Nepali npi should succeed', () => {
      const code = 'npi';
      const name = 'Nepali';
      let foundLanguage = Languages.getLanguage({ languageId: code });

      expect(foundLanguage.languageName).toEqual(name);
      expect(foundLanguage.languageId).toEqual(code);
    });
  });
});
