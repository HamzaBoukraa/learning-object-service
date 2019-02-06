import { MOCK_OBJECTS } from '../tests/mocks';
import { verifyAccessGroup } from './AuthGuard';

describe('verifyAccessGroup', () => {
  it('should deny access (given user with no access groups)', () => {
    expect(
        verifyAccessGroup([''], MOCK_OBJECTS.REQUIRED_ACCESS_GROUPS_CURATOR)
    ).toBe(false);
  });
  it('Should allow access (given exact matching arrays)', () => {
    expect(
        verifyAccessGroup(MOCK_OBJECTS.ACCESS_GROUPS, MOCK_OBJECTS.REQUIRED_ACCESS_GROUPS_CURATOR)
    ).toBe(true);
  });
  it('Should allow access because of admin (given curator of incorrect collection)', () => {
    expect(
      verifyAccessGroup(MOCK_OBJECTS.ACCESS_GROUPS, MOCK_OBJECTS.REQUIRED_ACCESS_GROUPS_CURATOR, MOCK_OBJECTS.ABV_COLLECTION_NAME)
    ).toBe(true);
  });
  it('Should deny access (given curator of incorrect collection)', () => {
    expect(
        verifyAccessGroup(MOCK_OBJECTS.ACCESS_GROUPS_CURATOR, MOCK_OBJECTS.REQUIRED_ACCESS_GROUPS_CURATOR, MOCK_OBJECTS.ABV_COLLECTION_NAME)
    ).toBe(false);
  });
  it('Should deny access (given reviewer of correct collection but requires curator level)', () => {
    expect(
        verifyAccessGroup(MOCK_OBJECTS.ACCESS_GROUPS_REVIEWER_NCCP, MOCK_OBJECTS.REQUIRED_ACCESS_GROUPS_CURATOR, MOCK_OBJECTS.ABV_COLLECTION_NAME)
    ).toBe(false);
  });
  it('Should deny access (given reviewer of incorrect collection)', () => {
    expect(
        verifyAccessGroup(MOCK_OBJECTS.ACCESS_GROUPS_REVIEWER_SECJ, MOCK_OBJECTS.REQUIRED_ACCESS_GROUPS_CURATOR, MOCK_OBJECTS.ABV_COLLECTION_NAME)
    ).toBe(false);
  });
  it('Should deny access (given reviewer of incorrect collection)', () => {
    expect(
        verifyAccessGroup(MOCK_OBJECTS.ACCESS_GROUPS_REVIEWER_SECJ, MOCK_OBJECTS.REQUIRED_ACCESS_GROUPS_REVIEWER, MOCK_OBJECTS.ABV_COLLECTION_NAME)
    ).toBe(false);
  });
  it('Should allow access (given reviewer of correct collection)', () => {
    expect(
        verifyAccessGroup(MOCK_OBJECTS.ACCESS_GROUPS_REVIEWER_NCCP, MOCK_OBJECTS.REQUIRED_ACCESS_GROUPS_REVIEWER, MOCK_OBJECTS.ABV_COLLECTION_NAME)
    ).toBe(true);
  });
  it('Should allow access (given two curators with one correct collection)', () => {
    expect(
        verifyAccessGroup(MOCK_OBJECTS.ACCESS_GROUPS_MULTIPLE_CURATORS_UNSORTED, MOCK_OBJECTS.REQUIRED_ACCESS_GROUPS_CURATOR_UNSORTED, MOCK_OBJECTS.ABV_COLLECTION_NAME)
    ).toBe(true);
  });
});

