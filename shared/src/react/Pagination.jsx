import { listingHref } from '../format.js';

export default function Pagination({ page, totalPages, query, Link }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <nav className="pagination" aria-label="Pagination">
      {page > 1 && <Link href={listingHref({ ...query, page: page - 1 })}>‹ Prev</Link>}
      {pages.map((n) =>
        n === page ? (
          <span key={n} className="pagination__current" aria-current="page">{n}</span>
        ) : (
          <Link key={n} href={listingHref({ ...query, page: n })}>{n}</Link>
        )
      )}
      {page < totalPages && <Link href={listingHref({ ...query, page: page + 1 })}>Next ›</Link>}
    </nav>
  );
}
