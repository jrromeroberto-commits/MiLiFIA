export class EntityNotFoundError extends Error {
  constructor(entity: string) {
    super(`${entity} no existe o no pertenece al usuario.`);
    this.name = "EntityNotFoundError";
  }
}
