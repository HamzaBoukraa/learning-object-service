jest.mock('../../LearningObjects/adapters/LearningObjectAdapter', () => ({
  LearningObjectAdapter: {
    getInstance: () => {
      getInternalLearningObjectByCuid({cuid, username, userToken: requester});
    },
  },
}));

describe('When createLearningObjectRevision is called', () => {
  describe('')
});