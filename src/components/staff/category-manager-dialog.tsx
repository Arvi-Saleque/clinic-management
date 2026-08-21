"use client";

import * as React from "react";
import { AlertCircle, Check, Layers, Loader2, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
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
        <DialogContent className="sm:max-w-md rounded-3xl p-6 space-y-4">
          <DialogHeader className="border-b border-border/60 pb-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-2xl bg-gradient-to-br from-[#0B3B36] to-[#075e5a] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Layers className="size-4.5" />
                </div>
                <DialogTitle className="font-heading text-lg font-black text-foreground">
                  Manage Sections
                </DialogTitle>
              </div>
              {!isAdding && (
                <Button
                  size="sm"
                  onClick={() => setIsAdding(true)}
                  className="h-8.5 gap-1.5 rounded-2xl px-3.5 text-xs font-black bg-[#0B3B36] hover:bg-[#075e5a] text-white shadow-2xs cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  Add Section
                </Button>
              )}
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Categories group clinical treatments and organize online patient booking steps.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            {/* Inline Add Category Form */}
            {isAdding && (
              <form
                onSubmit={handleAddSubmit}
                className="rounded-2xl border border-primary/25 bg-primary/5 p-3.5 space-y-2.5 animate-in fade-in-50"
              >
                <Label htmlFor="add-cat-name" className="text-xs font-bold text-foreground">
                  New Section Name
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="add-cat-name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Cosmetic & Whitening"
                    autoFocus
                    className="h-9 text-xs rounded-xl bg-card border-border/80"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSavingNew || !newCatName.trim()}
                    className="h-9 px-3.5 text-xs font-black rounded-xl shrink-0 bg-[#0B3B36] hover:bg-[#075e5a] text-white cursor-pointer"
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
                    className="h-9 px-2 rounded-xl shrink-0 text-muted-foreground cursor-pointer"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* Inline Edit Category Form */}
            {editingCat && (
              <form
                onSubmit={handleEditSubmit}
                className="rounded-2xl border border-primary/30 bg-muted/40 p-3.5 space-y-2.5 animate-in fade-in-50"
              >
                <Label htmlFor="edit-cat-name" className="text-xs font-bold text-foreground">
                  Rename Section: <span className="text-primary font-black">{editingCat.name}</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="edit-cat-name"
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    placeholder="New section name"
                    autoFocus
                    className="h-9 text-xs rounded-xl bg-card border-border/80"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSavingEdit || !editCatName.trim()}
                    className="h-9 px-3.5 text-xs font-black rounded-xl shrink-0 bg-[#0B3B36] hover:bg-[#075e5a] text-white cursor-pointer"
                  >
                    {isSavingEdit ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingCat(null)}
                    className="h-9 px-2 rounded-xl shrink-0 text-muted-foreground cursor-pointer"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* Category List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-border/60 rounded-2xl border border-border/80 bg-card/90">
              {categories.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground font-medium">
                  No sections created yet.
                </div>
              ) : (
                categories.map((cat) => (
                  <div
                    key={cat.name}
                    className="flex items-center justify-between p-3.5 transition-colors hover:bg-muted/20"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="font-heading text-xs font-black text-foreground truncate">
                        {cat.name}
                      </span>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 shrink-0">
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
                        className="size-8 rounded-xl text-muted-foreground hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeletingCat(cat)}
                        title={`Delete "${cat.name}"`}
                        className="size-8 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-border/60 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-2xl px-4 text-xs font-bold border-border/80 cursor-pointer"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <Dialog open={!!deletingCat} onOpenChange={(open) => !open && setDeletingCat(null)}>
        <DialogContent className="sm:max-w-sm rounded-3xl p-6 space-y-3">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-5 shrink-0" />
              <DialogTitle className="font-heading text-base font-black">Delete section?</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {deletingCat && deletingCat.serviceCount > 0 ? (
                <span>
                  This section contains <strong>{deletingCat.serviceCount} active {deletingCat.serviceCount === 1 ? "service" : "services"}</strong>.
                  Please reassign or remove those services before deleting this section.
                </span>
              ) : (
                <span>
                  Are you sure you want to delete section <strong>&ldquo;{deletingCat?.name}&rdquo;</strong>?
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="border-t border-border/60 pt-3 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingCat(null)}
              className="h-9 rounded-2xl px-4 text-xs font-bold border-border/80"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting || (deletingCat ? deletingCat.serviceCount > 0 : true)}
              onClick={handleDeleteSubmit}
              className="h-9 rounded-2xl px-4 text-xs font-bold"
            >
              {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : "Delete Section"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
