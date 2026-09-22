import ListingFilters from './ListingFilters.jsx';
import ProductGrid from './ProductGrid.jsx';
import Pagination from './Pagination.jsx';
import { categoryLabel } from '../format.js';

/** Complete product listing page body, given already-queried results. */
export default function ListingView({ categories, query, result, Link, onNavigate, filtersSlot }) {
  const heading = query.q ? `Results for “${query.q}”` : query.category ? categoryLabel(query.category) : 'All products';
  return (
    <div className="container page">
      <div className="page__head">
        <div>
          <h1 className="page__title">{heading}</h1>
          <p className="muted">{result.total} products</p>
        </div>
        {filtersSlot || (
          <ListingFilters categories={categories} category={query.category} sort={query.sort} q={query.q} onNavigate={onNavigate} />
        )}
      </div>
      <ProductGrid products={result.items} Link={Link} />
      <Pagination page={result.page} totalPages={result.totalPages} query={query} Link={Link} />
    </div>
  );
}
