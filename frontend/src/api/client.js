import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ---- WORKOUTS ----
export const getWorkoutByDate = (date) =>
  api.get(`/workouts/date/${date}`).then(r => r.data).catch(e => {
    if (e.response?.status === 204) return null
    throw e
  })

export const saveWorkout = (data) =>
  api.post('/workouts', data).then(r => r.data)

export const getCalendarDates = (year, month) =>
  api.get(`/workouts/calendar`, { params: { year, month } }).then(r => r.data)

export const getRecentWorkouts = (limit = 5) =>
  api.get(`/workouts/recent`, { params: { limit } }).then(r => r.data)

export const getRecentlyLoggedExercises = (limit = 10) =>
  api.get(`/workouts/recent-exercises`, { params: { limit } }).then(r => r.data)

export const getWorkoutById = (id) =>
  api.get(`/workouts/${id}`).then(r => r.data)

export const getLastSets = (exerciseId) =>
  api.get(`/workouts/exercises/${exerciseId}/last-sets`).then(r => r.data).catch(e => {
    if (e.response?.status === 204) return null
    throw e
  })

export const getMonthlySummary = (year, month) =>
  api.get(`/workouts/summary`, { params: { year, month } }).then(r => r.data)

export const deleteWorkoutByDate = (date) =>
  api.delete(`/workouts/date/${date}`)

// ---- EXERCISES ----
export const getAllExercises = (params = {}) =>
  api.get('/exercises', { params }).then(r => r.data)

export const createExercise = (data) =>
  api.post('/exercises', data).then(r => r.data)

export const updateExercise = (id, data) =>
  api.put(`/exercises/${id}`, data).then(r => r.data)

// ---- PROGRESS ----
export const getAllPRs = () =>
  api.get('/progress/prs').then(r => r.data)

export const getPRForExercise = (exerciseId) =>
  api.get(`/progress/prs/${exerciseId}`).then(r => r.data).catch(e => {
    if (e.response?.status === 404) return null
    throw e
  })

export const getExerciseProgress = (exerciseId, startDate, endDate) =>
  api.get(`/progress/exercise/${exerciseId}`, { params: { startDate, endDate } }).then(r => r.data)

export const getMuscleVolumeProgress = (startDate, endDate) =>
  api.get('/progress/muscle-volume', { params: { startDate, endDate } }).then(r => r.data)
