import type { Response } from 'express';
import { env } from '../../config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController cookies', () => {
  const auth = {
    signup: jest.fn().mockResolvedValue({
      message: 'Signup successful',
      user: { _id: 'user-1', email: 'user@example.com', name: null },
      apiKey: 'key',
      token: 'token',
    }),
  };
  const controller = new AuthController(auth as unknown as AuthService);

  it('sets a host-only session cookie', async () => {
    const cookie = jest.fn();
    const response = {
      cookie,
    } as unknown as Response;

    await controller.signup({}, response);
    expect(cookie).toHaveBeenCalledWith('token', 'token', {
      httpOnly: true,
      secure: env.production,
      sameSite: 'lax',
      path: '/',
      maxAge: 604800000,
    });
  });

  it('clears the same host-only cookie on logout', () => {
    const clearCookie = jest.fn();
    const response = {
      clearCookie,
    } as unknown as Response;

    expect(controller.logout(response)).toEqual({
      message: 'Logged out successfully',
    });
    expect(clearCookie).toHaveBeenCalledWith('token', {
      httpOnly: true,
      secure: env.production,
      sameSite: 'lax',
      path: '/',
    });
  });
});
