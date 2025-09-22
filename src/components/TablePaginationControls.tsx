import React from 'react'
import PaginationButton from './PaginationButton'

interface TablePaginationControlsProps {
  theme: 'light' | 'dark'
  total: number
  page: number
  setPage: (page: number) => void
  pageSize: number
  setPageSize: (size: number) => void
}

const TablePaginationControls: React.FC<TablePaginationControlsProps> = ({
  theme,
  total,
  page,
  setPage,
  pageSize,
  setPageSize,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endIndex = Math.min(total, page * pageSize)

  return (
    <div className="text-gray-600 dark:text-dark-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="text-xs font-sans ">
        Showing {startIndex}–{endIndex} of {total}
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-sans ">Rows per page:</label>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className={`h-8 px-2  text-xs font-sans rounded-md transition-colors duration-300 ${
            theme === 'dark'
              ? 'text-dark-500 bg-dark-200 hover:bg-dark-300 '
              : ' bg-white '
          }`}
        >
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>
        <div className="flex items-center gap-1">
          <PaginationButton
            onClick={() => setPage(1)}
            disabled={page === 1}
            theme={theme}
            title="First page"
          >
            «
          </PaginationButton>
          <PaginationButton
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            theme={theme}
            title="Previous page"
          >
            ‹
          </PaginationButton>
          <span className="text-xs font-sans px-2">
            Page {page} of {totalPages}
          </span>
          <PaginationButton
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            theme={theme}
            title="Next page"
          >
            ›
          </PaginationButton>
          <PaginationButton
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
            theme={theme}
            title="Last page"
          >
            »
          </PaginationButton>
        </div>
      </div>
    </div>
  )
}

export default TablePaginationControls
