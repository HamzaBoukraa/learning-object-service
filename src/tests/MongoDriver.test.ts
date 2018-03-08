import { MongoDriver } from '../drivers/MongoDriver';
import { LearningObject, User, AcademicLevel } from '@cyber4all/clark-entity';
process.env.NODE_ENV = 'test';

export class MongoDriverTest {
  private mongoDriver = new MongoDriver();
  private author: User;
  private learningObject: LearningObject;
  private learningObjectID: string;

  public async test() {
    await this.mongoDriver.connect(process.env.CLARK_DB_URI_TEST);
    this.learningObject = await this.buildLearningObject();
    this.learningObjectID = await this.mongoDriver.insertLearningObject(
      this.learningObject
    );

    this.learningObject.outcomes[0].text = 'I WAS DEFINITELY EDITED';
    let newOutcome = this.learningObject.addOutcome();
    this.learningObject.name = 'I AM AN EDITED LEARNIGN OBJECT';

    await this.mongoDriver.editLearningObject(
      this.learningObjectID,
      this.learningObject
    );
    await this.endTest();
  }

  private async endTest() {
    await setTimeout(() => {
      this.mongoDriver.deleteLearningObject(this.learningObjectID);
      console.log('Cleared Database');
    }, 30000);
    //await this.mongoDriver.disconnect();
  }

  private async buildLearningObject(): Promise<LearningObject> {
    let authorID = await this.mongoDriver.findUser('gshaw7');
    this.author = await this.mongoDriver.fetchUser(authorID);
    let object = new LearningObject(this.author, 'New Test Learning Object');
    object.addGoal('Goal 1');
    object.addLevel(AcademicLevel.K_12);

    let newOutcome = object.addOutcome();
    newOutcome.bloom = 'Remember and Understand';
    newOutcome.text = 'Choose';

    let assessment = newOutcome.addAssessment();
    assessment.text = 'New Assessment';

    let strategy = newOutcome.addStrategy();
    strategy.text = 'New Strategy';

    return object;
  }
}
