export const LearningObjectWithoutChildren = {
  author: {
    bio: expect.any(String),
    createdAt: expect.any(String),
    email: expect.any(String),
    emailVerified: true,
    id: expect.any(String),
    name: expect.any(String),
    organization: expect.any(String),
    username: expect.any(String),
  },
  children: expect.arrayContaining([]),
  collection: expect.any(String),
  contributors: expect.any(Array),
  date: expect.any(String),
  description: expect.any(String),
  id: expect.any(String),
  length: expect.any(String),
  levels: expect.arrayContaining([expect.any(String)]),
  materials: {
    files: expect.any(Array),
    folderDescriptions: expect.any(Array),
    notes: expect.any(String),
    pdf: expect.objectContaining({
      name: expect.any(String),
      url: expect.any(String),
    }),
    urls: expect.arrayContaining([
      expect.objectContaining({
        title: expect.any(String),
        url: expect.any(String),
      }),
    ]),
  },
  metrics: {
    downloads: expect.any(Number),
    saves: expect.any(Number),
  },
  name: expect.any(String),
  outcomes: expect.any(Array),
  status: expect.any(String),
};

export const LearningObjectWithChildren = {
  ...LearningObjectWithoutChildren,
  children: expect.arrayContaining([
    {
      id: expect.any(String),
      author: {
        bio: expect.any(String),
        createdAt: expect.any(String),
        email: expect.any(String),
        emailVerified: true,
        id: expect.any(String),
        name: expect.any(String),
        organization: expect.any(String),
        username: expect.any(String),
      },
      collection: expect.any(String),
      contributors: expect.any(Array),
      date: expect.any(String),
      description: expect.any(String),
      length: expect.any(String),
      levels: expect.arrayContaining([expect.any(String)]),
      status: expect.any(String),
    },
  ]),
};
