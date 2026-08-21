"use client";

import * as React from "react";
import type { CategoryItem } from "@/types/services";

export interface CategoryManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories?: CategoryItem[];
  onCategoriesChange?: (updated: CategoryItem[]) => void;
}

/**
 * @deprecated Categories have been removed in favor of centralized services.
 */
export function CategoryManagerDialog({
  open: _open,
  onOpenChange: _onOpenChange,
}: CategoryManagerDialogProps) {
  return null;
}
