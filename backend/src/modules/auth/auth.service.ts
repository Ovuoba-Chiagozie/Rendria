import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { env } from '../../config';
import { DatabaseService } from '../../database/database.service';
import { ApiKeyCryptoService } from '../api-keys/api-key-crypto.service';
import { publicUser, type User } from '../users/user.types';
import { UsersRepository } from '../users/users.repository';
import { ApiKeysRepository } from '../api-keys/api-keys.repository';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly database: DatabaseService,
    private readonly users: UsersRepository,
    private readonly apiKeys: ApiKeysRepository,
    private readonly apiKeyCrypto: ApiKeyCryptoService,
  ) {}

  async signup(body: Record<string, unknown>) {
    const { email, password } = SignupDto.parse(body);
    try {
      const key = this.apiKeyCrypto.create();
      const user = await this.database.transaction(async (client) => {
        const created = await this.users.create(
          email,
          await bcrypt.hash(password, 12),
          client,
        );
        await this.apiKeys.insert(created.id, key, client);
        return created;
      });
      return {
        message: 'Signup successful',
        user: publicUser(user),
        apiKey: key.key,
        token: this.token(user.id),
      };
    } catch (error: unknown) {
      if ((error as { code?: string }).code === '23505')
        throw new BadRequestException('Email already registered');
      throw new InternalServerErrorException('Server error');
    }
  }

  async login(body: Record<string, unknown>) {
    const { email, password } = LoginDto.parse(body);
    const user = await this.users.findByEmailWithPassword(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      throw new UnauthorizedException('Invalid credentials');
    return {
      message: 'Login successful',
      user: publicUser(user),
      token: this.token(user.id),
    };
  }

  async userFromToken(token?: string): Promise<User> {
    if (!token) throw new UnauthorizedException('Not authorized');
    let id: string;
    try {
      ({ id } = jwt.verify(token, env.jwtSecret, {
        algorithms: ['HS256'],
      }) as { id: string });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    const user = await this.users.findById(id);
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  private token(userId: string) {
    return jwt.sign({ id: userId }, env.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: '7d',
    });
  }
}
