export const USER_ROUTES = {
    GET_USER(username: string) {
        return `${process.env.USER_API}/users/${encodeURIComponent(username)}`;
    },
};

