import { v4 as uuidv4 } from 'uuid';

export class TokenUtil {
  static generate() {
    return uuidv4();
  }

  static getExpirationDate(interval = 1) {
    const date = new Date();
    date.setDate(date.getDate() + interval);
    return date;
  }
}
