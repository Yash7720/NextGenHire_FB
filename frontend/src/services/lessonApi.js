import { apiRequest } from './http';

export const getLessonsByCourseAndChapter = async (course, chapter) => {
  const data = await apiRequest(`/api/lessons/${encodeURIComponent(course)}/${encodeURIComponent(chapter)}`);
  return data;
};
