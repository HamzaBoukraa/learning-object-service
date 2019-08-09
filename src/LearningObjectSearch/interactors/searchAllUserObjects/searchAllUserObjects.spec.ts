describe('If draftsOnly is specified', () => {
    describe('and the requester is not the author and is not a priveleged user', () => {
        it('should throw an error', () => {

        });
    });
    describe('and the requester does not specify status', () => {
        describe('and the requester is the author', () => {
            it('should return Learning Objects that belong to the author and has any status', () => {

            });
        });
        describe('and the requester is not the author, but is a privileged user', () => {
            it('should return Learning Objects that belong to the author and are in review.', () => {

            });
        });
    });
    describe('and the status is set to released', () => {
        it('should throw an error.', () => {

        });
    });
});

describe('If draftsOnly is not specified', () => {
    describe('and the requester is not the author and is not a priveleged user', () => {
        it('should return Learning Objects that belong to the author and are released', () => {

        });
    });
    describe('and the requester is not the author and is a privileged user', () => {
        describe('and the user has a privilege of reviewer@nccp', () => {
            it('should return Learning Objects that belong to the author and a status of released', () => {

            });
            it('should return Learning Objects that belong to the author that were submitted to the reviewer\`s collection', () => {

            });
        });
        describe('and the user has a privilege of curator@nccp', () => {
            it('should return Learning Objects that belong to the author and a status of released', () => {

            });
            it('should return Learning Objects that belong to the author that were submitted to the curator\`s collection', () => {

            });
        });
        describe('and the user has a privilege of editor', () => {
            it('should return Learning Objects that belong to the author and a status of released', () => {

            });
            it('should return Learning Objects that belong to the author that were submitted to any collection', () => {

            });
        });
        describe('and the user has a privilege of admin', () => {
            it('should return Learning Objects that belong to the author and a status of released', () => {

            });
            it('should return Learning Objects that belong to the author that were submitted to any collection', () => {

            });
        });
    });
});
