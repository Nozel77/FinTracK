"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/src/components/ui/pagination";

type PaginationControlsLocale = "id" | "en";

export type PaginationControlsProps = {
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly onPageChangeAction?: (nextPage: number) => void;
  readonly locale?: PaginationControlsLocale;
  readonly maxVisiblePages?: number;
  readonly className?: string;
};

const COPY: Record<
  PaginationControlsLocale,
  {
    readonly previous: string;
    readonly next: string;
    readonly pageLabel: string;
    readonly showing: string;
    readonly of: string;
  }
> = {
  id: {
    previous: "Sebelumnya",
    next: "Berikutnya",
    pageLabel: "Halaman",
    showing: "Menampilkan",
    of: "dari",
  },
  en: {
    previous: "Previous",
    next: "Next",
    pageLabel: "Page",
    showing: "Showing",
    of: "of",
  },
};

export function PaginationControls({
  page,
  pageSize,
  totalItems,
  onPageChangeAction,
  locale = "id",
  maxVisiblePages = 5,
  className,
}: PaginationControlsProps) {
  const copy = COPY[locale];

  const safePageSize = Math.max(1, Math.floor(pageSize));
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const currentPage = clamp(Math.floor(page), 1, totalPages);

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * safePageSize + 1;
  const endItem =
    totalItems === 0 ? 0 : Math.min(currentPage * safePageSize, totalItems);

  const visiblePages = getVisiblePages(
    currentPage,
    totalPages,
    maxVisiblePages,
  );

  const goToPage = (nextPage: number) => {
    if (!onPageChangeAction) return;
    const target = clamp(nextPage, 1, totalPages);
    if (target === currentPage) return;
    onPageChangeAction(target);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-xs text-muted">
          {copy.showing}{" "}
          <span className="font-semibold text-foreground">{startItem}</span>-
          <span className="font-semibold text-foreground">{endItem}</span>{" "}
          {copy.of}{" "}
          <span className="font-semibold text-foreground">{totalItems}</span>
        </p>

        <p className="text-xs text-muted">
          {copy.pageLabel}{" "}
          <span className="font-semibold text-foreground">{currentPage}</span> /{" "}
          <span className="font-semibold text-foreground">{totalPages}</span>
        </p>
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-disabled={!canGoPrev || !onPageChangeAction}
              className={cn(
                (!canGoPrev || !onPageChangeAction) &&
                  "pointer-events-none opacity-50",
              )}
              onClick={(event) => {
                event.preventDefault();
                goToPage(currentPage - 1);
              }}
            >
              {copy.previous}
            </PaginationPrevious>
          </PaginationItem>

          {visiblePages.map((item, index) =>
            item === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationLink
                  href="#"
                  isActive={item === currentPage}
                  aria-disabled={!onPageChangeAction}
                  className={cn(
                    !onPageChangeAction && "pointer-events-none opacity-50",
                  )}
                  onClick={(event) => {
                    event.preventDefault();
                    goToPage(item);
                  }}
                >
                  {item}
                </PaginationLink>
              </PaginationItem>
            ),
          )}

          <PaginationItem>
            <PaginationNext
              href="#"
              aria-disabled={!canGoNext || !onPageChangeAction}
              className={cn(
                (!canGoNext || !onPageChangeAction) &&
                  "pointer-events-none opacity-50",
              )}
              onClick={(event) => {
                event.preventDefault();
                goToPage(currentPage + 1);
              }}
            >
              {copy.next}
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

type VisiblePage = number | "ellipsis";

function getVisiblePages(
  currentPage: number,
  totalPages: number,
  maxVisiblePages: number,
): ReadonlyArray<VisiblePage> {
  const visible = Math.max(3, Math.floor(maxVisiblePages));

  if (totalPages <= visible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const innerSlots = visible - 2;
  const half = Math.floor(innerSlots / 2);

  let start = currentPage - half;
  let end = start + innerSlots - 1;

  if (start < 2) {
    start = 2;
    end = start + innerSlots - 1;
  }

  if (end > totalPages - 1) {
    end = totalPages - 1;
    start = end - innerSlots + 1;
  }

  const pages: VisiblePage[] = [1];

  if (start > 2) {
    pages.push("ellipsis");
  }

  for (let value = start; value <= end; value += 1) {
    pages.push(value);
  }

  if (end < totalPages - 1) {
    pages.push("ellipsis");
  }

  pages.push(totalPages);

  return pages;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
