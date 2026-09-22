/** Pure header layout. Search box and cart badge are slots so each implementation wires navigation its own way. */
export default function HeaderView({ Link, searchSlot, cartSlot }) {
  return (
    <header className="header">
      <div className="container header__inner">
        <Link href="/" className="logo">ShopMFE</Link>
        <nav className="nav" aria-label="Main">
          <Link href="/">Home</Link>
          <Link href="/products">Shop</Link>
        </nav>
        <div className="header__search">{searchSlot}</div>
        <div className="header__cart">{cartSlot}</div>
      </div>
    </header>
  );
}
