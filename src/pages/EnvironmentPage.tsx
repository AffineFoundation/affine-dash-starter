import React from 'react'
import { Navigate, useParams } from 'react-router-dom'

import EnvironmentDetail from '../components/EnvironmentDetail'
import { useEnvironments } from '../contexts/EnvironmentsContext'

const EnvironmentPage: React.FC<{ theme: 'light' | 'dark' }> = ({ theme }) => {
  const { envName } = useParams()
  const { environments, loading } = useEnvironments()

  if (loading) return null
  if (!envName || !environments.includes(envName)) {
    return <Navigate to="/" replace />
  }

  return <EnvironmentDetail env={envName} theme={theme} variant="page" />
}

export default EnvironmentPage
