import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { JWT_PURPOSE } from '../../common/constants/jwt-purpose.constant.js';
import type { JwtPayload } from '../types/jwt-payload.type.js';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
export const CurrentGrpcUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const metadata = ctx.switchToRpc().getContext();
    const authHeader = metadata.get('authorization');
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
      
      if (payload.purpose !== JWT_PURPOSE.SESSION) {
        throw new UnauthorizedException('Invalid token purpose');
      }
      
      return payload;
    } catch (_error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  },
);
