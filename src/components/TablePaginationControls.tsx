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
    <div className="text-light-slate flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-medium">
      <div className="text-sm uppercase tracking-wide leading-none flex items-center gap-3">
        <label>Rows per page</label>

        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="h-7 px-3 rounded-full transition-colors duration-300 text-light-500 bg-white border border-black/12 "
        >
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>

        <div className="flex items-center gap-1 [word-spacing:15px]">
          <PaginationButton
            onClick={() => setPage(1)}
            disabled={page === 1}
            theme={theme}
            title="First page"
          >
            <img src="/arrow-left-double.svg" alt="Arrow Left Double" />
          </PaginationButton>
          <PaginationButton
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            theme={theme}
            title="Previous page"
          >
            <img src="/arrow-left.svg" alt="Arrow Left" />
          </PaginationButton>
          <span className="px-2">
            Page <span className="text-light-smoke">{page}</span> of{' '}
            <span className="text-light-smoke">{totalPages}</span>
          </span>
          <PaginationButton
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            theme={theme}
            title="Next page"
          >
            <img src="/arrow-right.svg" alt="Arrow Right" />
          </PaginationButton>
          <PaginationButton
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
            theme={theme}
            title="Last page"
          >
            <img src="/arrow-right-double.svg" alt="Arrow Right Double" />
          </PaginationButton>
        </div>
      </div>
    </div>
  )
}

export default TablePaginationControls
