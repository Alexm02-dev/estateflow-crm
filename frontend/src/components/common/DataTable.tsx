import React, { ReactNode, useRef, useEffect, memo, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from './SkeletonLoader';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  render?: (item: T, index: number) => ReactNode;
}

export type TableDensity = 'compact' | 'normal' | 'comfortable';

interface DataTableProps<T extends { id: number | string }> {
  columns: Column<T>[];
  data: T[];
  keyField?: keyof T;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;

  // Density & Layout
  density?: TableDensity;
  stickyHeader?: boolean;

  // Selection
  selectable?: boolean;
  selectedIds?: (number | string)[];
  onSelectionChange?: (selectedIds: (number | string)[]) => void;
  isRowSelectable?: (item: T) => boolean;

  // Sorting
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;

  // Row Interaction
  onRowClick?: (item: T) => void;
  highlightRowId?: number | string | null;

  // Pagination
  page?: number;
  totalPages?: number;
  totalElements?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];

  className?: string;
}

interface DataTableRowProps<T extends { id: number | string }> {
  item: T;
  index: number;
  id: number | string;
  columns: Column<T>[];
  checkboxCellClass: string;
  bodyCellClass: string;
  isSelected: boolean;
  isHighlighted: boolean;
  isSelectable: boolean;
  selectable: boolean;
  onRowClick?: (item: T) => void;
  onSelectRow?: (e: React.MouseEvent, id: number | string) => void;
}

const DataTableRow = memo(function DataTableRow<T extends { id: number | string }>({
  item,
  index,
  id,
  columns,
  checkboxCellClass,
  bodyCellClass,
  isSelected,
  isHighlighted,
  isSelectable,
  selectable,
  onRowClick,
  onSelectRow,
}: DataTableRowProps<T>) {
  return (
    <tr
      key={String(id)}
      onClick={() => onRowClick && onRowClick(item)}
      className={`transition-all duration-200 ease-out ${
        onRowClick ? 'cursor-pointer' : ''
      } ${
        isSelected
          ? 'bg-brand-50/80 dark:bg-brand-950/60 hover:bg-brand-100/70 dark:hover:bg-brand-900/60 shadow-xs border-l-4 border-l-brand-600'
          : isHighlighted
          ? 'bg-amber-50/70 dark:bg-amber-950/50 hover:bg-amber-100/70 dark:hover:bg-amber-900/50 border-l-4 border-l-amber-500'
          : 'hover:bg-slate-50/90 dark:hover:bg-slate-800/60 hover:shadow-2xs hover:-translate-y-px'
      }`}
    >
      {selectable && (
        <td
          className={`${checkboxCellClass} text-center`}
          onClick={(e) => isSelectable && onSelectRow && onSelectRow(e, id)}
        >
          <input
            type="checkbox"
            checked={isSelected}
            disabled={!isSelectable}
            onChange={() => {
              // Handled by parent td onClick with stopPropagation
            }}
            className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500 focus:ring-offset-0 transition cursor-pointer disabled:cursor-not-allowed"
            aria-label={`Select row ${id}`}
          />
        </td>
      )}

      {columns.map((column) => (
        <td
          key={column.key}
          className={`${bodyCellClass} text-slate-800 dark:text-slate-200 ${column.className || ''}`}
        >
          {column.render
            ? column.render(item, index)
            : String((item as Record<string, unknown>)[column.key] ?? '—')}
        </td>
      ))}
    </tr>
  );
}) as <T extends { id: number | string }>(props: DataTableRowProps<T>) => React.ReactElement;

