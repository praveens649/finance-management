"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus, Loader2, Tags } from "lucide-react"
import { Category, CategoryTypeEnum } from "../../../../models/schemas/categories.schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { createUserCategoryAction } from "../_actions/category.actions"

interface CategoryManagerProps {
  categories: Category[]
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState("")
  const [type, setType] = useState<(typeof CategoryTypeEnum.options)[number]>("expense")

  const sortedCategories = useMemo(
    () => [...categories].sort((left, right) => left.type.localeCompare(right.type) || left.name.localeCompare(right.name)),
    [categories]
  )

  function resetForm() {
    setName("")
    setType("expense")
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!name.trim()) {
      toast.error("Please enter a category name")
      return
    }

    startTransition(async () => {
      const result = await createUserCategoryAction({
        name: name.trim(),
        type,
      })

      if (!result.success) {
        toast.error(result.error ?? "Failed to create category")
        return
      }

      toast.success("Category created")
      resetForm()
    })
  }

  return (
    <section className="rounded-3xl border border-white/5 bg-background/50 p-6 shadow-2xl backdrop-blur-xl md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Organize
          </p>
          <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
          <p className="text-sm text-muted-foreground">
            Create expense and income categories so your self transactions can be tagged correctly.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/10 px-4 py-2 text-sm text-muted-foreground">
          <Tags className="h-4 w-4" />
          {categories.length} total
        </div>
      </div>

      <Separator className="my-6 bg-white/10" />

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="category-name">Category name</Label>
          <Input
            id="category-name"
            placeholder="e.g. Groceries, Salary"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isPending}
            className="h-12 bg-background/60"
          />
        </div>

        <div className="space-y-2">
          <Label>Type</Label>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 p-1">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`h-11 rounded-lg text-sm font-medium transition-colors ${type === "expense"
                ? "bg-rose-500/15 text-rose-900"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              disabled={isPending}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`h-11 rounded-lg text-sm font-medium transition-colors ${type === "income"
                ? "bg-emerald-500/15 text-emerald-900"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              disabled={isPending}
            >
              Income
            </button>
          </div>
        </div>

        <div className="md:col-span-3 flex justify-end">
          <Button type="submit" className="h-12 px-6" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Add category
          </Button>
        </div>
      </form>

      <div className="mt-8 grid gap-3 md:grid-cols-2">
        {sortedCategories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-muted-foreground md:col-span-2">
            No categories yet. Add your first income or expense category above.
          </div>
        ) : (
          sortedCategories.map((category) => (
            <div
              key={category.id}
              className="rounded-2xl border border-white/5 bg-black/10 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{category.type}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${category.type === "income"
                    ? "bg-emerald-500/15 text-emerald-900"
                    : "bg-rose-500/15 text-rose-900"
                    }`}
                >
                  {category.type}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}