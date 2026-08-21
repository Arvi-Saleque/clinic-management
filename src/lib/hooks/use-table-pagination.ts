"use client";

import * as React from "react";

export interface UseTablePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

export function useTablePagination<T>(
  items: T[],
  options: UseTablePaginationOptions = {},
) {
  const { initialPage = 1, initialPageSize = 10 } = options;
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Reset to page 1 if current page is out of bounds
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    const boundedPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(boundedPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const resetPage = () => {
    setCurrentPage(1);
  };

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    paginatedItems,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
    resetPage,
  };
}
