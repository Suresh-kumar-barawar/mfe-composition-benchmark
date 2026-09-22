export default function Hero({ Link }) {
  return (
    <section className="hero">
      <div className="hero__content">
        <p className="hero__eyebrow">New season collection</p>
        <h1 className="hero__title">Everyday essentials, delivered fast.</h1>
        <p className="hero__text">Electronics, jewellery and clothing from trusted brands, with free delivery on orders over $100.</p>
        <Link href="/products" className="btn btn--light">Shop all products</Link>
      </div>
    </section>
  );
}
