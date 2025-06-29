export default class ZodHelper {
  static convertStringToBoolean(data: string): boolean | undefined {
    if (data === 'true') {
      return true;
    } else if (data === 'false') {
      return false;
    } else {
      return;
    }
  }

  static cleanName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .toLowerCase()
      .replace(/\b\w/g, (c): string => c.toUpperCase());
  }
}
