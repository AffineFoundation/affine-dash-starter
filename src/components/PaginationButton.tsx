import React from 'react'

interface PaginationButtonProps {
  onClick: () => void
  disabled?: boolean
  theme: 'light' | 'dark'
  title: string
  children: React.ReactNode
}

const PaginationButton: React.FC<PaginationButtonProps> = ({
  onClick,
  disabled = false,
  theme,
  title,
  children,
}) => {
  return (
    <button onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  )
}

export default PaginationButton
