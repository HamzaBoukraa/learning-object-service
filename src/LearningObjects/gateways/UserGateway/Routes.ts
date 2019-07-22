export const USER_ROUTES = {
    GET_USER(username: string) {
        return `users/${encodeURIComponent(username)}/profile`;
    },
};

