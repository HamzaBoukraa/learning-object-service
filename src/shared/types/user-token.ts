/**
 * The identity of a user in the CLARK system that allows us to authorize requests.
 * @interface
 */
export interface UserToken {
  username: string;
  name: string;
  email: string;
  organization: string;
  emailVerified: boolean;
  accessGroups: string[];
}

export const accessGroups = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  CURATOR: 'curator',
  REVIEWER: 'reviewer',
  USER: 'user',
};
