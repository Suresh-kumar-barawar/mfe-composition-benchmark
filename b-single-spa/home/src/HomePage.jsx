import { useEffect, useState } from 'react';
import { Hero, Carousel, ProductCard, CategoryGrid } from '@mfe/shared/react';
import { getFeatured, getCategories } from '@mfe/shared/api';
import Link from '../../common/Link.jsx';

export default function HomePage() {
  const [featured, setFeatured] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all([getFeatured(8), getCategories()])
      .then(([f, c]) => alive && (setFeatured(f), setCategories(c)))
      .catch((e) => alive && setError(e));
    return () => { alive = false; };
  }, []);

  return (
    <>
      <Hero Link={Link} />
      <Carousel title="Featured products">
        {error && <p className="error">Could not load products.</p>}
        {featured
          ? featured.map((p, i) => <ProductCard key={p.id} product={p} Link={Link} priority={i < 4} />)
          : !error && Array.from({ length: 4 }, (_, i) => <div key={i} className="card card--skeleton" />)}
      </Carousel>
      <CategoryGrid categories={categories} Link={Link} />
    </>
  );
}