export function DataTable<T extends { id: number | string }>({
  columns,
  data,
  keyField = 'id' as keyof T,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no records matching your current criteria.',
  emptyActionLabel,
  onEmptyAction,

  density = 'normal',
  stickyHeader = true,

  selectable = false,
  selectedIds = [],
  onSelectionChange,
  isRowSelectable = () => true,

  sortField,
  sortDirection,
  onSort,

  onRowClick,
  highlightRowId,

  page = 0,
  totalPages = 1,
  totalElements = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],

  className = '',
}: DataTableProps<T>) {
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const densityStyles = {
    compact: {
      headerCell: 'px-2 py-2 text-xs',
      bodyCell: 'px-2 py-2 text-xs',
      checkboxCell: 'w-9 px-2 py-2',
    },
    normal: {
      headerCell: 'px-2.5 sm:px-3 py-2.5 sm:py-3 text-xs',
      bodyCell: 'px-2.5 sm:px-3 py-2.5 sm:py-3 text-xs sm:text-sm',
      checkboxCell: 'w-9 px-2 py-2.5 sm:py-3',
    },
    comfortable: {
      headerCell: 'px-3.5 sm:px-4 py-3.5 text-xs',
      bodyCell: 'px-3.5 sm:px-4 py-3.5 text-sm',
      checkboxCell: 'w-12 px-3.5 py-3.5',
    },
  }[density];

  const eligibleRows = data.filter(isRowSelectable);
  const eligibleRowIds = eligibleRows.map((r) => r[keyField] as number | string);
  const selectedEligibleIds = eligibleRowIds.filter((id) => selectedIds.includes(id));

  const isAllSelected = eligibleRowIds.length > 0 && selectedEligibleIds.length === eligibleRowIds.length;
  const isIndeterminate = selectedEligibleIds.length > 0 && selectedEligibleIds.length < eligibleRowIds.length;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (isAllSelected) {
      // Deselect all on current page
      onSelectionChange(selectedIds.filter((id) => !eligibleRowIds.includes(id)));
    } else {
      // Select all eligible on current page
      const newSelected = Array.from(new Set([...selectedIds, ...eligibleRowIds]));
      onSelectionChange(newSelected);
    }
  };

  const handleSelectRow = useCallback((e: React.MouseEvent, id: number | string) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  }, [onSelectionChange, selectedIds]);

  const renderSortIcon = (fieldKey: string) => {
    if (!sortField || sortField !== fieldKey) {
      return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-brand-600" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-brand-600" />
    );
  };

  return (
    <div className={`flex flex-col min-w-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden ${className}`}>
      {/* Table Container */}
      <div className="overflow-x-auto min-h-[280px] w-full scrollbar-thin">
        <table className="w-full text-left border-collapse table-auto min-w-full">
          <thead>
            <tr
              className={`bg-slate-50/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold tracking-wider ${
                stickyHeader ? 'sticky top-0 z-10 backdrop-blur-xs shadow-2xs' : ''
              }`}
            >
              {selectable && (
                <th scope="col" className={`${densityStyles.checkboxCell} text-center`}>
                  <span className="sr-only">Select All</span>
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    disabled={eligibleRowIds.length === 0}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500 focus:ring-offset-0 transition cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Select all rows on current page"
                  />
                </th>
              )}

              {columns.map((column) => {
                const isSortable = column.sortable && onSort;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    onClick={() => isSortable && onSort(column.key)}
                    className={`${densityStyles.headerCell} text-slate-700 dark:text-slate-200 ${
                      isSortable ? 'cursor-pointer select-none group hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors' : ''
                    } ${column.headerClassName || ''}`}
                  >
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <span>{column.header}</span>
                      {isSortable && renderSortIcon(column.key)}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {isLoading ? (
              Array.from({ length: pageSize > 10 ? 8 : pageSize }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse">
                  {selectable && (
                    <td className={`${densityStyles.checkboxCell} text-center`}>
                      <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded mx-auto" />
                    </td>
                  )}
                  {columns.map((col, cIndex) => (
                    <td key={`skel-col-${cIndex}`} className={`${densityStyles.bodyCell} ${col.className || ''}`}>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-6 py-12 text-center"
                >
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    actionLabel={emptyActionLabel}
                    onAction={onEmptyAction}
                  />
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const id = item[keyField] as number | string;
                return (
                  <DataTableRow
                    key={String(id)}
                    item={item}
                    index={index}
                    id={id}
                    columns={columns}
                    checkboxCellClass={densityStyles.checkboxCell}
                    bodyCellClass={densityStyles.bodyCell}
                    isSelected={selectedIds.includes(id)}
                    isHighlighted={highlightRowId !== null && highlightRowId === id}
                    isSelectable={isRowSelectable(item)}
                    selectable={selectable}
                    onRowClick={onRowClick}
                    onSelectRow={handleSelectRow}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {(totalElements > 0 || totalPages > 1) && onPageChange && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 bg-slate-50/60 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 w-full flex-wrap">
          <div className="flex items-center gap-4">
            <span>
              Showing <span className="font-semibold text-slate-900 dark:text-slate-200">{page * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-200">
                {Math.min((page + 1) * pageSize, totalElements)}
              </span>{' '}
              of <span className="font-semibold text-slate-900 dark:text-slate-200">{totalElements}</span> results
            </span>

            {onPageSizeChange && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 dark:text-slate-500">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                >
                  {pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0 || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let pageNumber = page;
              if (totalPages <= 5) {
                pageNumber = i;
              } else if (page <= 2) {
                pageNumber = i;
              } else if (page >= totalPages - 3) {
                pageNumber = totalPages - 5 + i;
              } else {
                pageNumber = page - 2 + i;
              }

              const isActive = pageNumber === page;
              return (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => onPageChange(pageNumber)}
                  disabled={isLoading}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {pageNumber + 1}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1 || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
