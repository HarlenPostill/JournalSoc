export type UserRole = 'admin' | 'writer' | 'user';

export interface Profile {
  id: string;
  email: string;
  roles: UserRole[];
  updated_at: string;
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  is_reviewed: boolean;
  created_at: string;
  updated_at: string;
}
