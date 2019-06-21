import * as auth from './AuthorizationManager';
import { ResourceError } from '../shared/errors';
import {
  Requester,
  LearningObjectSummary,
  LearningObjectStatus,
} from './typings';
import { AccessGroup } from '../shared/types';

describe('FileMetadata: AuthorizationManager', () => {
  let requester: Requester = {
    name: '',
    username: 'authorUsername',
    accessGroups: [],
    emailVerified: true,
    email: '',
    organization: '',
  };

  describe('requesterIsAuthor', () => {
    it('should return true when the username of the requester matches', () => {
      expect(
        auth.requesterIsAuthor({
          authorUsername: requester.username,
          requester,
        }),
      ).toBe(true);
    });
    it('should return false when the username of the requester does not match', () => {
      expect(
        auth.requesterIsAuthor({
          authorUsername: 'not requester',
          requester,
        }),
      ).toBe(false);
    });
    it('should return false when the requester is undefined', () => {
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

  describe('requesterIsAdmin', () => {
    it('should return true when accessGroups contain only the admin privilege', () => {
      requester.accessGroups = ['admin'];
      expect(auth.requesterIsAdmin(requester)).toBe(true);
    });
    it('should return true (when accessGroups contain all privileges', () => {
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
    it('should return false when accessGroups contain the editor privilege', () => {
      requester.accessGroups = ['editor'];
      expect(auth.requesterIsAdmin(requester)).toBe(false);
    });
    it('should return false when accessGroups contain the curator@collection privilege', () => {
      requester.accessGroups = ['curator@collection'];
      expect(auth.requesterIsAdmin(requester)).toBe(false);
    });
    it('should return false when accessGroups contain the reviewer@collection privilege', () => {
      requester.accessGroups = ['reviewer@collection'];
      expect(auth.requesterIsAdmin(requester)).toBe(false);
    });
    it('should return false when accessGroups contain all privileges except admin', () => {
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
    it('should return true when accessGroups contain the editor privilege', () => {
      requester.accessGroups = ['editor'];
      expect(auth.requesterIsAdminOrEditor(requester)).toBe(true);
    });
    it('should return true (when accessGroups contain all privileges', () => {
      requester.accessGroups = [
        'admin',
        'editor',
        'curator@collection',
        'reviewer@collection',
      ];
      expect(auth.requesterIsAdminOrEditor(requester)).toBe(true);
    });
    it('should return false when accessGroups contain no privileges', () => {
      requester.accessGroups = [];
      expect(auth.requesterIsAdminOrEditor(requester)).toBe(false);
    });
    it('should return false when accessGroups contain the curator@collection privilege', () => {
      requester.accessGroups = ['curator@collection'];
      expect(auth.requesterIsAdminOrEditor(requester)).toBe(false);
    });
    it('should return false when accessGroups contain the reviewer@collection privilege', () => {
      requester.accessGroups = ['reviewer@collection'];
      expect(auth.requesterIsAdminOrEditor(requester)).toBe(false);
    });
    it('should return false when accessGroups contain all privileges except admin and editor', () => {
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
    it('should return true when accessGroups contain the editor privilege', () => {
      requester.accessGroups = ['editor'];
      expect(
        auth.hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(true);
    });
    it('should return true when accessGroups contain the curator@collection privilege', () => {
      requester.accessGroups = ['curator@collection'];
      expect(
        auth.hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(true);
    });
    it('should return true when accessGroups contain the reviewer@collection privilege', () => {
      requester.accessGroups = ['reviewer@collection'];
      expect(
        auth.hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(true);
    });
    it('should return true (when accessGroups contain all privileges', () => {
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
    it('should return false when accessGroups contain no privileges', () => {
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
  describe('authorizeRequest', () => {
    it('should return void', () => {
      expect(auth.authorizeRequest([true])).toBeUndefined();
    });
    it('should throw ResourceError when false is the only value in the array', () => {
      try {
        auth.authorizeRequest([false]);
      } catch (e) {
        expect(e).toBeInstanceOf(ResourceError);
      }
    });
    it('should throw ResourceError when true and false exists in the array', () => {
      expect(auth.authorizeRequest([false, true])).toBeUndefined();
    });
  });

  describe('authorizeReadAccess', () => {
    const summary: LearningObjectSummary = {
      id: '1',
      author: {
        id: '1',
        username: 'myUser',
        name: 'My User',
        organization: 'My Org',
      },
      collection: 'special-collection',
      contributors: [],
      date: Date.now().toString(),
      description: '',
      length: 'nanomodule',
      name: 'My LO',
      revision: 0,
      status: LearningObjectStatus.RELEASED,
    };

    describe('when the requester is a visitor', () => {
      requester.accessGroups = [];
      describe(`and the Learning Object is ${
        LearningObjectStatus.RELEASED
      }`,      () => {
        summary.status = LearningObjectStatus.RELEASED;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            }),
          ).toBeUndefined();
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.PROOFING
      }`,      () => {
        summary.status = LearningObjectStatus.PROOFING;
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.REVIEW
      }`,      () => {
        summary.status = LearningObjectStatus.REVIEW;
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.WAITING
      }`,      () => {
        summary.status = LearningObjectStatus.WAITING;
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.UNRELEASED
      }`,      () => {
        summary.status = LearningObjectStatus.UNRELEASED;
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.REJECTED
      }`,      () => {
        summary.status = LearningObjectStatus.UNRELEASED;
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
    });
    describe('when the requester is the author', () => {
      requester.username = summary.author.username;
      describe(`and the Learning Object is ${
        LearningObjectStatus.RELEASED
      }`,      () => {
        summary.status = LearningObjectStatus.RELEASED;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            }),
          ).toBeUndefined();
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.PROOFING
      }`,      () => {
        summary.status = LearningObjectStatus.PROOFING;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            }),
          ).toBeUndefined();
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.REVIEW
      }`,      () => {
        summary.status = LearningObjectStatus.REVIEW;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            }),
          ).toBeUndefined();
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.WAITING
      }`,      () => {
        summary.status = LearningObjectStatus.WAITING;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            }),
          ).toBeUndefined();
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.UNRELEASED
      }`,      () => {
        summary.status = LearningObjectStatus.UNRELEASED;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            }),
          ).toBeUndefined();
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.REJECTED
      }`,      () => {
        summary.status = LearningObjectStatus.REJECTED;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            }),
          ).toBeUndefined();
        });
      });
    });
    describe('when the requester is a curator of the Learning Object\'s collection', () => {
      requester.accessGroups = [`${AccessGroup.CURATOR}@${summary.collection}`];
      describe(`and the Learning Object is ${
        LearningObjectStatus.RELEASED
      }`,      () => {
        summary.status = LearningObjectStatus.RELEASED;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            }),
          ).toBeUndefined();
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.PROOFING
      }`,      () => {
        summary.status = LearningObjectStatus.PROOFING;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            }),
          ).toBeUndefined();
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.REVIEW
      }`,      () => {
        summary.status = LearningObjectStatus.REVIEW;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            }),
          ).toBeUndefined();
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.WAITING
      }`,      () => {
        summary.status = LearningObjectStatus.WAITING;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            }),
          ).toBeUndefined();
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.UNRELEASED
      }`,      () => {
        summary.status = LearningObjectStatus.UNRELEASED;
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.REJECTED
      }`,      () => {
        summary.status = LearningObjectStatus.REJECTED;
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
    });
    describe('when the requester is a reviewer of the Learning Object\'s collection', () => {
      requester.accessGroups = [
        `${AccessGroup.REVIEWER}@${summary.collection}`,
      ];
      describe(`and the Learning Object is ${
        LearningObjectStatus.RELEASED
      }`,      () => {
        summary.status = LearningObjectStatus.RELEASED;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            }),
          ).toBeUndefined();
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.PROOFING
      }`,      () => {
        summary.status = LearningObjectStatus.PROOFING;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            }),
          ).toBeUndefined();
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.REVIEW
      }`,      () => {
        summary.status = LearningObjectStatus.REVIEW;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            }),
          ).toBeUndefined();
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.WAITING
      }`,      () => {
        summary.status = LearningObjectStatus.WAITING;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            }),
          ).toBeUndefined();
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.UNRELEASED
      }`,      () => {
        summary.status = LearningObjectStatus.UNRELEASED;
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.REJECTED
      }`,      () => {
        summary.status = LearningObjectStatus.REJECTED;
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
    });
    describe('when the requester is an editor', () => {
      requester.accessGroups = [AccessGroup.EDITOR];
      describe(`and the Learning Object is ${
        LearningObjectStatus.RELEASED
      }`,      () => {
        summary.status = LearningObjectStatus.RELEASED;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            }),
          ).toBeUndefined();
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.PROOFING
      }`,      () => {
        summary.status = LearningObjectStatus.PROOFING;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            }),
          ).toBeUndefined();
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.REVIEW
      }`,      () => {
        summary.status = LearningObjectStatus.REVIEW;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            }),
          ).toBeUndefined();
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.WAITING
      }`,      () => {
        summary.status = LearningObjectStatus.WAITING;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            }),
          ).toBeUndefined();
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.UNRELEASED
      }`,      () => {
        summary.status = LearningObjectStatus.UNRELEASED;
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.REJECTED
      }`,      () => {
        summary.status = LearningObjectStatus.REJECTED;
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
    });
    describe('when the requester is an admin', () => {
      requester.accessGroups = [AccessGroup.ADMIN];
      describe(`and the Learning Object is ${
        LearningObjectStatus.RELEASED
      }`,      () => {
        summary.status = LearningObjectStatus.RELEASED;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            }),
          ).toBeUndefined();
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.PROOFING
      }`,      () => {
        summary.status = LearningObjectStatus.PROOFING;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            }),
          ).toBeUndefined();
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.REVIEW
      }`,      () => {
        summary.status = LearningObjectStatus.REVIEW;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            }),
          ).toBeUndefined();
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.WAITING
      }`,      () => {
        summary.status = LearningObjectStatus.WAITING;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            }),
          ).toBeUndefined();
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.UNRELEASED
      }`,      () => {
        summary.status = LearningObjectStatus.UNRELEASED;
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
      describe(`and the Learning Object is ${
        LearningObjectStatus.REJECTED
      }`,      () => {
        summary.status = LearningObjectStatus.REJECTED;
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester: requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
    });
  });
});
