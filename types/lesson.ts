export interface Lesson {
  _id: string
  title: string
  duration: number
  remainingTime: number
  status: 'active' | 'used'
  createdAt: string
}

export interface LessonRecord {
  _id: string
  lessonId: {
    _id: string
    title: string
  }
  duration: number
  teacherName: string
  status: 'completed' | 'cancelled'
  createdAt: string
}

export interface LessonStats {
  totalMinutes: number
  remainingMinutes: number
  completedLessons: number
  totalSpent: number
} 