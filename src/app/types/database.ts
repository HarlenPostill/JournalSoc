export type UserRole = 'admin' | 'writer' | 'user';

export interface Profile {
  id: string;
  email: string;
  roles: UserRole[];
  updated_at: string;
  created_at: string;
}
