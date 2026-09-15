export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

export class ServerError extends ApiError {
  constructor(message: string, statusCode = 500) {
    super(message, statusCode);
    this.name = "ServerError";
  }
}

export class ClientError extends ApiError {
  constructor(message: string, statusCode = 400) {
    super(message, statusCode);
    this.name = "ClientError";
  }
}

export class MissingQueryParamError extends ClientError {
  constructor(name: string) {
    super(`Missing query parameter ${name}`);
    this.name = "MissingQueryParamError";
  }
}
export class MissingFormEntryError extends ClientError {
  constructor(name: string) {
    super(`Missing form entry ${name}`);
    this.name = "MissingFormEntryError";
  }
}

export class BadQueryParamError extends ClientError {
  constructor(name: string, badValue: string | string[]) {
    super(`Invalid value ${badValue} for query parameter ${name}`);
    this.name = "BadQueryParamError";
  }
}

export class NotAuthenticatedError extends ClientError {
  constructor(message = "Not authenticated") {
    super(message, 401);
    this.name = "NotAuthenticatedError";
  }
}

export class ForbiddenError extends ClientError {
  constructor(message = "Access forbidden") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends ClientError {
  constructor(message = "Not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends ClientError {
  constructor(message: string) {
    super(message, 409);
    this.name = "ConflictError";
  }
}
