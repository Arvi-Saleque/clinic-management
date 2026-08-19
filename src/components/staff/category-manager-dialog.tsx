"use client";

import * as React from "react";
import { AlertCircle, Check, Loader2, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CategoryItem } from "@/types/services";
import {
  createCategoryAction,
  renameCategoryAction,
  deleteCategoryAction,
} from "@/lib/server/doctor-services";

interface CategoryManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryItem[];
  onCategoriesChange: (updated: CategoryItem[]) => void;
  onCategorySelect?: (categoryName: string) => void;
}

export function CategoryManagerDialog({
  open,
  onOpenChange,
  categories,
  onCategoriesChange,
  onCategorySelect,
}: CategoryManagerDialogProps) {
  // Adding state
  const [isAdding, setIsAdding] = React.useState(false);
  const [newCatName, setNewCatName] = React.useState("");
  const [isSavingNew, setIsSavingNew] = React.useState(false);

  // Editing state
  const [editingCat, setEditingCat] = React.useState<CategoryItem | null>(null);
  const [editCatName, setEditCatName] = React.useState("");
  const [isSavingEdit, setIsSavingEdit] = React.useState(false);

  // Deleting state
  const [deletingCat, setDeletingCat] = React.useState<CategoryItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Add Category Handler
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCatName.trim();
    if (!clean || clean.length < 2) {
      toast.error("Category name must be at least 2 characters");
      return;
    }

    if (categories.some((c) => c.name.toLowerCase() === clean.toLowerCase())) {
      toast.error(`Category "${clean}" already exists`);
      return;
    }

    setIsSavingNew(true);
    try {
      const res = await createCategoryAction(clean);
      if (res.success && res.category) {
        const updated = [...categories, res.category].sort((a, b) => a.name.localeCompare(b.name));
        onCategoriesChange(updated);
        if (onCategorySelect) onCategorySelect(clean);
        toast.success(`Category "${clean}" added`);
        setNewCatName("");
        setIsAdding(false);
      } else {
        toast.error(res.error ?? "Failed to add category");
      }
    } catch {
      toast.error("Failed to add category");
    } finally {
      setIsSavingNew(false);
    }
  };

  // Rename Category Handler
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat) return;

    const clean = editCatName.trim();
    if (!clean || clean.length < 2) {
      toast.error("Category name must be at least 2 characters");
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await renameCategoryAction(editingCat.name, clean);
      if (res.success) {
        const updated = categories
          .map((c) => (c.name === editingCat.name ? { ...c, name: clean } : c))
          .sort((a, b) => a.name.localeCompare(b.name));
        onCategoriesChange(updated);
        if (onCategorySelect) onCategorySelect(clean);
        toast.success(`Category renamed to "${clean}"`);
        setEditingCat(null);
      } else {
        toast.error(res.error ?? "Failed to rename category");
      }
    } catch {
      toast.error("Failed to rename category");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Category Handler
  const handleDeleteSubmit = async () => {
    if (!deletingCat) return;

    setIsDeleting(true);
    try {
      const res = await deleteCategoryAction(deletingCat.name);
      if (res.success) {
        const updated = categories.filter((c) => c.name !== deletingCat.name);
        onCategoriesChange(updated);
        toast.success(`Category "${deletingCat.name}" deleted`);
        setDeletingCat(null);
      } else {
        toast.error(res.error ?? "Cannot delete category");
      }
    } catch {
      toast.error("Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Main Manage Categories Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="size-4 text-primary" />
                <DialogTitle>Manage Categories</DialogTitle>
              </div>
              {!isAdding && (
                <Button
                  size="sm"
                  onClick={() => setIsAdding(true)}
                  className="h-8 gap-1.5 rounded-xl px-3 text-xs font-bold bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white shadow-xs"
                >
                  <Plus className="size-3.5" />
                  Add Category
                </Button>
              )}
            </div>
            <DialogDescription>
              Categories group your clinical treatments and organize online booking.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            {/* Inline Add Category Form */}
            {isAdding && (
              <form
                onSubmit={handleAddSubmit}
                className="rounded-xl border border-primary/20 bg-primary-soft/20 p-3 space-y-2.5 animate-in fade-in-50"
              >
                <Label htmlFor="add-cat-name" className="text-xs font-bold text-foreground">
                  New Category Name
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="add-cat-name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Facial Aesthetics"
                    autoFocus
                    className="h-8.5 text-xs rounded-xl bg-background"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSavingNew || !newCatName.trim()}
                    className="h-8.5 px-3 text-xs font-bold rounded-xl shrink-0 bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white"
                  >
                    {isSavingNew ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsAdding(false);
                      setNewCatName("");
                    }}
                    className="h-8.5 px-2 rounded-xl shrink-0 text-muted-foreground"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              </form>
            )}

            {/* Inline Edit Category Form */}
            {editingCat && (
              <form
                onSubmit={handleEditSubmit}
                className="rounded-xl border border-primary/30 bg-muted/40 p-3 space-y-2.5 animate-in fade-in-50"
              >
                <Label htmlFor="edit-cat-name" className="text-xs font-bold text-foreground">
                  Rename Category: <span className="text-primary">{editingCat.name}</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="edit-cat-name"
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    placeholder="New category name"
                    autoFocus
                    className="h-8.5 text-xs rounded-xl bg-background"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSavingEdit || !editCatName.trim()}
                    className="h-8.5 px-3 text-xs font-bold rounded-xl shrink-0 bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white"
                  >
                    {isSavingEdit ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingCat(null)}
                    className="h-8.5 px-2 rounded-xl shrink-0 text-muted-foreground"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              </form>
            )}

            {/* Category List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-border/60 rounded-xl border border-border bg-card">
              {categories.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No categories created yet.
                </div>
              ) : (
                categories.map((cat) => (
                  <div
                    key={cat.name}
                    className="flex items-center justify-between p-3 transition-colors hover:bg-muted/20"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="font-heading text-xs font-bold text-foreground truncate">
                        {cat.name}
                      </span>
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-50/80 text-emerald-800 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40 shrink-0">
                        {cat.serviceCount} {cat.serviceCount === 1 ? "service" : "services"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditingCat(cat);
                          setEditCatName(cat.name);
                          setIsAdding(false);
                        }}
                        title={`Rename "${cat.name}"`}
                        className="size-7 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeletingCat(cat)}
                        title={`Delete "${cat.name}"`}
                        className="size-7 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-8.5 rounded-xl text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <Dialog open={!!deletingCat} onOpenChange={(open) => !open && setDeletingCat(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-5 shrink-0" />
              <DialogTitle>Delete category?</DialogTitle>
            </div>
            <DialogDescription>
              {deletingCat && deletingCat.serviceCount > 0 ? (
                <span>
                  This category contains <strong>{deletingCat.serviceCount} active {deletingCat.serviceCount === 1 ? "service" : "services"}</strong>.
                  Please reassign or remove those services before deleting this category.
                </span>
              ) : (
                <span>
                  Are you sure you want to delete category <strong>&ldquo;{deletingCat?.name}&rdquo;</strong>?
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingCat(null)}
              className="h-8.5 rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting || (deletingCat ? deletingCat.serviceCount > 0 : true)}
              onClick={handleDeleteSubmit}
              className="h-8.5 rounded-xl text-xs font-bold"
            >
              {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : "Delete Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
