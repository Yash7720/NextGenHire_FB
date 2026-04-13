import { useCallback } from 'react'
import * as userApi from '../services/userApi'

export function useAuth() {
  const login = useCallback(async ({ email, password }) => {
    return await userApi.login({ email, password })
  }, [])

  const register = useCallback(async ({ name, email, password, age, degree }) => {
    return await userApi.register({ name, email, password, age, degree })
  }, [])

  return { login, register }
}

