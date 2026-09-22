export class PublicCodeCollisionError extends Error {
  constructor() {
    super("A generated public booking code collided with an existing code.");
    this.name = "PublicCodeCollisionError";
  }
}
