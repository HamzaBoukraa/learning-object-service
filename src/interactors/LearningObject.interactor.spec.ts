import { LearningObjectInteractor, AdminLearningObjectInteractor } from '../interactors/interactors';
import { expect } from 'chai';
import { LearningObject } from '@cyber4all/clark-entity';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';
import { MockS3Driver } from '../tests/mock-drivers/MockS3Driver';
import { MOCK_OBJECTS } from '../tests/mocks';
const driver = new MockDataStore; // DataStore
const fileManager = new MockS3Driver(); // FileManager

describe('loadLearningObjectSummary', () => {
  it('should load learning object summary', done => {
    return LearningObjectInteractor.loadLearningObjectSummary(driver, MOCK_OBJECTS.USERNAME).then(val => {
      expect(val).to.be.an('array');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
  it('should return error - empty username given!', done => {
    return LearningObjectInteractor.loadLearningObjectSummary(driver, MOCK_OBJECTS.EMPTY_STRING).then(val => {
      expect.fail();
      done();
    }).catch((error) => {
      expect(error).to.be.a('string');
      done();
    });
  });
});

describe('loadLearningObject', () => {
  it('should load learning object', done => {
    return LearningObjectInteractor.loadLearningObject(driver, MOCK_OBJECTS.USERNAME, MOCK_OBJECTS.LEARNING_OBJECT_NAME).then(val => {
      console.log(val);
      expect(val).to.be.an('object');
      done();
    }).catch((error) => {
      console.log(error);
      expect.fail();
      done();
    });
  });
  it('should return error - requesting unpublished object', done => {
    return LearningObjectInteractor.loadLearningObject(driver, MOCK_OBJECTS.USERNAME, MOCK_OBJECTS.LEARNING_OBJECT_NAME).then(val => {
      expect.fail();
      done();
    }).catch((error) => {
      expect(error).to.be.a('string');
      done();
    });
  });
  it('should return error - incorrect user', done => {
    return LearningObjectInteractor.loadLearningObject(driver, MOCK_OBJECTS.EMPTY_STRING, MOCK_OBJECTS.LEARNING_OBJECT_NAME).then(val => {
      expect.fail();
      done();
    }).catch((error) => {
      expect(error).to.be.a('string');
      done();
    });
  });
});

describe('loadFullLearningObjectByIDs', () => {
  it('should load full learning object', done => {
    return LearningObjectInteractor.loadFullLearningObjectByIDs(driver, [MOCK_OBJECTS.LEARNING_OBJECT_ID]).then(val => {
      expect(val).to.be.an('array');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
  it('should return learning object - given empty array!', done => {
    return LearningObjectInteractor.loadFullLearningObjectByIDs(driver, [MOCK_OBJECTS.EMPTY_STRING]).then(val => {
      expect(val).to.be.an('array');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
});

// Delete object before adding it so tests do not fail!
// fileManager = undefined
// describe('deleteLearningObject', () => {
//   it('should successfully delete the specified learning object', done => {
//     const username = 'nvisal1';
//     const learningObjectName = 'unit testing';
//     return LearningObjectInteractor.deleteLearningObject(driver, fileManager, username, learningObjectName).then(val => {
//       console.log(val);
//       expect(val).to.be.an('object');
//       done();
//     }).catch((error) => {
//       console.log(error);
//       expect.fail();
//       done();
//     });
//   });
//   it('should fail - we are trying to delete an object that no longer exists.', done => {
//     const username = 'nvisal1';
//     const learningObjectName = 'unit testing';
//     return LearningObjectInteractor.deleteLearningObject(driver, fileManager, username, learningObjectName).then(val => {
//       expect.fail();
//       done();
//     }).catch((error) => {
//       expect(error).to.be.a('string');
//       done();
//     });
//   });
// });

describe('addLearningObject', () => {
  it('should return an error - we are trying to publish an object that already exists!', done => {
    const username = 'nvisal1';
    const learningObjectName = 'testing more contributors';
    LearningObjectInteractor.loadLearningObject(driver, username, learningObjectName).then(val => {
      return LearningObjectInteractor.addLearningObject(driver, fileManager, val).then(val => {
        console.log(val);
        expect.fail();
        done();
      }).catch ((error) => {
        expect(error).to.be.a('string');
        done();
      });
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
  // it('should return an object - we are creating a new object!', done => {
  //   const username = 'nvisal1';
  //   const learningObjectName = 'testing more contributors';
  //   LearningObjectInteractor.loadLearningObject(driver, username, learningObjectName).then(val => {
  //     val.name = 'unit testing 2';
  //     return LearningObjectInteractor.addLearningObject(driver, val).then(val => {
  //       expect(val).to.be.an('object');
  //       done();
  //     }).catch ((error) => {
  //       expect.fail();
  //       done();
  //     });
  //   }).catch((error) => {
  //     expect.fail();
  //     done();
  //   });
  // });
});

describe('findLearningObject', () => {
  it('should find a learning object ID', done => {
    return LearningObjectInteractor.findLearningObject(driver, MOCK_OBJECTS.USERNAME, MOCK_OBJECTS.LEARNING_OBJECT_NAME).then(val => {
      expect(val).to.be.a('string');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
  it('should return an error - invalid username provided!', done => {
    return LearningObjectInteractor.findLearningObject(driver, MOCK_OBJECTS.EMPTY_STRING, MOCK_OBJECTS.LEARNING_OBJECT_NAME).then(val => {
      expect.fail();
      done();
    }).catch((error) => {
      expect(error).to.be.a('string');
      done();
    });
  });
  it('should return an error - invalid lo name provided!', done => {
    return LearningObjectInteractor.findLearningObject(driver, MOCK_OBJECTS.USERNAME, MOCK_OBJECTS.LEARNING_OBJECT_NAME).then(val => {
      expect.fail();
      done();
    }).catch((error) => {
      expect(error).to.be.a('string');
      done();
    });
  });
});

describe('updateLearningObject', () => {
  it('should return an object - undefined because no changes were made', done => {
    LearningObjectInteractor.loadLearningObject(driver, MOCK_OBJECTS.USERNAME, MOCK_OBJECTS.LEARNING_OBJECT_NAME).then(val => {
      return LearningObjectInteractor.updateLearningObject(driver, fileManager, MOCK_OBJECTS.LEARNING_OBJECT_ID, val).then(val => {
        expect(val).to.be.an('undefined');
        done();
      }).catch ((error) => {
        expect.fail();
        done();
      });
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
});

describe('togglePublished', () => {
  it('should return error', done => {
    return LearningObjectInteractor.togglePublished(driver, MOCK_OBJECTS.USERNAME, MOCK_OBJECTS.EMPTY_STRING, true).then(val => {
      expect.fail();
      done();
    }).catch((error) => {
      expect(error).to.be.a('string');
      done();
    });
  });
});

describe('fetchAllObjects', () => {
  it('should fetch all objects', done => {
    return LearningObjectInteractor.fetchAllObjects(driver, MOCK_OBJECTS.CURR_PAGE, MOCK_OBJECTS.LIMIT).then(val => {
      expect(val).to.be.an('object');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });

  it('should return error - invalid currPage provided!', done => {
    let currPage;
    const limit = 3;
    return LearningObjectInteractor.fetchAllObjects(driver, currPage, limit).then(val => {
      expect.fail();
      done();
    }).catch((error) => {
      expect(error).to.be.an('object');
      done();
    });
  });

  it('should return error - invalid limit provided!', done => {
    return LearningObjectInteractor.fetchAllObjects(driver, MOCK_OBJECTS.CURR_PAGE, MOCK_OBJECTS.NaN).then(val => {
      expect.fail();
      done();
    }).catch((error) => {
      expect(error).to.be.an('object');
      done();
    });
  });
});

describe('fetchMultipleObjects', () => {
  it('should return an array of objects - based on given username and lo name', done => {
    const ids = [{username: MOCK_OBJECTS.USERNAME, learningObjectName: MOCK_OBJECTS.LEARNING_OBJECT_NAME}];
    return LearningObjectInteractor.fetchMultipleObjects(driver, ids).then(val => {
      expect(val).to.be.an('array');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
});

describe('fetchObjectsByIDs', () => {
  it('should return an array of objects - based on given IDs', done => {
    return LearningObjectInteractor.fetchObjectsByIDs(driver, [MOCK_OBJECTS.LEARNING_OBJECT_ID]).then(val => {
      expect(val).to.be.an('array');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
});

// describe('searchObjects', () => {
//   it('should return an object - contains search results', done => {
//     jest.setTimeout(10000);
//     const name = 'testing more contributors';
//     const author = '5a9583401405cb053272ced1';
//     const length = ['nanomodule'];
//     const levels = ['undergraduate'];
//     const outcomeIDs = ['5b23d22c87e4934e12547e32'];
//     const text = 'testing more contributors';
//     return LearningObjectInteractor.searchObjects(driver, name, author, length, levels, outcomeIDs, text).then(val => {
//       console.log(val);
//       expect(val).to.be.an('object');
//       done();
//     }).catch((error) => {
//       console.log(error);
//       expect.fail();
//       done();
//     });
//   });
  // it('should return an error - invalid data store provided!', done => {
  //   jest.setTimeout(10000);
  //   const name = 'testing more contributors';
  //   const author = 'nvisal1';
  //   const length = ['nanomodule'];
  //   const levels = ['undergraduate'];
  //   const outcomeIDs = ['5b23d22c87e4934e12547e32'];
  //   const text = 'testing more contributors';
  //   return LearningObjectInteractor.searchObjects(this.driver, name, author, length, levels, outcomeIDs, text).then(val => {
  //     expect.fail();
  //     done();
  //   }).catch((error) => {
  //     expect(error).to.be.a('string');
  //     done();
  //   });
  // });
  // it('should return an object - invalid name provided!', done => {
  //   jest.setTimeout(10000);
  //   const name = '';
  //   const author = 'nvisal1';
  //   const length = ['nanomodule'];
  //   const levels = ['undergraduate'];
  //   const outcomeIDs = ['5b23d22c87e4934e12547e32'];
  //   const text = 'testing more contributors';
  //   return LearningObjectInteractor.searchObjects(driver, name, author, length, levels, outcomeIDs, text).then(val => {
  //     expect(val).to.be.an('object');
  //     done();
  //   }).catch((error) => {
  //     expect.fail();
  //     done();
  //   });
  // });
  // it('should return an object - invalid author provided!', done => {
  //   jest.setTimeout(10000);
  //   const name = 'testing more contributors';
  //   const author = '';
  //   const length = ['nanomodule'];
  //   const levels = ['undergraduate'];
  //   const outcomeIDs = ['5b23d22c87e4934e12547e32'];
  //   const text = 'testing more contributors';
  //   return LearningObjectInteractor.searchObjects(driver, name, author, length, levels, outcomeIDs, text).then(val => {
  //     expect(val).to.be.an('object');
  //     done();
  //   }).catch((error) => {
  //     expect.fail();
  //     done();
  //   });
  // });
  // it('should return an object - invalid length provided!', done => {
  //   jest.setTimeout(10000);
  //   const name = 'testing more contributors';
  //   const author = 'nvisal1';
  //   const length = [''];
  //   const levels = ['undergraduate'];
  //   const outcomeIDs = ['5b23d22c87e4934e12547e32'];
  //   const text = 'testing more contributors';
  //   return LearningObjectInteractor.searchObjects(driver, name, author, length, levels, outcomeIDs, text).then(val => {
  //     expect(val).to.be.an('object');
  //     done();
  //   }).catch((error) => {
  //     expect.fail();
  //     done();
  //   });
  // });
  // it('should return an object - invalid levels provided!', done => {
  //   jest.setTimeout(10000);
  //   const name = 'testing more contributors';
  //   const author = 'nvisal1';
  //   const length = ['nanomodule'];
  //   const levels = [''];
  //   const outcomeIDs = ['5b23d22c87e4934e12547e32'];
  //   const text = 'testing more contributors';
  //   return LearningObjectInteractor.searchObjects(driver, name, author, length, levels, outcomeIDs, text).then(val => {
  //     expect(val).to.be.an('object');
  //     done();
  //   }).catch((error) => {
  //     expect.fail();
  //     done();
  //   });
  // });
  // it('should return an object - invalid outcomeIDs provided!', done => {
  //   jest.setTimeout(10000);
  //   const name = 'testing more contributors';
  //   const author = 'nvisal1';
  //   const length = ['nanomodule'];
  //   const levels = ['undergraduate'];
  //   const outcomeIDs = [''];
  //   const text = 'testing more contributors';
  //   return LearningObjectInteractor.searchObjects(driver, name, author, length, levels, outcomeIDs, text).then(val => {
  //     expect(val).to.be.an('object');
  //     done();
  //   }).catch((error) => {
  //     expect.fail();
  //     done();
  //   });
  // });
  // it('should return an object - invalid text provided!', done => {
  //   jest.setTimeout(10000);
  //   const name = 'testing more contributors';
  //   const author = 'nvisal1';
  //   const length = ['nanomodule'];
  //   const levels = ['undergraduate'];
  //   const outcomeIDs = ['5b23d22c87e4934e12547e32'];
  //   const text = '';
  //   return LearningObjectInteractor.searchObjects(driver, name, author, length, levels, outcomeIDs, text).then(val => {
  //     expect(val).to.be.an('object');
  //     done();
  //   }).catch((error) => {
  //     expect.fail();
  //     done();
  //   });
  // });
// });

describe('fetchCollections', () => {
  it('should return an array of objects - these objects contain lo IDs', done => {
    return LearningObjectInteractor.fetchCollections(driver).then(val => {
      expect(val).to.be.an('array');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
});

describe('fetchCollection', () => {
  it('should return an object - contains an array of learning objects ', done => {
    return LearningObjectInteractor.fetchCollection(driver, MOCK_OBJECTS.COLLECTION_NAME).then(val => {
      expect(val).to.be.an('object');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });

  it('should return an error - invalid collection name', done => {
    return LearningObjectInteractor.fetchCollection(driver, MOCK_OBJECTS.EMPTY_STRING).then(val => {
      expect.fail();
      done();
    }).catch((error) => {
      expect(error).to.be.a('string');
      done();
    });
  });
});

// describe('addChild', () => {
//   it('should return an object', done => {
//     const params = {
//       dataStore: driver,
//       childId: '5b23ca0e14dc5644410b30b1',
//       username: 'nvisal1',
//       parentName: 'testing more contributors',
//     };
//     return LearningObjectInteractor.addChild(params).then(val => {
//         expect(val).to.be.an('undefined');
//         done();
//     }).catch((error) => {
//         expect.fail();
//         done();
//     });
//   });
// });

// describe('removeChild', () => {
//   it('should return an object', done => {
//     const params = {
//       dataStore: driver,
//       childId: '5b23ca0e14dc5644410b30b1',
//       username: 'nvisal1',
//       parentName: 'testing more contributors',
//     };
//     return LearningObjectInteractor.removeChild(params).then(val => {
//         expect(val).to.be.an('undefined');
//         done();
//     }).catch((error) => {
//         expect.fail();
//         done();
//     });
//   });
// });



