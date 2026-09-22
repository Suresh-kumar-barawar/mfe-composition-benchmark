import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ListingView, ProductGridSkeleton } from '@mfe/shared/react';
import { getCategories, getListingProducts, queryProducts } from '@mfe/shared/api';
import Link from '../../common/RouterLink.jsx';

export default function ListingPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const query = {
    category: params.get('category') || '',
    q: params.get('q') || '',
    sort: params.get('sort') || '',
    page: Number(params.get('page')) || 1,
  };

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  // FakeStore has no search/sort/paging: fetch the category once, then query in the browser.
  useEffect(() => {
    let alive = true;
    setProducts(null);
    getListingProducts(query.category)
      .then((p) => alive && setProducts(p))
      .catch((e) => alive && setError(e));
    return () => { alive = false; };
  }, [query.category]);

  if (error) return <div className="container page"><p className="error">Could not load products.</p></div>;
  if (!products)
    return (
      <div className="container page">
        <div className="page__head"><h1 className="page__title">Products</h1></div>
        <ProductGridSkeleton />
      </div>
    );

  return (
    <ListingView
      categories={categories}
      query={query}
      result={queryProducts(products, query)}
      Link={Link}
      onNavigate={(url) => navigate(url)}
    />
  );
}
