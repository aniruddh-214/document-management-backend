import ZodHelper from './zod.helper';

describe('ZodHelper', () => {
  describe('convertStringToBoolean', () => {
    it('should return true for "true"', () => {
      expect(ZodHelper.convertStringToBoolean('true')).toBe(true);
    });

    it('should return false for "false"', () => {
      expect(ZodHelper.convertStringToBoolean('false')).toBe(false);
    });

    it('should return undefined for other strings', () => {
      expect(ZodHelper.convertStringToBoolean('TRUE')).toBeUndefined();
      expect(ZodHelper.convertStringToBoolean('yes')).toBeUndefined();
      expect(ZodHelper.convertStringToBoolean('')).toBeUndefined();
      expect(ZodHelper.convertStringToBoolean('null')).toBeUndefined();
    });
  });

  describe('cleanName', () => {
    it('should trim extra spaces and normalize to single spaces', () => {
      expect(ZodHelper.cleanName('  John   Doe  ')).toBe('John Doe');
    });

    it('should remove special characters', () => {
      expect(ZodHelper.cleanName('John@# Doe!!')).toBe('John Doe');
    });

    it('should lowercase and then capitalize each word', () => {
      expect(ZodHelper.cleanName('jOhN dOE')).toBe('John Doe');
    });

    it('should return empty string if input is empty', () => {
      expect(ZodHelper.cleanName('')).toBe('');
    });

    it('should handle names with multiple words correctly', () => {
      expect(ZodHelper.cleanName("mary ann o'connor")).toBe('Mary Ann Oconnor');
    });

    it('should handle names with no spaces', () => {
      expect(ZodHelper.cleanName('alice')).toBe('Alice');
    });
  });
});
