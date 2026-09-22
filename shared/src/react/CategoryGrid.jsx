import { categoryLabel, listingHref } from '../format.js';

export default function CategoryGrid({ categories, Link }) {
  return (
    <section className="section">
      <h2 className="section__title">Shop by category</h2>
      <div className="categories">
        {categories.map((c) => (
          <Link key={c} href={listingHref({ category: c })} className={`category category--${c.replace(/[^a-z]/g, '')}`}>
            <span>{categoryLabel(c)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
