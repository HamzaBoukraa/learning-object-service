import { UserToken, AccessGroup, LearningObjectSummary } from './types';
import {
  hasLearningObjectWriteAccess,
  requesterIsAuthor,
  requesterIsAdmin,
  requesterIsAdminOrEditor,
  hasReadAccessByCollection,
  authorizeRequest,
  authorizeReadAccess,
  authorizeWriteAccess,
  requesterIsPrivileged,
  requesterIsVerified,
} from './AuthorizationManager';
import { ResourceError } from './errors';
import { LearningObject } from './entity';

jest.mock('../drivers/MongoDriver');

describe('AuthorizationManager', () => {
  describe('#hasLearningObjectWriteAccess', () => {
    let user: UserToken = {
      username: '',
      name: '',
      email: '',
      organization: '',
      emailVerified: true,
      accessGroups: [],
    };
    it('should return true for a user with an accessGroup of admin', () => {
      user.accessGroups.push('admin');
      hasLearningObjectWriteAccess(user, null, 'someid');
    });
    it('should return true for a user with an accessGroup of editor', () => {
      user.accessGroups.push('editor');
      hasLearningObjectWriteAccess(user, null, 'someid');
    });
    it('should return true for a user with an accessGroup of lead at a collection', () => {
      const collection = 'collectionName';
      user.accessGroups.push(`lead@${collection}`);
      hasLearningObjectWriteAccess(user, null, 'someid');
    });
    it('should return true for a user with an accessGroup of curator at a collection', () => {
      const collection = 'collectionName';
      user.accessGroups.push(`curator@${collection}`);
      hasLearningObjectWriteAccess(user, null, 'someid');
    });
  });

  describe('requesterIsVerified', () => {
    const requester = {
      name: '',
      username: 'authorUsername',
      // @ts-ignore
      accessGroups: [],
      emailVerified: true,
      email: '',
      organization: '',
    };
    it('should return true when the requester\'s email is verified', () => {
      requester.emailVerified = true;
      expect(requesterIsVerified(requester)).toBe(true);
    });
    it('should return false when the requester\'s email is not verified', () => {
      requester.emailVerified = false;
      expect(requesterIsVerified(requester)).toBe(false);
    });
    it('should return false (when the requester is undefined', () => {
      expect(requesterIsVerified(undefined)).toBe(false);
    });
  });

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
        requesterIsAuthor({
          authorUsername: requester.username,
          requester,
        }),
      ).toBe(true);
    });
    it('should return false when the username of the requester does not match', () => {
      expect(
        requesterIsAuthor({
          authorUsername: 'not requester',
          requester,
        }),
      ).toBe(false);
    });
    it('should return false when the requester is undefined', () => {
      expect(
        requesterIsAuthor({
          authorUsername: 'not requester',
          requester: undefined,
        }),
      ).toBe(false);
    });
  });

  describe('requesterIsPrivileged', () => {
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
      expect(requesterIsPrivileged(requester)).toBe(true);
    });
    it('should return true when accessGroups contain only the editor privilege', () => {
      requester.accessGroups = ['editor'];
      expect(requesterIsPrivileged(requester)).toBe(true);
    });
    it('should return true when accessGroups contain only the curator@collection privilege', () => {
      requester.accessGroups = ['curator@collection'];
      expect(requesterIsPrivileged(requester)).toBe(true);
    });
    it('should return true when accessGroups contain only the reviewer@collection privilege', () => {
      requester.accessGroups = ['reviewer@collection'];
      expect(requesterIsPrivileged(requester)).toBe(true);
    });
    it('should return true when accessGroups contain all privileges', () => {
      requester.accessGroups = [
        'admin',
        'editor',
        'curator@collection',
        'reviewer@collection',
      ];
      expect(requesterIsPrivileged(requester)).toBe(true);
    });
    it('should return false when accessGroups contain no privileges', () => {
      requester.accessGroups = [];
      expect(requesterIsPrivileged(requester)).toBe(false);
    });
    it('should return false when requester data is undefined', () => {
      expect(requesterIsPrivileged(undefined)).toBe(false);
    });
    it('should return false when accessGroups are undefined', () => {
      expect(
        requesterIsPrivileged({ ...requester, accessGroups: undefined }),
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
      expect(requesterIsAdmin(requester)).toBe(true);
    });
    it('should return true (when accessGroups contain all privileges', () => {
      requester.accessGroups = [
        'admin',
        'editor',
        'curator@collection',
        'reviewer@collection',
      ];
      expect(requesterIsAdmin(requester)).toBe(true);
    });
    it('should return false when accessGroups contain no privileges', () => {
      requester.accessGroups = [];
      expect(requesterIsAdmin(requester)).toBe(false);
    });
    it('should return false when accessGroups contain the editor privilege', () => {
      requester.accessGroups = ['editor'];
      expect(requesterIsAdmin(requester)).toBe(false);
    });
    it('should return false when accessGroups contain the curator@collection privilege', () => {
      requester.accessGroups = ['curator@collection'];
      expect(requesterIsAdmin(requester)).toBe(false);
    });
    it('should return false when accessGroups contain the reviewer@collection privilege', () => {
      requester.accessGroups = ['reviewer@collection'];
      expect(requesterIsAdmin(requester)).toBe(false);
    });
    it('should return false when accessGroups contain all privileges except admin', () => {
      requester.accessGroups = [
        'editor',
        'curator@collection',
        'reviewer@collection',
      ];
      expect(requesterIsAdmin(requester)).toBe(false);
    });
    it('should return false when requester is undefined', () => {
      expect(requesterIsAdmin(undefined)).toBe(false);
    });
    it('should return false when accessGroups is undefined', () => {
      expect(requesterIsAdmin(undefined)).toBe(false);
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
      expect(requesterIsAdminOrEditor(requester)).toBe(true);
    });
    it('should return true when accessGroups contain the editor privilege', () => {
      requester.accessGroups = ['editor'];
      expect(requesterIsAdminOrEditor(requester)).toBe(true);
    });
    it('should return true (when accessGroups contain all privileges', () => {
      requester.accessGroups = [
        'admin',
        'editor',
        'curator@collection',
        'reviewer@collection',
      ];
      expect(requesterIsAdminOrEditor(requester)).toBe(true);
    });
    it('should return false when accessGroups contain no privileges', () => {
      requester.accessGroups = [];
      expect(requesterIsAdminOrEditor(requester)).toBe(false);
    });
    it('should return false when accessGroups contain the curator@collection privilege', () => {
      requester.accessGroups = ['curator@collection'];
      expect(requesterIsAdminOrEditor(requester)).toBe(false);
    });
    it('should return false when accessGroups contain the reviewer@collection privilege', () => {
      requester.accessGroups = ['reviewer@collection'];
      expect(requesterIsAdminOrEditor(requester)).toBe(false);
    });
    it('should return false when accessGroups contain all privileges except admin and editor', () => {
      requester.accessGroups = ['curator@collection', 'reviewer@collection'];
      expect(requesterIsAdminOrEditor(requester)).toBe(false);
    });
    it('should return false when requester is undefined', () => {
      expect(requesterIsAdminOrEditor(undefined)).toBe(false);
    });
    it('should return false when accessGroups is undefined', () => {
      expect(requesterIsAdminOrEditor(undefined)).toBe(false);
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
        hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(true);
    });
    it('should return true when accessGroups contain the editor privilege', () => {
      requester.accessGroups = ['editor'];
      expect(
        hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(true);
    });
    it('should return true when accessGroups contain the curator@collection privilege', () => {
      requester.accessGroups = ['curator@collection'];
      expect(
        hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(true);
    });
    it('should return true when accessGroups contain the reviewer@collection privilege', () => {
      requester.accessGroups = ['reviewer@collection'];
      expect(
        hasReadAccessByCollection({ requester, collection: 'collection' }),
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
        hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(true);
    });
    it('should return false when accessGroups contain no privileges', () => {
      requester.accessGroups = [];
      expect(
        hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(false);
    });
    it('should return false (Not admin, editor, or accessGroups @collection )', () => {
      requester.accessGroups = ['curator@someOtherCollection'];
      expect(
        hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(false);
    });
    it('should return false when requester is undefined', () => {
      expect(
        hasReadAccessByCollection({
          requester: undefined,
          collection: 'collection',
        }),
      ).toBe(false);
    });
    it('should return false when accessGroups is undefined', () => {
      expect(
        hasReadAccessByCollection({
          requester: { ...requester, accessGroups: undefined },
          collection: 'collection',
        }),
      ).toBe(false);
    });
  });
  describe('authorizeRequest', () => {
    it('should return void', () => {
      expect(authorizeRequest([true])).toBeUndefined();
    });
    it('should throw ResourceError when false is the only value in the array', () => {
      try {
        authorizeRequest([false]);
      } catch (e) {
        expect(e).toBeInstanceOf(ResourceError);
      }
    });
    it('should throw ResourceError when true and false exists in the array', () => {
      expect(authorizeRequest([false, true])).toBeUndefined();
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
      children: [],
      contributors: [],
      date: Date.now().toString(),
      description: '',
      length: 'nanomodule',
      name: 'My LO',
      revision: 0,
      status: LearningObject.Status.RELEASED,
      rev
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
      summary.status = LearningObject.Status.RELEASED;
      describe('and the requester is a visitor', () => {
        it('should allow read access and not throw an error', () => {
          expect(
            authorizeReadAccess({
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
            authorizeReadAccess({
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
            authorizeReadAccess({
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
            authorizeReadAccess({
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
            authorizeReadAccess({
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
            authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
    });

    describe('when the Learning Object is in proofing', () => {
      summary.status = LearningObject.Status.PROOFING;
      describe('and the requester is a visitor', () => {
        it('should not allow read access and throw an error', () => {
          try {
            authorizeReadAccess({
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
            authorizeReadAccess({
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
            authorizeReadAccess({
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
            authorizeReadAccess({
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
            authorizeReadAccess({
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
            authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
    });

    describe('when the Learning Object is in review', () => {
      summary.status = LearningObject.Status.REVIEW;
      describe('and the requester is a visitor', () => {
        it('should not allow read access and throw an error', () => {
          try {
            authorizeReadAccess({
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
            authorizeReadAccess({
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
            authorizeReadAccess({
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
            authorizeReadAccess({
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
            authorizeReadAccess({
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
            authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
    });

    describe('when the Learning Object is waiting', () => {
      summary.status = LearningObject.Status.WAITING;
      describe('and the requester is a visitor', () => {
        it('should not allow read access and throw an error', () => {
          try {
            authorizeReadAccess({
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
            authorizeReadAccess({
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
            authorizeReadAccess({
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
            authorizeReadAccess({
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
            authorizeReadAccess({
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
            authorizeReadAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
    });

    describe('when the Learning Object is unreleased', () => {
      summary.status = LearningObject.Status.UNRELEASED;
      describe('and the requester is a visitor', () => {
        it('should not allow read access and throw an error', () => {
          try {
            authorizeReadAccess({
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
            authorizeReadAccess({
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
            authorizeReadAccess({
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
            authorizeReadAccess({
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
            authorizeReadAccess({
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
            authorizeReadAccess({
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
      summary.status = LearningObject.Status.REJECTED;
      describe('and the requester is a visitor', () => {
        it('should not allow read access and throw an error', () => {
          try {
            authorizeReadAccess({
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
            authorizeReadAccess({
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
            authorizeReadAccess({
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
            authorizeReadAccess({
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
            authorizeReadAccess({
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
            authorizeReadAccess({
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

  describe('authorizeWriteAccess', () => {
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
      children: [],
      date: Date.now().toString(),
      description: '',
      length: 'nanomodule',
      name: 'My LO',
      revision: 0,
      status: LearningObject.Status.RELEASED,
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
      summary.status = LearningObject.Status.RELEASED;
      describe('and the requester is a visitor', () => {
        it('should not allow write access and throw an error', () => {
          try {
            authorizeWriteAccess({
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
        it('should not allow write access and throw an error', () => {
          try {
            authorizeWriteAccess({
              learningObject: summary,
              requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
      describe('and the requester is a curator within the Learning Object collection', () => {
        requester.accessGroups = [
          `${AccessGroup.CURATOR}@${summary.collection}`,
        ];
        it('should not allow write access and throw an error', () => {
          try {
            authorizeWriteAccess({
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
        it('should not allow write access and throw an error', () => {
          try {
            authorizeWriteAccess({
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
        it('should not allow write access and throw an error', () => {
          try {
            authorizeWriteAccess({
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
        it('should not allow write access and throw an error', () => {
          try {
            authorizeWriteAccess({
              learningObject: summary,
              requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
    });

    describe('when the Learning Object is in proofing', () => {
      summary.status = LearningObject.Status.PROOFING;
      describe('and the requester is a visitor', () => {
        it('should not allow write access and throw an error', () => {
          try {
            authorizeWriteAccess({
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
        it('should not allow write access and throw an error', () => {
          try {
            authorizeWriteAccess({
              learningObject: summary,
              requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
      describe('and the requester is a curator within the Learning Object collection', () => {
        requester.accessGroups = [
          `${AccessGroup.CURATOR}@${summary.collection}`,
        ];
        it('should not allow write access and throw an error', () => {
          try {
            authorizeWriteAccess({
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
        it('should not allow write access and throw an error', () => {
          try {
            authorizeWriteAccess({
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
        it('should allow write access and not throw an error', () => {
          expect(
            authorizeWriteAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
      describe('and the requester is an admin', () => {
        requester.accessGroups = [AccessGroup.ADMIN];
        it('should allow write access and not throw an error', () => {
          expect(
            authorizeWriteAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
    });
    describe('when the Learning Object is in review', () => {
      summary.status = LearningObject.Status.REVIEW;
      describe('and the requester is a visitor', () => {
        it('should not allow write access and throw an error', () => {
          try {
            authorizeWriteAccess({
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
        it('should not allow write access and throw an error', () => {
          try {
            authorizeWriteAccess({
              learningObject: summary,
              requester,
            });
          } catch (e) {
            expect(e).toBeInstanceOf(ResourceError);
          }
        });
      });
      describe('and the requester is a curator within the Learning Object collection', () => {
        requester.accessGroups = [
          `${AccessGroup.CURATOR}@${summary.collection}`,
        ];
        it('should not allow write access and throw an error', () => {
          try {
            authorizeWriteAccess({
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
        it('should not allow write access and throw an error', () => {
          try {
            authorizeWriteAccess({
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
        it('should allow write access and not throw an error', () => {
          expect(
            authorizeWriteAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
      describe('and the requester is an admin', () => {
        requester.accessGroups = [AccessGroup.ADMIN];
        it('should allow write access and not throw an error', () => {
          expect(
            authorizeWriteAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
    });

    describe('when the Learning Object is in waiting', () => {
      summary.status = LearningObject.Status.WAITING;
      describe('and the requester is a visitor', () => {
        it('should not allow write access and throw an error', () => {
          try {
            authorizeWriteAccess({
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
        it('should allow write access and not throw an error', () => {
          expect(
            authorizeWriteAccess({
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
        it('should not allow write access and throw an error', () => {
          try {
            authorizeWriteAccess({
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
        it('should not allow write access and throw an error', () => {
          try {
            authorizeWriteAccess({
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
        it('should allow write access and not throw an error', () => {
          expect(
            authorizeWriteAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
      describe('and the requester is an admin', () => {
        requester.accessGroups = [AccessGroup.ADMIN];
        it('should allow write access and not throw an error', () => {
          expect(
            authorizeWriteAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
    });

    describe('when the Learning Object is unreleased', () => {
      summary.status = LearningObject.Status.UNRELEASED;
      describe('and the requester is a visitor', () => {
        it('should not allow write access and throw an error', () => {
          try {
            authorizeWriteAccess({
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
        it('should allow write access and not throw an error', () => {
          expect(
            authorizeWriteAccess({
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
        it('should not allow write access and throw an error', () => {
          try {
            authorizeWriteAccess({
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
        it('should not allow write access and throw an error', () => {
          try {
            authorizeWriteAccess({
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
        it('should allow write access and not throw an error', () => {
          expect(
            authorizeWriteAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
      describe('and the requester is an admin', () => {
        requester.accessGroups = [AccessGroup.ADMIN];
        it('should allow write access and not throw an error', () => {
          expect(
            authorizeWriteAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
    });

    describe('when the Learning Object is rejected', () => {
      summary.status = LearningObject.Status.REJECTED;
      describe('and the requester is a visitor', () => {
        it('should not allow write access and throw an error', () => {
          try {
            authorizeWriteAccess({
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
        it('should allow write access and not throw an error', () => {
          expect(
            authorizeWriteAccess({
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
        it('should not allow write access and throw an error', () => {
          try {
            authorizeWriteAccess({
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
        it('should not allow write access and throw an error', () => {
          try {
            authorizeWriteAccess({
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
        it('should allow write access and not throw an error', () => {
          expect(
            authorizeWriteAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
      describe('and the requester is an admin', () => {
        requester.accessGroups = [AccessGroup.ADMIN];
        it('should allow write access and not throw an error', () => {
          expect(
            authorizeWriteAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
    });
  });
});
