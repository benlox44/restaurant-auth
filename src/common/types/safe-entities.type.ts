import { User } from '../../users/entities/user.entity.js';

export type SafeUser = Omit<User, 'password'>;
