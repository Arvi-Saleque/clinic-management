"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  itemLabel?: string;
  compact?: boolean;
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  className,
  itemLabel = "items",
  compact = false,
}: TablePaginationProps) {
  if (totalItems === 0) return null;

  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate pagination range with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("ellipsis");
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push("ellipsis");
      }
      pages.push(totalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3.5 px-4 py-3.5 border-t border-border/60 bg-card/80 backdrop-blur-xs text-xs text-muted-foreground select-none",
        className,
      )}
    >
      {/* Left: Summary text & Rows per page */}
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <p className="font-medium text-muted-foreground">
          Showing <span className="font-bold text-foreground">{startItem}</span> to{" "}
          <span className="font-bold text-foreground">{endItem}</span> of{" "}
          <span className="font-bold text-foreground">{totalItems}</span> {itemLabel}
        </p>

        {onPageSizeChange && pageSizeOptions.length > 0 && !compact && (
          <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
            <span className="text-[11px] font-semibold text-muted-foreground">Per page:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => onPageSizeChange(Number(val))}
            >
              <SelectTrigger className="h-8 w-[70px] rounded-xl text-xs bg-card border-border/80 font-bold px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)} className="text-xs font-semibold">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Right: Modern Page Buttons */}
      <div className="flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-end">
        {/* First Page */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="size-8 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground disabled:opacity-40"
          title="First page"
        >
          <ChevronsLeft className="size-3.5" />
        </Button>

        {/* Previous Page */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="size-8 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground disabled:opacity-40"
          title="Previous page"
        >
          <ChevronLeft className="size-3.5" />
        </Button>

        {/* Numbered Buttons (Hidden on super small screens if compact) */}
        <div className="hidden xs:flex items-center gap-1 mx-1">
          {pageNumbers.map((p, idx) => {
            if (p === "ellipsis") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="size-8 flex items-center justify-center text-muted-foreground font-bold tracking-widest text-[11px]"
                >
                  &hellip;
                </span>
              );
            }

            const isCurrent = p === currentPage;
            return (
              <Button
                key={p}
                variant={isCurrent ? "default" : "ghost"}
                size="icon-sm"
                onClick={() => onPageChange(p)}
                className={cn(
                  "size-8 rounded-xl text-xs font-bold transition-all",
                  isCurrent
                    ? "bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white shadow-xs"
                    : "border border-border/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                )}
              >
                {p}
              </Button>
            );
          })}
        </div>

        {/* Next Page */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="size-8 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground disabled:opacity-40"
          title="Next page"
        >
          <ChevronRight className="size-3.5" />
        </Button>

        {/* Last Page */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="size-8 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground disabled:opacity-40"
          title="Last page"
        >
          <ChevronsRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
