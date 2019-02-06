export interface UserToken {
  username: string;
  name: string;
  email: string;
  organization: string;
  emailVerified: string;
  accessGroups: string[];
}

export const accessGroups = { 
  ADMIN: 'admin',
  EDITOR: 'editor',
  CURATOR: 'curator',
  REVIEWER: 'reviewer',
  USER: 'user'
}