import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Request, Response } from 'express';
import { CustomResponse, ErrorResponseData } from 'src/interfaces/response';

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const message = exception.message;
    const name = exception.name;

    let status: number;
    switch (exception.code) {
      case 'P2002':
        status = 409;
        break;
      case 'P2003':
        status = 400;
        break;
      case 'P2022':
      case 'P2025':
      case 'P2025':
        status = 404;
        break;
      default:
        status = 500;
        break;
    }

    const errorResponse: CustomResponse<ErrorResponseData> = {
      message: message,
      data: {
        name: name,
        path: request.url,
        timestamp: new Date().toISOString(),
      },
    };

    response.status(status).json(errorResponse);
  }
}
