import { LearningObjectInteractor, AdminLearningObjectInteractor } from '../interactors/interactors';
import { MongoDriver } from '../drivers/MongoDriver';
import { S3Driver } from '../drivers/S3Driver';
// const expect = require('chai').expect;
import { expect } from 'chai';
import { LearningObject } from '@cyber4all/clark-entity';
const driver = new MongoDriver; // DataStore
const fileManager = new S3Driver(); // FileManager

beforeAll(done => {
  // Before running any tests, connect to database
   const dburi = process.env.CLARK_DB_URI_TEST;
  // .replace(
  //   /<DB_PASSWORD>/g,
  //   process.env.CLARK_DB_PWD,
  // )
  // .replace(/<DB_PORT>/g, process.env.CLARK_DB_PORT)
  // .replace(/<DB_NAME>/g, process.env.CLARK_DB_NAME);
   driver.connect(dburi).then(val => {
    console.log('connected to database');
    done();
  }).catch((error) => {
    console.log('failed to connect to database');
    done();
  });
});

describe('loadLearningObjectSummary', () => {
  it('should load learning object summary', done => {
    const username = 'nvisal1';
    return LearningObjectInteractor.loadLearningObjectSummary(driver, username).then(val => {
      expect(val).to.be.an('array');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
  it('should return error - empty username given!', done => {
    const username = '';
    return LearningObjectInteractor.loadLearningObjectSummary(driver, username ).then(val => {
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
    const username = 'nvisal1';
    const learningObjectName = 'testing more contributors';
    return LearningObjectInteractor.loadLearningObject(driver, username, learningObjectName).then(val => {
      expect(val).to.be.an('object');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
  it('should return error - requesting unpublished object', done => {
    const username = 'nvisal1';
    const learningObjectName = 'testing contributor 4';
    return LearningObjectInteractor.loadLearningObject(driver, username, learningObjectName).then(val => {
      expect.fail();
      done();
    }).catch((error) => {
      expect(error).to.be.a('string');
      done();
    });
  });
  it('should return error - incorrect user', done => {
    const username = '';
    const learningObjectName = 'testing more contributors 2';
    return LearningObjectInteractor.loadLearningObject(driver, username, learningObjectName).then(val => {
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
    const ids = ['5b17ea3be3a1c4761f7f9463', '5b17ea3be3a1c4761f7f9463'];
    return LearningObjectInteractor.loadFullLearningObjectByIDs(driver, ids ).then(val => {
      expect(val).to.be.an('array');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
  it('should return learning object - given empty array!', done => {
    const ids = [''];
    return LearningObjectInteractor.loadFullLearningObjectByIDs(driver, ids ).then(val => {
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
    const learningObjectName = 'testing more contributors 2';
    LearningObjectInteractor.loadLearningObject(driver, username, learningObjectName).then(val => {
      return LearningObjectInteractor.addLearningObject(driver, val).then(val => {
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
  it('should return an object - we are creating a new object!', done => {
    const username = 'nvisal1';
    const learningObjectName = 'testing more contributors 2';
    LearningObjectInteractor.loadLearningObject(driver, username, learningObjectName).then(val => {
      val.name = 'unit testing';
      return LearningObjectInteractor.addLearningObject(driver, val).then(val => {
        expect(val).to.be.an('object');
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

describe('findLearningObject', () => {
it('should find a learning object ID', done => {
  const username = 'nvisal1';
  const learningObjectName = 'testing more contributors 2';
  return LearningObjectInteractor.findLearningObject(driver, username, learningObjectName ).then(val => {
    expect(val).to.be.a('string');
    done();
  }).catch((error) => {
    expect.fail();
    done();
  });
});
it('should return an error - invalid username provided!', done => {
  const username = '';
  const learningObjectName = 'testing more contributors 2';
  return LearningObjectInteractor.findLearningObject(driver, username, learningObjectName ).then(val => {
    expect.fail();
    done();
  }).catch((error) => {
    expect(error).to.be.a('string');
    done();
  });
});
it('should return an error - invalid lo name provided!', done => {
  const username = 'nvisal1';
  const learningObjectName = '';
  return LearningObjectInteractor.findLearningObject(driver, username, learningObjectName ).then(val => {
    expect.fail();
    done();
  }).catch((error) => {
    expect(error).to.be.a('string');
    done();
  });
});
it('should return an error - invalid data store provided!', done => {
    const username = 'nvisal1';
    const learningObjectName = 'testing more contributors 2';
    return LearningObjectInteractor.findLearningObject(this.driver, username, learningObjectName ).then(val => {
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
    const username = 'nvisal1';
    const id = '5b23d22c87e4934e12547e31';
    const learningObjectName = 'testing more contributors 2';
    LearningObjectInteractor.loadLearningObject(driver, username, learningObjectName).then(val => {
      return LearningObjectInteractor.updateLearningObject(driver, id, val).then(val => {
        expect(val).to.be.an('object');
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
  // Test 1: Provide expected input
  it('should return error', done => {
    const username = 'nvisal1';
    const learningObjectName = 'testing more contributors 2';
    const id = '';
    const published = true;
    return LearningObjectInteractor.togglePublished(driver, username, id, published).then(val => {
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
  const currPage = 1;
  const limit = 3;
  return LearningObjectInteractor.fetchAllObjects(driver, currPage, limit).then(val => {
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
  const currPage = 1;
  let limit;
  return LearningObjectInteractor.fetchAllObjects(driver, currPage, limit).then(val => {
    expect.fail();
    done();
  }).catch((error) => {
    expect(error).to.be.an('object');
    done();
  });
});
it('should return error - invalid data store provided!', done => {
      const currPage = 1;
      const limit = 3;
      return LearningObjectInteractor.fetchAllObjects(this.driver, currPage, limit).then(val => {
      expect.fail();
      done();
    }).catch((error) => {
      expect(error).to.be.a('string');
      done();
    });
  });
});

describe('fetchMultipleObjects', () => {
  it('should return an array of objects - based on given username and lo name', done => {
    const ids = [{username: 'nvisal1', learningObjectName: 'testing more contributors 2'}];
    return LearningObjectInteractor.fetchMultipleObjects(driver, ids).then(val => {
      expect(val).to.be.an('array');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
  it('should return an error - invalid data store provided!', done => {
    const ids = [{username: 'nvisal1', learningObjectName: 'testing more contributors 2'}];
    return LearningObjectInteractor.fetchMultipleObjects(this.driver, ids).then(val => {
      expect.fail();
      done();
    }).catch((error) => {
      expect(error).to.be.a('string');
      done();
    });
  });
});

describe('fetchObjectsByIDs', () => {
  it('should return an array of objects - based on given IDs', done => {
    const ids = ['5b17ea3be3a1c4761f7f9463'];
    return LearningObjectInteractor.fetchObjectsByIDs(driver, ids).then(val => {
      expect(val).to.be.an('array');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
  it('should return an error - invalid data store provided!', done => {
    const ids = ['5b17ea3be3a1c4761f7f9463'];
    return LearningObjectInteractor.fetchObjectsByIDs(this.driver, ids).then(val => {
      expect.fail();
      done();
    }).catch((error) => {
      expect(error).to.be.a('string');
      done();
    });
  });
});

describe('searchObjects', () => {
  it('should return an object - contains search results', done => {
    jest.setTimeout(10000);
    const name = 'testing more contributors 2';
    const author = '5a9583401405cb053272ced1';
    const length = ['nanomodule'];
    const levels = ['undergraduate'];
    const outcomeIDs = ['5b23d22c87e4934e12547e32'];
    const text = 'testing more contributors 2';
    return LearningObjectInteractor.searchObjects(driver, name, author, length, levels, outcomeIDs, text).then(val => {
      expect(val).to.be.an('object');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
  it('should return an error - invalid data store provided!', done => {
    jest.setTimeout(10000);
    const name = 'testing more contributors 2';
    const author = '5a9583401405cb053272ced1';
    const length = ['nanomodule'];
    const levels = ['undergraduate'];
    const outcomeIDs = ['5b23d22c87e4934e12547e32'];
    const text = 'testing more contributors 2';
    return LearningObjectInteractor.searchObjects(this.driver, name, author, length, levels, outcomeIDs, text).then(val => {
      expect.fail();
      done();
    }).catch((error) => {
      expect(error).to.be.a('string');
      done();
    });
  });
  it('should return an object - invalid name provided!', done => {
    jest.setTimeout(10000);
    const name = '';
    const author = 'nvisal1';
    const length = ['nanomodule'];
    const levels = ['undergraduate'];
    const outcomeIDs = ['5b23d22c87e4934e12547e32'];
    const text = 'testing more contributors 2';
    return LearningObjectInteractor.searchObjects(driver, name, author, length, levels, outcomeIDs, text).then(val => {
      expect(val).to.be.an('object');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
  it('should return an object - invalid author provided!', done => {
    jest.setTimeout(10000);
    const name = 'testing more contributors 2';
    const author = '';
    const length = ['nanomodule'];
    const levels = ['undergraduate'];
    const outcomeIDs = ['5b23d22c87e4934e12547e32'];
    const text = 'testing more contributors 2';
    return LearningObjectInteractor.searchObjects(driver, name, author, length, levels, outcomeIDs, text).then(val => {
      expect(val).to.be.an('object');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
  it('should return an object - invalid length provided!', done => {
    jest.setTimeout(10000);
    const name = 'testing more contributors 2';
    const author = 'nvisal1';
    const length = [''];
    const levels = ['undergraduate'];
    const outcomeIDs = ['5b23d22c87e4934e12547e32'];
    const text = 'testing more contributors 2';
    return LearningObjectInteractor.searchObjects(driver, name, author, length, levels, outcomeIDs, text).then(val => {
      expect(val).to.be.an('object');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
  it('should return an object - invalid levels provided!', done => {
    jest.setTimeout(10000);
    const name = 'testing more contributors 2';
    const author = 'nvisal1';
    const length = ['nanomodule'];
    const levels = [''];
    const outcomeIDs = ['5b23d22c87e4934e12547e32'];
    const text = 'testing more contributors 2';
    return LearningObjectInteractor.searchObjects(driver, name, author, length, levels, outcomeIDs, text).then(val => {
      expect(val).to.be.an('object');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
  it('should return an object - invalid outcomeIDs provided!', done => {
    jest.setTimeout(10000);
    const name = 'testing more contributors 2';
    const author = 'nvisal1';
    const length = ['nanomodule'];
    const levels = ['undergraduate'];
    const outcomeIDs = [''];
    const text = 'testing more contributors 2';
    return LearningObjectInteractor.searchObjects(driver, name, author, length, levels, outcomeIDs, text).then(val => {
      expect(val).to.be.an('object');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
  it('should return an object - invalid text provided!', done => {
    jest.setTimeout(10000);
    const name = 'testing more contributors 2';
    const author = 'nvisal1';
    const length = ['nanomodule'];
    const levels = ['undergraduate'];
    const outcomeIDs = ['5b23d22c87e4934e12547e32'];
    const text = '';
    return LearningObjectInteractor.searchObjects(driver, name, author, length, levels, outcomeIDs, text).then(val => {
      expect(val).to.be.an('object');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
});

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
it('should return an error - invalid data store provided!', done => {
    return LearningObjectInteractor.fetchCollections(this.driver).then(val => {
      expect.fail();
      done();
    }).catch((error) => {
      expect(error).to.be.a('string');
      done();
    });
  });
});

describe('fetchCollection', () => {
  it('should return an object - contains an array of learning objects - *** above logs caused from this test ***', done => {
    // Extra time for this test is required, will timeout otherwise!
    jest.setTimeout(10000);
    const collectionName = 'NSA NCCP';
    return LearningObjectInteractor.fetchCollection(driver, collectionName).then(val => {
      expect(val).to.be.an('object');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
  it('should return an error - invalid collection name', done => {
    const collectionName = '';
    return LearningObjectInteractor.fetchCollection(driver, collectionName).then(val => {
      expect.fail();
      done();
    }).catch((error) => {
      expect(error).to.be.a('string');
      done();
    });
  });
});

describe('addChild', () => {
  it('should return an object', done => {
    const params = {
      dataStore: driver,
      childId: '5b23cc7b16bdb944d96f1b00',
      username: 'nvisal1',
      parentName: 'testing more contributors 2',
    };
    return LearningObjectInteractor.addChild(params).then(val => {
        expect(val).to.be.an('undefined');
        done();
    }).catch((error) => {
        expect.fail();
        done();
    });
  });
});

describe('removeChild', () => {
  it('should return an object', done => {
    const params = {
      dataStore: driver,
      childId: '5b23cc7b16bdb944d96f1b00',
      username: 'nvisal1',
      parentName: 'testing more contributors 2',
    };
    return LearningObjectInteractor.removeChild(params).then(val => {
        expect(val).to.be.an('undefined');
        done();
    }).catch((error) => {
        expect.fail();
        done();
    });
  });
});

afterAll (() => {
  driver.disconnect();
  console.log('Disconnected from database');
});


