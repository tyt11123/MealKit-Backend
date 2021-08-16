const bcrypt = require('../bcrypt');

describe("bcrypt", () => {
    test("hash password", () => {
      const entry = '';
      const expectedHead = "$2b$10$";
      expect(Promise.resolve(bcrypt.hashPassword(entry))).resolves.toMatch(expectedHead);
    });
    test("check password", async () => {
      const entry = '';
      const hash = await bcrypt.hashPassword(entry);
      expect(Promise.resolve(bcrypt.checkPassword(entry, hash))).resolves.toBe(true);
    });
  });
  