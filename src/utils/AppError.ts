import { StatusCodes } from "http-status-codes";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    public errors?: Record<string, string>,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
