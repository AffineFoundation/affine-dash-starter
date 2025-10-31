import React from 'react'

interface TablePaginationControlsProps {
  theme: 'light' | 'dark'
  total: number
  page: number
  setPage: (page: number) => void
  pageSize: number
  setPageSize: (size: number) => void
}

const TablePaginationControls: React.FC<TablePaginationControlsProps> = ({
  theme: _theme,
  total: _total,
  page,
  setPage,
  pageSize,
  setPageSize,
}) => {
  const normalizedValue = Number.isFinite(pageSize)
    ? String(pageSize)
    : 'all'

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const raw = event.target.value
    const nextSize = raw === 'all' ? Number.POSITIVE_INFINITY : Number(raw)
    setPage(1)
    setPageSize(nextSize)
  }

  return (
    <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-light-slate">
      <span>Show</span>
      <select
        value={normalizedValue}
        onChange={handleChange}
        className="h-8 rounded-full border border-light-iron bg-light-haze px-4 text-[11px] font-semibold uppercase text-light-slate shadow-sm transition-colors duration-200 focus:border-light-slate focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value="all">All</option>
      </select>
    </div>
  )
}

export default TablePaginationControls
