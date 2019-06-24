import * as auth from './AuthorizationManager';
import { ResourceError } from '../shared/errors';
import {
  Requester,
  LearningObjectSummary,
  LearningObjectStatus,
} from './typings';
import { AccessGroup } from '../shared/types';

describe('FileMetadata: AuthorizationManager', () => {
  describe('requesterIsAuthor', () => {
    const requester = {
      name: '',
      username: 'authorUsername',
      // @ts-ignore
      accessGroups: [],
      emailVerified: true,
      email: '',
      organization: '',
    };
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
      expect(
        auth.requesterIsAuthor({
          authorUsername: 'not requester',
          requester: undefined,
        }),
      ).toBe(false);
    });
  });

  describe('requesterIsAdmin', () => {
    const requester = {
      name: '',
      username: 'authorUsername',
      // @ts-ignore
      accessGroups: [],
      emailVerified: true,
      email: '',
      organization: '',
    };
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
      expect(auth.requesterIsAdmin(undefined)).toBe(false);
    });
    it('should return false when accessGroups is undefined', () => {
      expect(auth.requesterIsAdmin(undefined)).toBe(false);
    });
  });

  describe('requesterIsAdminOrEditor', () => {
    const requester = {
      name: '',
      username: 'authorUsername',
      // @ts-ignore
      accessGroups: [],
      emailVerified: true,
      email: '',
      organization: '',
    };
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
      expect(auth.requesterIsAdminOrEditor(undefined)).toBe(false);
    });
    it('should return false when accessGroups is undefined', () => {
      expect(auth.requesterIsAdminOrEditor(undefined)).toBe(false);
    });
  });

  describe('hasReadAccessByCollection', () => {
    const requester = {
      name: '',
      username: 'authorUsername',
      // @ts-ignore
      accessGroups: [],
      emailVerified: true,
      email: '',
      organization: '',
    };
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
      expect(
        auth.hasReadAccessByCollection({
          requester: undefined,
          collection: 'collection',
        }),
      ).toBe(false);
    });
    it('should return false when accessGroups is undefined', () => {
      expect(
        auth.hasReadAccessByCollection({
          requester: { ...requester, accessGroups: undefined },
          collection: 'collection',
        }),
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
    const requester = {
      name: '',
      username: 'authorUsername',
      // @ts-ignore
      accessGroups: [],
      emailVerified: true,
      email: '',
      organization: '',
    };

    describe('when the Learning Object is released', () => {
      summary.status = LearningObjectStatus.RELEASED;
      describe('and the requester is a visitor', () => {
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
      describe('and the requester is the author', () => {
        requester.username = summary.author.username;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
      describe('and the requester is a curator within the Learning Object collection', () => {
        requester.accessGroups = [
          `${AccessGroup.CURATOR}@${summary.collection}`,
        ];
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
      describe('and the requester is a reviewer within the Learning Object collection', () => {
        requester.accessGroups = [
          `${AccessGroup.REVIEWER}@${summary.collection}`,
        ];
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
      describe('and the requester is an editor', () => {
        requester.accessGroups = [AccessGroup.EDITOR];
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
      describe('and the requester is an admin', () => {
        requester.accessGroups = [AccessGroup.ADMIN];
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
    });

    describe('when the Learning Object is in proofing', () => {
      summary.status = LearningObjectStatus.PROOFING;
      describe('and the requester is a visitor', () => {
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
      describe('and the requester is the author', () => {
        requester.username = summary.author.username;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
      describe('and the requester is a curator within the Learning Object collection', () => {
        requester.accessGroups = [
          `${AccessGroup.CURATOR}@${summary.collection}`,
        ];
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
      describe('and the requester is a reviewer within the Learning Object collection', () => {
        requester.accessGroups = [
          `${AccessGroup.REVIEWER}@${summary.collection}`,
        ];
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
      describe('and the requester is an editor', () => {
        requester.accessGroups = [AccessGroup.EDITOR];
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
      describe('and the requester is an admin', () => {
        requester.accessGroups = [AccessGroup.ADMIN];
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
    });

    describe('when the Learning Object is in review', () => {
      summary.status = LearningObjectStatus.REVIEW;
      describe('and the requester is a visitor', () => {
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
      describe('and the requester is the author', () => {
        requester.username = summary.author.username;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
      describe('and the requester is a curator within the Learning Object collection', () => {
        requester.accessGroups = [
          `${AccessGroup.CURATOR}@${summary.collection}`,
        ];
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
      describe('and the requester is a reviewer within the Learning Object collection', () => {
        requester.accessGroups = [
          `${AccessGroup.REVIEWER}@${summary.collection}`,
        ];
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
      describe('and the requester is an editor', () => {
        requester.accessGroups = [AccessGroup.EDITOR];
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
      describe('and the requester is an admin', () => {
        requester.accessGroups = [AccessGroup.ADMIN];
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
    });

    describe('when the Learning Object is waiting', () => {
      summary.status = LearningObjectStatus.WAITING;
      describe('and the requester is a visitor', () => {
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
      describe('and the requester is the author', () => {
        requester.username = summary.author.username;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
      describe('and the requester is a curator within the Learning Object collection', () => {
        requester.accessGroups = [
          `${AccessGroup.CURATOR}@${summary.collection}`,
        ];
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
      describe('and the requester is a reviewer within the Learning Object collection', () => {
        requester.accessGroups = [
          `${AccessGroup.REVIEWER}@${summary.collection}`,
        ];
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
      describe('and the requester is an editor', () => {
        requester.accessGroups = [AccessGroup.EDITOR];
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
      describe('and the requester is an admin', () => {
        requester.accessGroups = [AccessGroup.ADMIN];
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
    });

    describe('when the Learning Object is unreleased', () => {
      summary.status = LearningObjectStatus.UNRELEASED;
      describe('and the requester is a visitor', () => {
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
      describe('and the requester is the author', () => {
        requester.username = summary.author.username;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
      describe('and the requester is a curator within the Learning Object collection', () => {
        requester.accessGroups = [
          `${AccessGroup.CURATOR}@${summary.collection}`,
        ];
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
      describe('and the requester is a reviewer within the Learning Object collection', () => {
        requester.accessGroups = [
          `${AccessGroup.REVIEWER}@${summary.collection}`,
        ];
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
      describe('and the requester is an editor', () => {
        requester.accessGroups = [AccessGroup.EDITOR];
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
      describe('and the requester is an admin', () => {
        requester.accessGroups = [AccessGroup.ADMIN];
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
    });

    describe('when the Learning Object is rejected', () => {
      summary.status = LearningObjectStatus.REJECTED;
      describe('and the requester is a visitor', () => {
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
      describe('and the requester is the author', () => {
        requester.username = summary.author.username;
        it('should allow read access and not throw an error', () => {
          expect(
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
      describe('and the requester is a curator within the Learning Object collection', () => {
        requester.accessGroups = [
          `${AccessGroup.CURATOR}@${summary.collection}`,
        ];
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
      describe('and the requester is a reviewer within the Learning Object collection', () => {
        requester.accessGroups = [
          `${AccessGroup.REVIEWER}@${summary.collection}`,
        ];
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
      describe('and the requester is an editor', () => {
        requester.accessGroups = [AccessGroup.EDITOR];
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
      describe('and the requester is an admin', () => {
        requester.accessGroups = [AccessGroup.ADMIN];
        it('should not allow read access and throw an error', () => {
          try {
            auth.authorizeReadAccess({
              learningObject: summary,
              requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
    });
  });
});
