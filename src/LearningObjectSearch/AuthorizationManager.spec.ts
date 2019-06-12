import * as auth from './AuthorizationManager';
import { Requester } from './typings';

describe('LearningObjectDownload: AuthorizationManager', () => {
  let requester: Requester;

  beforeEach(() => {
    requester = {
      name: 'Test User',
      username: 'testuser',
      email: 'someemail@e.com',
      organization: '',
      emailVerified: true,
      accessGroups: [],
    };
  });

  describe('requesterIsPrivileged', () => {
    it('should return true when accessGroups contain only the admin privilege', () => {
      requester.accessGroups = ['admin'];
      expect(auth.requesterIsPrivileged(requester)).toBe(true);
    });
    it('should return true when accessGroups contain only the editor privilege', () => {
      requester.accessGroups = ['editor'];
      expect(auth.requesterIsPrivileged(requester)).toBe(true);
    });
    it('should return true when accessGroups contain only the curator@collection privilege', () => {
      requester.accessGroups = ['curator@collection'];
      expect(auth.requesterIsPrivileged(requester)).toBe(true);
    });
    it('should return true when accessGroups contain only the reviewer@collection privilege', () => {
      requester.accessGroups = ['reviewer@collection'];
      expect(auth.requesterIsPrivileged(requester)).toBe(true);
    });
    it('should return true when accessGroups contain all privileges', () => {
      requester.accessGroups = [
        'admin',
        'editor',
        'curator@collection',
        'reviewer@collection',
      ];
      expect(auth.requesterIsPrivileged(requester)).toBe(true);
    });
    it('should return false when accessGroups contain no privileges', () => {
      requester.accessGroups = [];
      expect(auth.requesterIsPrivileged(requester)).toBe(false);
    });
    it('should return false when requester data is undefined', () => {
      // @ts-ignore
      requester = undefined;
      expect(auth.requesterIsPrivileged(requester)).toBe(false);
    });
    it('should return false when accessGroups are undefined', () => {
      // @ts-ignore
      requester.accessGroups = undefined;
      expect(auth.requesterIsPrivileged(requester)).toBe(false);
    });
  });

  describe('requesterIsAdmin', () => {
    it('should return true when accessGroups contain only the admin privilege', () => {
      requester.accessGroups = ['admin'];
      expect(auth.requesterIsAdmin(requester)).toBe(true);
    });
    it('should return true when accessGroups contain all privileges', () => {
      requester.accessGroups = [
        'admin',
        'editor',
        'curator@collection',
        'reviewer@collection',
      ];
      expect(auth.requesterIsAdmin(requester)).toBe(true);
    });
    it('should return false when accessGroups contain no privileges', () => {
      requester.accessGroups = [];
      expect(auth.requesterIsAdmin(requester)).toBe(false);
    });
    it('should return false when accessGroups contain only the editor privilege', () => {
      requester.accessGroups = ['editor'];
      expect(auth.requesterIsAdmin(requester)).toBe(false);
    });
    it('should return false when accessGroups contain only the curator@colllection privilege', () => {
      requester.accessGroups = ['curator@collection'];
      expect(auth.requesterIsAdmin(requester)).toBe(false);
    });
    it('should return false when accessGroups contain only the reviewer@colllection privilege', () => {
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
    it('should return false when requester is undefined', () => {
      // @ts-ignore
      requester = undefined;
      expect(auth.requesterIsAdmin(requester)).toBe(false);
    });
    it('should return false when accessGroups is undefined', () => {
      // @ts-ignore
      requester.accessGroups = undefined;
      expect(auth.requesterIsAdmin(requester)).toBe(false);
    });
  });

  describe('requesterIsAdminOrEditor', () => {
    it('should return true when accessGroups contain only the admin privilege', () => {
      requester.accessGroups = ['admin'];
      expect(auth.requesterIsAdminOrEditor(requester)).toBe(true);
    });
    it('should return true when accessGroups contain only the editor privilege', () => {
      requester.accessGroups = ['editor'];
      expect(auth.requesterIsAdminOrEditor(requester)).toBe(true);
    });
    it('should return true when accessGroups contain all privileges', () => {
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
    it('should return false when accessGroups contain only the curator@colllection privilege', () => {
      requester.accessGroups = ['curator@collection'];
      expect(auth.requesterIsAdminOrEditor(requester)).toBe(false);
    });
    it('should return false when accessGroups contain only the reviewer@colllection privilege', () => {
      requester.accessGroups = ['reviewer@collection'];
      expect(auth.requesterIsAdminOrEditor(requester)).toBe(false);
    });
    it('should return false (All accessGroups except admin and editor)', () => {
      requester.accessGroups = ['curator@collection', 'reviewer@collection'];
      expect(auth.requesterIsAdminOrEditor(requester)).toBe(false);
    });
    it('should return false when requester is undefined', () => {
      // @ts-ignore
      requester = undefined;
      expect(auth.requesterIsAdminOrEditor(requester)).toBe(false);
    });
    it('should return false when accessGroups is undefined', () => {
      // @ts-ignore
      requester.accessGroups = undefined;
      expect(auth.requesterIsAdminOrEditor(requester)).toBe(false);
    });
  });

  describe('hasReadAccessByCollection', () => {
    it('should return true when accessGroups contain only the admin privilege', () => {
      requester.accessGroups = ['admin'];
      expect(
        auth.hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(true);
    });
    it('should return true when accessGroups contain only the editor privilege', () => {
      requester.accessGroups = ['editor'];
      expect(
        auth.hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(true);
    });
    it('should return true when accessGroups contain only the curator@colllection privilege', () => {
      requester.accessGroups = ['curator@collection'];
      expect(
        auth.hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(true);
    });
    it('should return true when accessGroups contain only the reviewer@colllection privilege', () => {
      requester.accessGroups = ['reviewer@collection'];
      expect(
        auth.hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(true);
    });
    it('should return true when accessGroups contain all privileges', () => {
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
    it('should return false when requester is undefined', () => {
      // @ts-ignore
      requester = undefined;
      expect(
        auth.hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(false);
    });
    it('should return false when accessGroups is undefined', () => {
      // @ts-ignore
      requester.accessGroups = undefined;
      expect(
        auth.hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(false);
    });
  });
});
