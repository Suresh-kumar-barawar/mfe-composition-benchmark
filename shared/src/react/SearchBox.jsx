'use client';

/** Works as a plain GET form; if onSearch is given, it is used for client-side navigation. */
export default function SearchBox({ onSearch, defaultValue = '' }) {
  const submit = (e) => {
    if (!onSearch) return;
    e.preventDefault();
    const q = new FormData(e.currentTarget).get('q')?.toString().trim() || '';
    onSearch(q);
  };
  return (
    <form className="search" action="/products" method="get" role="search" onSubmit={submit}>
      <input type="search" name="q" placeholder="Search products" defaultValue={defaultValue} aria-label="Search products" />
      <button type="submit" className="btn btn--small">Search</button>
    </form>
  );
}
