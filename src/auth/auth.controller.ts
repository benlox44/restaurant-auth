import { Controller, UseFilters } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';

import { AuthService } from './auth.service.js';

import { GrpcExceptionFilter } from '../common/filters/grpc-exception.filter.js';

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface TokenRequest {
  token: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

interface EmailRequest {
  email: string;
}

@Controller()
@UseFilters(new GrpcExceptionFilter())
export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  @GrpcMethod('AuthService', 'Register')
  public async register(data: RegisterRequest): Promise<{ message: string }> {
    // Validación de campos requeridos
    if (!data.email || !data.password || !data.name) {
      throw new RpcException({
        code: 3, // INVALID_ARGUMENT
        message: 'Email, password, and name are required fields',
      });
    }

    const createUserDto = {
      email: data.email,
      password: data.password,
      name: data.name,
    };
    await this.authService.create(createUserDto);
    return { message: 'User registered successfully. Please check your email to confirm.' };
  }

  @GrpcMethod('AuthService', 'Login')
  public async login(data: LoginRequest): Promise<{ accessToken: string }> {
    // Validación de campos requeridos
    if (!data.email || !data.password) {
      throw new RpcException({
        code: 3, // INVALID_ARGUMENT
        message: 'Email and password are required fields',
      });
    }

    const loginDto = {
      email: data.email,
      password: data.password,
    };
    const accessToken = await this.authService.login(loginDto);
    return { accessToken };
  }

  @GrpcMethod('AuthService', 'RequestPasswordReset')
  public async requestPasswordReset(data: EmailRequest): Promise<{ message: string }> {
    // Validación de campo requerido
    if (!data.email) {
      throw new RpcException({
        code: 3, // INVALID_ARGUMENT
        message: 'Email is required',
      });
    }

    const requestDto = {
      email: data.email,
    };
    await this.authService.requestPasswordReset(requestDto);
    return { message: 'If your email is registered and confirmed, a password reset link has been sent.' };
  }

  @GrpcMethod('AuthService', 'ResetPassword')
  public async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    await this.authService.resetPassword(data.token, { newPassword: data.newPassword });
    return { message: 'Password has been reset successfully.' };
  }

  @GrpcMethod('AuthService', 'ResetPasswordAfterRevert')
  public async resetPasswordAfterRevert(data: ResetPasswordRequest): Promise<{ message: string }> {
    await this.authService.resetPasswordAfterRevert(data.token, { newPassword: data.newPassword });
    return { message: 'Password has been reset successfully.' };
  }

  @GrpcMethod('AuthService', 'RequestUnlock')
  public async requestUnlock(data: EmailRequest): Promise<{ message: string }> {
    // Validación de campo requerido
    if (!data.email) {
      throw new RpcException({
        code: 3, // INVALID_ARGUMENT
        message: 'Email is required',
      });
    }

    const requestDto = {
      email: data.email,
    };
    await this.authService.requestUnlock(requestDto);
    return { message: 'If your email is registered and your account is locked, an unlock link has been sent.' };
  }

  @GrpcMethod('AuthService', 'ConfirmEmail')
  public async confirmEmail(data: TokenRequest): Promise<{ message: string }> {
    await this.authService.confirmEmail(data.token);
    return { message: 'Your email has been confirmed successfully. You can now log in.' };
  }

  @GrpcMethod('AuthService', 'ConfirmEmailUpdate')
  public async confirmEmailUpdate(data: TokenRequest): Promise<{ message: string }> {
    await this.authService.confirmEmailUpdate(data.token);
    return { message: 'Your email has been updated successfully. Please log in again with your new email.' };
  }

  @GrpcMethod('AuthService', 'RevertEmail')
  public async revertEmail(data: TokenRequest): Promise<{ resetToken: string }> {
    const resetToken = await this.authService.revertEmail(data.token);
    return { resetToken };
  }

  @GrpcMethod('AuthService', 'UnlockAccount')
  public async unlockAccount(data: TokenRequest): Promise<{ message: string }> {
    await this.authService.unlockAccount(data.token);
    return { message: 'Your account has been unlocked successfully. You can now log in.' };
  }
}
