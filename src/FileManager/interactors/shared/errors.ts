const FileManagerModuleErrorMessages = {
    forbiddenLearningObjectDownload(username: string) {
        return `User ${
            username
        } does not have access to download the requested Learning Object`;
    },
};

export default FileManagerModuleErrorMessages;
