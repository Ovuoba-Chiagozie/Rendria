import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { USER_COLUMNS, User, UserWithPassword } from './user.types';
import type { PoolClient } from 'pg';

@Injectable()
export class UsersRepository {
  constructor(private readonly database: DatabaseService) {}

  async create(
    email: string,
    passwordHash: string,
    client: PoolClient,
  ): Promise<User> {
    return (
      await client.query<User>(
        `INSERT INTO users (email,password_hash) VALUES ($1,$2) RETURNING ${USER_COLUMNS}`,
        [email, passwordHash],
      )
    ).rows[0];
  }

  async findById(id: string): Promise<User | undefined> {
    return (
      await this.database.query<User>(
        `SELECT ${USER_COLUMNS} FROM users WHERE id=$1`,
        [id],
      )
    ).rows[0];
  }

  async findByEmailWithPassword(
    email: string,
  ): Promise<UserWithPassword | undefined> {
    return (
      await this.database.query<UserWithPassword>(
        `SELECT ${USER_COLUMNS},password_hash FROM users WHERE email=$1`,
        [email],
      )
    ).rows[0];
  }
}
