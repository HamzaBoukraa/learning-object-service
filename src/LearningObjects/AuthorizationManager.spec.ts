import * as auth from './AuthorizationManager';
import { ResourceError } from '../errors';
import { UserToken } from '../types';

describe('LearningObjectDownload: AuthorizationManager', () => {
  let requester: UserToken;

  beforeEach(() => {
    requester = {
      name: '',
      username: 'authorUsername',
      accessGroups: [],
      emailVerified: true,
      email: '',
      organization: '',
    };
  });

  describe('requesterIsVerified', () => {
    it('should return true (Email verified)', () => {
      requester.emailVerified = true;
      expect(auth.requesterIsVerified(requester)).toBe(true);
    });
    it('should return false (Email not verified)', () => {
      requester.emailVerified = false;
      expect(auth.requesterIsVerified(requester)).toBe(false);
    });
    it('should return false (Undefined requester)', () => {
      // @ts-ignore
      requester = undefined;
      expect(auth.requesterIsVerified(requester)).toBe(false);
    });
  });

  describe('requesterIsAuthor', () => {
    it('should return true (Username matches)', () => {
      expect(
        auth.requesterIsAuthor({
          authorUsername: requester.username,
          requester,
        }),
      ).toBe(true);
    });
    it('should return false (Username does not match)', () => {
      expect(
        auth.requesterIsAuthor({
          authorUsername: 'not requester',
          requester,
        }),
      ).toBe(false);
    });
    it('should return false (requester undefined)', () => {
      // @ts-ignore
      requester = undefined;
      expect(
        auth.requesterIsAuthor({
          authorUsername: 'not requester',
          requester,
        }),
      ).toBe(false);
    });
  });

  describe('requesterIsPrivileged', () => {
    it('should return true (Only admin accessGroup)', () => {
      requester.accessGroups = ['admin'];
      expect(auth.requesterIsPrivileged(requester)).toBe(true);
    });
    it('should return true (Only editor accessGroup)', () => {
      requester.accessGroups = ['editor'];
      expect(auth.requesterIsPrivileged(requester)).toBe(true);
    });
    it('should return true (Only curator@collection accessGroup)', () => {
      requester.accessGroups = ['curator@collection'];
      expect(auth.requesterIsPrivileged(requester)).toBe(true);
    });
    it('should return true (Only reviewer@collection accessGroup)', () => {
      requester.accessGroups = ['reviewer@collection'];
      expect(auth.requesterIsPrivileged(requester)).toBe(true);
    });
    it('should return true (All accessGroups)', () => {
      requester.accessGroups = [
        'admin',
        'editor',
        'curator@collection',
        'reviewer@collection',
      ];
      expect(auth.requesterIsPrivileged(requester)).toBe(true);
    });
    it('should return false (No accessGroups)', () => {
      requester.accessGroups = [];
      expect(auth.requesterIsPrivileged(requester)).toBe(false);
    });
    it('should return false (undefined requester)', () => {
      // @ts-ignore
      requester = undefined;
      expect(auth.requesterIsPrivileged(requester)).toBe(false);
    });
    it('should return false (undefined accessGroups)', () => {
      // @ts-ignore
      requester.accessGroups = undefined;
      expect(auth.requesterIsPrivileged(requester)).toBe(false);
    });
  });

  describe('requesterIsAdmin', () => {
    it('should return true (Only admin accessGroup)', () => {
      requester.accessGroups = ['admin'];
      expect(auth.requesterIsAdmin(requester)).toBe(true);
    });
    it('should return true (All accessGroups)', () => {
      requester.accessGroups = [
        'admin',
        'editor',
        'curator@collection',
        'reviewer@collection',
      ];
      expect(auth.requesterIsAdmin(requester)).toBe(true);
    });
    it('should return false (No accessGroups)', () => {
      requester.accessGroups = [];
      expect(auth.requesterIsAdmin(requester)).toBe(false);
    });
    it('should return false (Only editor accessGroup)', () => {
      requester.accessGroups = ['editor'];
      expect(auth.requesterIsAdmin(requester)).toBe(false);
    });
    it('should return false (Only curator@collection accessGroup)', () => {
      requester.accessGroups = ['curator@collection'];
      expect(auth.requesterIsAdmin(requester)).toBe(false);
    });
    it('should return false (Only reviewer@collection accessGroup)', () => {
      requester.accessGroups = ['reviewer@collection'];
      expect(auth.requesterIsAdmin(requester)).toBe(false);
    });
    it('should return false (All accessGroups except admin)', () => {
      requester.accessGroups = [
        'editor',
        'curator@collection',
        'reviewer@collection',
      ];
      expect(auth.requesterIsAdmin(requester)).toBe(false);
    });
    it('should return false (undefined requester)', () => {
      // @ts-ignore
      requester = undefined;
      expect(auth.requesterIsAdmin(requester)).toBe(false);
    });
    it('should return false (undefined accessGroups)', () => {
      // @ts-ignore
      requester.accessGroups = undefined;
      expect(auth.requesterIsAdmin(requester)).toBe(false);
    });
  });

  describe('requesterIsAdminOrEditor', () => {
    it('should return true (Only admin accessGroup)', () => {
      requester.accessGroups = ['admin'];
      expect(auth.requesterIsAdminOrEditor(requester)).toBe(true);
    });
    it('should return true (Only editor accessGroup)', () => {
      requester.accessGroups = ['editor'];
      expect(auth.requesterIsAdminOrEditor(requester)).toBe(true);
    });
    it('should return true (All accessGroups)', () => {
      requester.accessGroups = [
        'admin',
        'editor',
        'curator@collection',
        'reviewer@collection',
      ];
      expect(auth.requesterIsAdminOrEditor(requester)).toBe(true);
    });
    it('should return false (No accessGroups)', () => {
      requester.accessGroups = [];
      expect(auth.requesterIsAdminOrEditor(requester)).toBe(false);
    });
    it('should return false (Only curator@collection accessGroup)', () => {
      requester.accessGroups = ['curator@collection'];
      expect(auth.requesterIsAdminOrEditor(requester)).toBe(false);
    });
    it('should return false (Only reviewer@collection accessGroup)', () => {
      requester.accessGroups = ['reviewer@collection'];
      expect(auth.requesterIsAdminOrEditor(requester)).toBe(false);
    });
    it('should return false (All accessGroups except admin and editor)', () => {
      requester.accessGroups = ['curator@collection', 'reviewer@collection'];
      expect(auth.requesterIsAdminOrEditor(requester)).toBe(false);
    });
    it('should return false (undefined requester)', () => {
      // @ts-ignore
      requester = undefined;
      expect(auth.requesterIsAdminOrEditor(requester)).toBe(false);
    });
    it('should return false (undefined accessGroups)', () => {
      // @ts-ignore
      requester.accessGroups = undefined;
      expect(auth.requesterIsAdminOrEditor(requester)).toBe(false);
    });
  });

  describe('hasReadAccessByCollection', () => {
    it('should return true (Only admin accessGroup)', () => {
      requester.accessGroups = ['admin'];
      expect(
        auth.hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(true);
    });
    it('should return true (Only editor accessGroup)', () => {
      requester.accessGroups = ['editor'];
      expect(
        auth.hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(true);
    });
    it('should return true (Only curator@collection accessGroup)', () => {
      requester.accessGroups = ['curator@collection'];
      expect(
        auth.hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(true);
    });
    it('should return true (Only reviewer@collection accessGroup)', () => {
      requester.accessGroups = ['reviewer@collection'];
      expect(
        auth.hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(true);
    });
    it('should return true (All accessGroups)', () => {
      requester.accessGroups = [
        'admin',
        'editor',
        'curator@collection',
        'reviewer@collection',
      ];
      expect(
        auth.hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(true);
    });
    it('should return false (No accessGroups)', () => {
      requester.accessGroups = [];
      expect(
        auth.hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(false);
    });
    it('should return false (Not admin, editor, or accessGroups @collection )', () => {
      requester.accessGroups = ['curator@someOtherCollection'];
      expect(
        auth.hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(false);
    });
    it('should return false (undefined requester)', () => {
      // @ts-ignore
      requester = undefined;
      expect(
        auth.hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(false);
    });
    it('should return false (undefined accessGroups)', () => {
      // @ts-ignore
      requester.accessGroups = undefined;
      expect(
        auth.hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(false);
    });
  });
  describe('authorizeRequest', () => {
    it('should return void', () => {
      expect(auth.authorizeRequest([true])).toBeUndefined();
    });
    it('should throw ResourceError (Only false)', () => {
      try {
        auth.authorizeRequest([false]);
      } catch (e) {
        expect(e).toBeInstanceOf(ResourceError);
      }
    });
    it('should throw ResourceError (true and false)', () => {
      try {
        auth.authorizeRequest([true, false]);
      } catch (e) {
        expect(e).toBeInstanceOf(ResourceError);
      }
    });
  });
});
