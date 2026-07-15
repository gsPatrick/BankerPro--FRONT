'use client';

import styles from './Pagination.module.css';

const DEFAULT_PAGE_SIZES = [5, 10, 15, 20, 25];

/**
 * Molecule: Pagination
 * Footer controls for page size + page navigation.
 */
export default function Pagination({
  page = 1,
  pageSize = 10,
  totalItems = 0,
  pageSizes = DEFAULT_PAGE_SIZES,
  onPageChange,
  onPageSizeChange,
  className = '',
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <div className={[styles.bar, className].filter(Boolean).join(' ')}>
      <label className={styles.sizeControl}>
        <span className={styles.label}>Por página</span>
        <select
          className={styles.select}
          value={pageSize}
          onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
          aria-label="Itens por página"
        >
          {pageSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <p className={styles.range}>
        {from}–{to} de {totalItems}
      </p>

      <div className={styles.nav}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => onPageChange?.(1)}
          disabled={!canPrev}
          aria-label="Primeira página"
        >
          «
        </button>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => onPageChange?.(currentPage - 1)}
          disabled={!canPrev}
          aria-label="Página anterior"
        >
          ‹
        </button>
        <span className={styles.pageInfo}>
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => onPageChange?.(currentPage + 1)}
          disabled={!canNext}
          aria-label="Próxima página"
        >
          ›
        </button>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => onPageChange?.(totalPages)}
          disabled={!canNext}
          aria-label="Última página"
        >
          »
        </button>
      </div>
    </div>
  );
}
