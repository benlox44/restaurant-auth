import { Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

/**
 * Filtro de excepciones para gRPC
 * Convierte excepciones HTTP de NestJS a códigos de error gRPC apropiados
 */
@Catch()
export class GrpcExceptionFilter implements ExceptionFilter {
  public catch(exception: unknown): Observable<never> {
    // Si ya es una RpcException, la dejamos pasar
    if (exception instanceof RpcException) {
      return throwError(() => exception.getError());
    }

    // Si es una HttpException de NestJS, la convertimos a gRPC
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const message = exception.message;
      const grpcCode = this.httpStatusToGrpcCode(status);

      return throwError(() => ({
        code: grpcCode,
        message: message,
      }));
    }

    // Para errores desconocidos
    return throwError(() => ({
      code: 13, // INTERNAL
      message: exception instanceof Error ? exception.message : 'Internal server error',
    }));
  }

  /**
   * Mapea códigos HTTP a códigos gRPC
   * https://grpc.github.io/grpc/core/md_doc_statuscodes.html
   */
  private httpStatusToGrpcCode(httpStatus: number): number {
    const mapping: Record<number, number> = {
      [HttpStatus.BAD_REQUEST]: 3,           // INVALID_ARGUMENT
      [HttpStatus.UNAUTHORIZED]: 16,         // UNAUTHENTICATED
      [HttpStatus.FORBIDDEN]: 7,             // PERMISSION_DENIED
      [HttpStatus.NOT_FOUND]: 5,             // NOT_FOUND
      [HttpStatus.CONFLICT]: 6,              // ALREADY_EXISTS
      [HttpStatus.TOO_MANY_REQUESTS]: 8,     // RESOURCE_EXHAUSTED
      [HttpStatus.INTERNAL_SERVER_ERROR]: 13, // INTERNAL
      [HttpStatus.NOT_IMPLEMENTED]: 12,      // UNIMPLEMENTED
      [HttpStatus.SERVICE_UNAVAILABLE]: 14,  // UNAVAILABLE
      [HttpStatus.GATEWAY_TIMEOUT]: 4,       // DEADLINE_EXCEEDED
    };

    return mapping[httpStatus] || 13; // Default: INTERNAL
  }
}
