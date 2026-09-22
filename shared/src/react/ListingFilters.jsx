'use client';
import { categoryLabel, SORT_OPTIONS, listingHref } from '../format.js';

/** Category + sort controls. Calls onNavigate(url) for client-side routing, else full navigation. */
export default function ListingFilters({ categories, category = '', sort = '', q = '', onNavigate }) {
  const go = (next) => {
    const url = listingHref({ category, sort, q, ...next, page: 1 });
    if (onNavigate) onNavigate(url);
    else window.location.assign(url);
  };
  return (
    <div className="filters">
      <label className="field">
        <span>Category</span>
        <select value={category} onChange={(e) => go({ category: e.target.value })}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{categoryLabel(c)}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Sort by</span>
        <select value={sort} onChange={(e) => go({ sort: e.target.value })}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
