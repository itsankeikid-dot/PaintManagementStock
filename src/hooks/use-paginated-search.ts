import { useState } from "react";

interface UsePaginatedSearchOptions<T> {
  items: T[];
  pageSize?: number;
  /** Returns true if `item` matches the active filters (search term, status, etc.). */
  filterFn: (item: T) => boolean;
}

interface UsePaginatedSearchResult<T> {
  /** All items passing `filterFn`, before pagination. */
  filtered: T[];
  /** Current page slice of `filtered`. */
  paginated: T[];
  /** Clamped current page (never exceeds `totalPages`). */
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  /** "1–10 dari 42" label, or undefined when empty. */
  rangeLabel: string | undefined;
}

/**
 * Filter + paginate a list with auto page-clamping.
 *
 * Pairs with the shared <Pagination> component:
 *   <Pagination currentPage={page} totalPages={totalPages}
 *               onPageChange={setPage} rangeLabel={rangeLabel} />
 *
 * Reset to page 1 yourself when filter inputs change (e.g. in the search
 * onChange), since the hook can't observe arbitrary filter state.
 */
export function usePaginatedSearch<T>({
  items,
  pageSize = 10,
  filterFn,
}: UsePaginatedSearchOptions<T>): UsePaginatedSearchResult<T> {
  const [page, setPage] = useState(1);

  const filtered = items.filter(filterFn);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  if (safePage !== page) setPage(safePage);

  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const rangeLabel =
    filtered.length > 0
      ? `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} dari ${filtered.length}`
      : undefined;

  return { filtered, paginated, page: safePage, totalPages, setPage, rangeLabel };
}
