import { Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

@Catch()
export class GrpcExceptionFilter implements ExceptionFilter {
  public catch(exception: unknown): Observable<never> {
    if (exception instanceof RpcException) {
      return throwError(() => exception.getError());
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const message = exception.message;
      const grpcCode = this.httpStatusToGrpcCode(status);

      return throwError(() => ({
        code: grpcCode,
        message: message,
      }));
    }

    return throwError(() => ({
      code: 13,
      message: exception instanceof Error ? exception.message : 'Internal server error',
    }));
  }

  private httpStatusToGrpcCode(httpStatus: number): number {
    const mapping: Record<number, number> = {
      [HttpStatus.BAD_REQUEST]: 3,
      [HttpStatus.UNAUTHORIZED]: 16,
      [HttpStatus.FORBIDDEN]: 7,
      [HttpStatus.NOT_FOUND]: 5,
      [HttpStatus.CONFLICT]: 6,
      [HttpStatus.TOO_MANY_REQUESTS]: 8,
      [HttpStatus.INTERNAL_SERVER_ERROR]: 13,
      [HttpStatus.NOT_IMPLEMENTED]: 12,
      [HttpStatus.SERVICE_UNAVAILABLE]: 14,
      [HttpStatus.GATEWAY_TIMEOUT]: 4,
    };

    return mapping[httpStatus] || 13;
  }
}
