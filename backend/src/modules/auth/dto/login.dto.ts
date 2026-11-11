import { BadRequestException } from '@nestjs/common';

export class LoginDto {
  email!: string;
  password!: string;

  static parse(body: Record<string, unknown>): LoginDto {
    const errors: Record<string, unknown>[] = [];
    if (typeof body.email !== 'string' || !/^\S+@\S+\.\S+$/.test(body.email)) {
      errors.push({
        type: 'field',
        value: body.email,
        msg: 'Please provide a valid email',
        path: 'email',
        location: 'body',
      });
    }
    if (typeof body.password !== 'string' || !body.password) {
      errors.push({
        type: 'field',
        value: body.password,
        msg: 'Password is required',
        path: 'password',
        location: 'body',
      });
    }
    if (errors.length) throw new BadRequestException({ errors });
    return {
      email: (body.email as string).trim().toLowerCase(),
      password: body.password as string,
    };
  }
}
