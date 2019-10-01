import { UserToken, AccessGroup, LearningObjectSummary } from './types';
import { ResourceError } from './errors';
import { LearningObject } from './entity';

let AuthorizationManager: any;

describe('AuthorizationManager', () => {
  beforeAll(async () => {
    jest.mock('../shared/gateways/user-service/UserServiceGateway');
    jest.mock('../drivers/MongoDriver');
    AuthorizationManager = await import('./AuthorizationManager');
  });
  describe('#hasLearningObjectWriteAccess', () => {
    let user: UserToken = {
      username: '',
      name: '',
      email: '',
      organization: '',
      emailVerified: true,
      accessGroups: [],
    };

    it('should return true for a user with an accessGroup of admin', async () => {
      user.accessGroups.push('admin');
      await expect(AuthorizationManager.hasLearningObjectWriteAccess(user, null, 'someid')).resolves.toBeTruthy();
    });
    it('should return true for a user with an accessGroup of editor', async () => {
      user.accessGroups.push('editor');
      await expect(AuthorizationManager.hasLearningObjectWriteAccess(user, null, 'someid')).resolves.toBeTruthy();
    });
    it('should return true for a user with an accessGroup of lead at a collection', async () => {
      const collection = 'collectionName';
      user.accessGroups.push(`lead@${collection}`);
      await expect(AuthorizationManager.hasLearningObjectWriteAccess(user, null, 'someid')).toBeTruthy();
    });
    it('should return true for a user with an accessGroup of curator at a collection', async () => {
      const collection = 'collectionName';
      user.accessGroups.push(`curator@${collection}`);
      await expect(AuthorizationManager.hasLearningObjectWriteAccess(user, null, 'someid')).resolves.toBeTruthy();
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
      expect(AuthorizationManager.requesterIsVerified(requester)).toBe(true);
    });
    it('should return false when the requester\'s email is not verified', () => {
      requester.emailVerified = false;
      expect(AuthorizationManager.requesterIsVerified(requester)).toBe(false);
    });
    it('should return false (when the requester is undefined', () => {
      expect(AuthorizationManager.requesterIsVerified(undefined)).toBe(false);
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
        AuthorizationManager.requesterIsAuthor({
          authorUsername: requester.username,
          requester,
        }),
      ).toBe(true);
    });
    it('should return false when the username of the requester does not match', () => {
      expect(
        AuthorizationManager.requesterIsAuthor({
          authorUsername: 'not requester',
          requester,
        }),
      ).toBe(false);
    });
    it('should return false when the requester is undefined', () => {
      expect(
        AuthorizationManager.requesterIsAuthor({
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
      expect(AuthorizationManager.requesterIsPrivileged(requester)).toBe(true);
    });
    it('should return true when accessGroups contain only the editor privilege', () => {
      requester.accessGroups = ['editor'];
      expect(AuthorizationManager.requesterIsPrivileged(requester)).toBe(true);
    });
    it('should return true when accessGroups contain only the curator@collection privilege', () => {
      requester.accessGroups = ['curator@collection'];
      expect(AuthorizationManager.requesterIsPrivileged(requester)).toBe(true);
    });
    it('should return true when accessGroups contain only the reviewer@collection privilege', () => {
      requester.accessGroups = ['reviewer@collection'];
      expect(AuthorizationManager.requesterIsPrivileged(requester)).toBe(true);
    });
    it('should return true when accessGroups contain all privileges', () => {
      requester.accessGroups = [
        'admin',
        'editor',
        'curator@collection',
        'reviewer@collection',
      ];
      expect(AuthorizationManager.requesterIsPrivileged(requester)).toBe(true);
    });
    it('should return false when accessGroups contain no privileges', () => {
      requester.accessGroups = [];
      expect(AuthorizationManager.requesterIsPrivileged(requester)).toBe(false);
    });
    it('should return false when requester data is undefined', () => {
      expect(AuthorizationManager.requesterIsPrivileged(undefined)).toBe(false);
    });
    it('should return false when accessGroups are undefined', () => {
      expect(
        AuthorizationManager.requesterIsPrivileged({ ...requester, accessGroups: undefined }),
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
      expect(AuthorizationManager.requesterIsAdmin(requester)).toBe(true);
    });
    it('should return true (when accessGroups contain all privileges', () => {
      requester.accessGroups = [
        'admin',
        'editor',
        'curator@collection',
        'reviewer@collection',
      ];
      expect(AuthorizationManager.requesterIsAdmin(requester)).toBe(true);
    });
    it('should return false when accessGroups contain no privileges', () => {
      requester.accessGroups = [];
      expect(AuthorizationManager.requesterIsAdmin(requester)).toBe(false);
    });
    it('should return false when accessGroups contain the editor privilege', () => {
      requester.accessGroups = ['editor'];
      expect(AuthorizationManager.requesterIsAdmin(requester)).toBe(false);
    });
    it('should return false when accessGroups contain the curator@collection privilege', () => {
      requester.accessGroups = ['curator@collection'];
      expect(AuthorizationManager.requesterIsAdmin(requester)).toBe(false);
    });
    it('should return false when accessGroups contain the reviewer@collection privilege', () => {
      requester.accessGroups = ['reviewer@collection'];
      expect(AuthorizationManager.requesterIsAdmin(requester)).toBe(false);
    });
    it('should return false when accessGroups contain all privileges except admin', () => {
      requester.accessGroups = [
        'editor',
        'curator@collection',
        'reviewer@collection',
      ];
      expect(AuthorizationManager.requesterIsAdmin(requester)).toBe(false);
    });
    it('should return false when requester is undefined', () => {
      expect(AuthorizationManager.requesterIsAdmin(undefined)).toBe(false);
    });
    it('should return false when accessGroups is undefined', () => {
      expect(AuthorizationManager.requesterIsAdmin(undefined)).toBe(false);
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
      expect(AuthorizationManager.requesterIsAdminOrEditor(requester)).toBe(true);
    });
    it('should return true when accessGroups contain the editor privilege', () => {
      requester.accessGroups = ['editor'];
      expect(AuthorizationManager.requesterIsAdminOrEditor(requester)).toBe(true);
    });
    it('should return true (when accessGroups contain all privileges', () => {
      requester.accessGroups = [
        'admin',
        'editor',
        'curator@collection',
        'reviewer@collection',
      ];
      expect(AuthorizationManager.requesterIsAdminOrEditor(requester)).toBe(true);
    });
    it('should return false when accessGroups contain no privileges', () => {
      requester.accessGroups = [];
      expect(AuthorizationManager.requesterIsAdminOrEditor(requester)).toBe(false);
    });
    it('should return false when accessGroups contain the curator@collection privilege', () => {
      requester.accessGroups = ['curator@collection'];
      expect(AuthorizationManager.requesterIsAdminOrEditor(requester)).toBe(false);
    });
    it('should return false when accessGroups contain the reviewer@collection privilege', () => {
      requester.accessGroups = ['reviewer@collection'];
      expect(AuthorizationManager.requesterIsAdminOrEditor(requester)).toBe(false);
    });
    it('should return false when accessGroups contain all privileges except admin and editor', () => {
      requester.accessGroups = ['curator@collection', 'reviewer@collection'];
      expect(AuthorizationManager.requesterIsAdminOrEditor(requester)).toBe(false);
    });
    it('should return false when requester is undefined', () => {
      expect(AuthorizationManager.requesterIsAdminOrEditor(undefined)).toBe(false);
    });
    it('should return false when accessGroups is undefined', () => {
      expect(AuthorizationManager.requesterIsAdminOrEditor(undefined)).toBe(false);
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
        AuthorizationManager.hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(true);
    });
    it('should return true when accessGroups contain the editor privilege', () => {
      requester.accessGroups = ['editor'];
      expect(
        AuthorizationManager.hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(true);
    });
    it('should return true when accessGroups contain the curator@collection privilege', () => {
      requester.accessGroups = ['curator@collection'];
      expect(
        AuthorizationManager.hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(true);
    });
    it('should return true when accessGroups contain the reviewer@collection privilege', () => {
      requester.accessGroups = ['reviewer@collection'];
      expect(
        AuthorizationManager.hasReadAccessByCollection({ requester, collection: 'collection' }),
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
        AuthorizationManager.hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(true);
    });
    it('should return false when accessGroups contain no privileges', () => {
      requester.accessGroups = [];
      expect(
        AuthorizationManager.hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(false);
    });
    it('should return false (Not admin, editor, or accessGroups @collection )', () => {
      requester.accessGroups = ['curator@someOtherCollection'];
      expect(
        AuthorizationManager.hasReadAccessByCollection({ requester, collection: 'collection' }),
      ).toBe(false);
    });
    it('should return false when requester is undefined', () => {
      expect(
        AuthorizationManager.hasReadAccessByCollection({
          requester: undefined,
          collection: 'collection',
        }),
      ).toBe(false);
    });
    it('should return false when accessGroups is undefined', () => {
      expect(
        AuthorizationManager.hasReadAccessByCollection({
          requester: { ...requester, accessGroups: undefined },
          collection: 'collection',
        }),
      ).toBe(false);
    });
  });
  describe('authorizeRequest', () => {
    it('should return void', () => {
      expect(AuthorizationManager.authorizeRequest([true])).toBeUndefined();
    });
    it('should throw ResourceError when false is the only value in the array', () => {
      try {
        AuthorizationManager.authorizeRequest([false]);
      } catch (e) {
        expect(e).toBeInstanceOf(ResourceError);
      }
    });
    it('should throw ResourceError when true and false exists in the array', () => {
      expect(AuthorizationManager.authorizeRequest([false, true])).toBeUndefined();
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
      levels: ['undergraduate'],
      name: 'My LO',
      version: 0,
      status: LearningObject.Status.RELEASED,
      revisionUri: 'test_URI',
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
            AuthorizationManager.authorizeReadAccess({
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
      date: Date.now().toString(),
      description: '',
      length: 'nanomodule',
      levels: ['undergraduate'],
      name: 'My LO',
      version: 0,
      status: LearningObject.Status.RELEASED,
      revisionUri: 'test_URI',
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
            AuthorizationManager.authorizeWriteAccess({
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
             AuthorizationManager.authorizeWriteAccess({
              learningObject: summary,
              requester,
            }),
          ).toBeUndefined();
        });
      });
    });
  });
});
