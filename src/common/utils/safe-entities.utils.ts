import { User } from '../../users/entities/user.entity.js';
import { SafeUser } from '../types/safe-entities.type.js';

export function toSafeUser(user: User): SafeUser {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}
