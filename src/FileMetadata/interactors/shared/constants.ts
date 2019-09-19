export const MICROSOFT_EXTENSIONS = [
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
    'odt',
    'ott',
    'oth',
    'odm',
  ];

export const CAN_PREVIEW = ['pdf', ...MICROSOFT_EXTENSIONS];
export const MICROSOFT_PREVIEW_URL = process.env.MICROSOFT_PREVIEW_URL;
export const FILE_API_URI = process.env.LEARNING_OBJECT_API;
