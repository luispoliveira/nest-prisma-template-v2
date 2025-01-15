export class ApiKeyUtil {
  static generateApiKey(size = 32): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let apiKey = "";
    for (let i = 0; i < size; i++) {
      apiKey += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return apiKey;
  }

  static encode(key: string) {
    return btoa(key);
  }

  static decode(encodedKey: string) {
    return atob(encodedKey);
  }
}
