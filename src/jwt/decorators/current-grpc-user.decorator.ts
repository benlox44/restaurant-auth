import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { JWT_PURPOSE } from '../../common/constants/jwt-purpose.constant.js';
import type { JwtPayload } from '../types/jwt-payload.type.js';

/**
 * Decorador para extraer el usuario actual del metadata de gRPC
 * Similar a @CurrentUser pero para gRPC
 * 
 * Uso:
 * @GrpcMethod('UsersService', 'GetProfile')
 * async getProfile(@CurrentGrpcUser() user: JwtPayload) {
 *   // user.sub contiene el userId
 * }
 */
export const CurrentGrpcUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const metadata = ctx.switchToRpc().getContext();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    const authHeader = metadata.get('authorization');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const authorization = authHeader?.[0];

    if (!authorization || typeof authorization !== 'string') {
      throw new UnauthorizedException('Authorization token required');
    }

    const token = authorization.replace('Bearer ', '');
    
    try {
      const jwtService = new JwtService({
        secret: process.env.JWT_SECRET,
      });
      
      const payload = jwtService.verify<JwtPayload>(token);
      
      // Verificar que sea un token de sesión
      if (payload.purpose !== JWT_PURPOSE.SESSION) {
        throw new UnauthorizedException('Invalid token purpose');
      }
      
      return payload;
    } catch (_error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  },
);
