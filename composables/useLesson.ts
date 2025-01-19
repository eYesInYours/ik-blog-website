import type { Lesson, LessonRecord, LessonStats } from '~/types/lesson'

export const useLesson = () => {
  const { fetchApi } = useApi()

  // 获取课时列表
  const getLessons = async () => {
    const { data } = await fetchApi<Lesson[]>('/lessons')
    return data
  }

  // 获取使用记录
  const getLessonRecords = async () => {
    const { data } = await fetchApi<LessonRecord[]>('/lessons/records')
    return data
  }

  // 获取统计数据
  const getLessonStats = async () => {
    const { data } = await fetchApi<LessonStats>('/lessons/stats')
    return data
  }

  // 创建课时(充值)
  const createLesson = async (lesson: { title: string; duration: number }) => {
    const { data } = await fetchApi('/lessons', {
      method: 'POST',
      body: lesson
    })
    return data
  }

  // 使用课时
  const useLesson = async (lessonId: string, usage: { duration: number; teacherName: string }) => {
    const { data } = await fetchApi(`/lessons/${lessonId}/use`, {
      method: 'POST',
      body: usage
    })
    return data
  }

  return {
    getLessons,
    getLessonRecords,
    getLessonStats,
    createLesson,
    useLesson
  }
} 