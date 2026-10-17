/** An error whose message is safe to show to the user. */
export class SeoCheckError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'SeoCheckError';
    this.code = code;
  }
}
