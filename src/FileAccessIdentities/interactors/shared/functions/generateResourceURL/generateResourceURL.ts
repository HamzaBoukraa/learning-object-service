export function generateResourceURL(username: string) {
    return `${process.env.LEARNING_OBJECT_API}/file-access-identity/${username}`;
}
