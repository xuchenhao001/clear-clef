export class IngestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IngestValidationError";
  }
}
