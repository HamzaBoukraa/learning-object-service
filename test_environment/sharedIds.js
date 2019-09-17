
const IDS = {
    PARENT: {
        released_1: 'parent_object_1',
        proofing_1: 'proofing_object_1',
        waiting_1: 'waiting_object_1',
        unreleased_1: 'unreleased_object_1'
    },
    CHILD: {
        released_1: 'child_object_1',
        waiting_1: 'waiting_child',
    },
    AUTHOR: {
        Bob: 'mock_author_id',
        User_Search: 'user_search_id', 
    },
    PRIVILEGED_USER: {
        admin: 'mock_admin_id',
        editor: 'mock_editor_id',
        curator: 'mock_curator_id',
        reviewer: 'mock_reviewer_id',
    },
    OUTCOME: {
        NICE: 'NICE_OUTCOME',
        EXPLAIN: 'EXPLAIN_OUTCOME',
    },
    USER_SEARCH: {
        UNRELEASED: 'user_search_unreleased',
        WAITING: 'user_search_waiting',
        WAITING_C5: 'user_search_waiting_c5',
        REVIEW: 'user_search_review',
        PROOFING: 'user_search_proofing',
        RELEASED: 'user_search_released',
    }

}

module.exports = IDS;
