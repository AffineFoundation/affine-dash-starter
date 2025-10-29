import React from 'react'
import { Skeleton, SkeletonText } from './Skeleton'

interface Column {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  render?: (value: any, row: any) => React.ReactNode
}

interface DataTableProps {
  theme: 'light' | 'dark'
  columns: Column[]
  data: any[]
  loading: boolean
  error?: string | null
  gridCols?: string
  gridTemplateCols?: string
  sortField?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (field: string) => void
  pageSize?: number
}

const DataTable: React.FC<DataTableProps> = ({
  theme,
  columns,
  data,
  loading,
  error,
  gridCols,
  gridTemplateCols,
  sortField,
  sortDir,
  onSort,
  pageSize = 20,
}) => {
  const sortIndicator = (field: string) =>
    sortField !== field ? '' : sortDir === 'asc' ? '▲' : '▼'

  return (
    <div className="border rounded-md border-light-200 bg-light-100 dark:border-dark-200 dark:bg-dark-100">
      {/* Table Header */}
      <div className="px-2 py-[10px] text-light-smoke border-b border-black/5">
        <div
          className={`${
            gridCols || 'grid'
          } text-left px-3 h-8 bg-light-haze rounded-[3px] divide-x divide-black/5`}
          style={{ gridTemplateColumns: gridTemplateCols }}
        >
          {columns.map((column) => (
            <div
              key={column.key}
              className={`text-xs font-mono uppercase tracking-wide h-full flex items-center px-3 ${
                column.align === 'left' ? 'text-left' : ''
              }`}
              title={column.label}
            >
              {column.sortable && onSort ? (
                <button
                  onClick={() => onSort(column.key)}
                  className="inline-flex items-center gap-1 cursor-pointer underline-offset-2 hover:underline"
                >
                  <span>{column.label}</span>
                  <span>{sortIndicator(column.key)}</span>
                </button>
              ) : (
                column.label
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Table Body */}
      <div className="text-light-400 dark:text-dark-400 divide-y divide-light-200 dark:divide-dark-200">
        {error && (
          <div className="p-4 text-red-600 dark:text-red-400">{error}</div>
        )}

        {/* Skeleton Loader */}
        {loading &&
          !error &&
          Array.from({ length: Math.min(pageSize, 10) }).map((_, i) => (
            <div
              key={i}
              className="p-3 hover:bg-light-50/60 dark:hover:bg-gray-800/40"
            >
              <div
                className={`${gridCols || 'grid'} text-center`}
                style={{ gridTemplateColumns: gridTemplateCols }}
              >
                {columns.map((column, idx) => (
                  <div
                    key={idx}
                    className={column.align === 'left' ? 'text-left' : ''}
                  >
                    <SkeletonText theme={theme} className="h-4 w-16 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          ))}

        {/* Data Rows */}
        {!loading &&
          !error &&
          data.map((row, index) => (
            <div
              key={index}
              className="p-3 transition-colors duration-300"
            >
              <div
                className={`${gridCols || 'grid'} text-center`}
                style={{ gridTemplateColumns: gridTemplateCols }}
              >
                {columns.map((column) => (
                  <div
                    key={column.key}
                    className={`text-sm font-sans ${
                      column.align === 'left' ? 'text-left' : ''
                    } ${
                      column.key === '#' ||
                      column.key === 'uid' ||
                      column.key.includes('score')
                        ? 'font-bold tabular-nums'
                        : ''
                    } whitespace-nowrap`}
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </div>
                ))}
              </div>
            </div>
          ))}

        {/* No Data */}
        {!loading && !error && data.length === 0 && (
          <div className="p-4 text-center text-light-400 dark:text-dark-400">
            No data available
          </div>
        )}
      </div>
    </div>
  )
}

export default DataTable
