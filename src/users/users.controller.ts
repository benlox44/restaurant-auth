import { Controller, UseFilters, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GrpcMethod, RpcException } from '@nestjs/microservices';

import { UsersService } from './users.service.js';

import { JWT_PURPOSE } from '../common/constants/jwt-purpose.constant.js';
import { GrpcExceptionFilter } from '../common/filters/grpc-exception.filter.js';
import type { SafeUser } from '../common/index.js';
import type { JwtPayload } from '../jwt/types/jwt-payload.type.js';

// Interfaces sin userId - se obtiene del token JWT
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface EmptyRequest {
  // Para métodos que solo necesitan el token
}

interface UpdateProfileRequest {
  name: string;
}

interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface RequestEmailUpdateRequest {
  password: string;
  newEmail: string;
}

interface DeleteAccountRequest {
  password: string;
}

@Controller()
@UseFilters(new GrpcExceptionFilter())
export class UsersController {
  public constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // Helper method to extract user from gRPC metadata
  private async extractUser(metadata: unknown): Promise<JwtPayload> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    const authHeader = (metadata as any).get('authorization');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const authorization = authHeader?.[0];

    if (!authorization || typeof authorization !== 'string') {
      throw new UnauthorizedException('Authorization token required');
    }

    const token = authorization.replace('Bearer ', '');
    
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      
      if (payload.purpose !== JWT_PURPOSE.SESSION) {
        throw new UnauthorizedException('Invalid token purpose');
      }
      
      // Verificar que el email del token coincida con el email actual en la BD
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      if (user.email !== payload.email) {
        throw new UnauthorizedException('Token is no longer valid. Please log in again.');
      }
      
      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  @GrpcMethod('UsersService', 'GetMyProfile')
  public async getMyProfile(
    _data: EmptyRequest,
    metadata: unknown,
  ): Promise<{ user: SafeUser }> {
    const user = await this.extractUser(metadata);
    const userData = await this.usersService.findMe(user.sub);
    return { user: userData };
  }

  @GrpcMethod('UsersService', 'UpdateProfile')
  public async updateProfile(
    data: UpdateProfileRequest,
    metadata: unknown,
  ): Promise<{ message: string }> {
    const user = await this.extractUser(metadata);
    
    // Validación de campo requerido
    if (!data?.name || data.name.trim() === '') {
      throw new RpcException({
        code: 3, // INVALID_ARGUMENT
        message: 'Name is required and cannot be empty',
      });
    }

    await this.usersService.updateProfile(user.sub, { name: data.name });
    return { message: 'Profile updated successfully.' };
  }

  @GrpcMethod('UsersService', 'UpdatePassword')
  public async updatePassword(
    data: UpdatePasswordRequest,
    metadata: unknown,
  ): Promise<{ message: string }> {
    const user = await this.extractUser(metadata);
    
    // Validación de campos requeridos
    if (!data?.currentPassword || !data?.newPassword) {
      throw new RpcException({
        code: 3, // INVALID_ARGUMENT
        message: 'Current password and new password are required',
      });
    }

    await this.usersService.updatePassword(user.sub, {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    return { message: 'Password updated successfully.' };
  }

  @GrpcMethod('UsersService', 'RequestEmailUpdate')
  public async requestEmailUpdate(
    data: RequestEmailUpdateRequest,
    metadata: unknown,
  ): Promise<{ message: string }> {
    const user = await this.extractUser(metadata);
    
    // Validación de campos requeridos
    if (!data?.password || !data?.newEmail) {
      throw new RpcException({
        code: 3, // INVALID_ARGUMENT
        message: 'Password and new email are required',
      });
    }

    await this.usersService.requestEmailUpdate(user.sub, {
      password: data.password,
      newEmail: data.newEmail,
    });
    return { message: 'Email update confirmation has been sent to your new email address.' };
  }

  @GrpcMethod('UsersService', 'DeleteAccount')
  public async deleteAccount(
    data: DeleteAccountRequest,
    metadata: unknown,
  ): Promise<{ message: string }> {
    const user = await this.extractUser(metadata);
    
    // Validación de campo requerido
    if (!data?.password) {
      throw new RpcException({
        code: 3, // INVALID_ARGUMENT
        message: 'Password is required to delete your account',
      });
    }

    await this.usersService.delete(user.sub);
    return { message: 'Your account has been deleted successfully.' };
  }
}
