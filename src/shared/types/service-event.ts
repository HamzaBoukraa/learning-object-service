import { UserToken } from '../../shared/types';

export type ServiceEvent = {
    category: number;
    payload: {
      username: string,
      author: string,
      learningObjectName: string,
      version: number,
      cuid: string,
    };
    requester: UserToken;
};
