export type UserMetadata = {
  full_name?: string;
  name?: string;
  email?: string;
  avatar_url?: string;
};

export type AuthUser = {
  email: string;
  user_metadata: UserMetadata;
};
