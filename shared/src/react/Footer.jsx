export default function Footer({ strategy }) {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span>© 2026 ShopMFE, a dissertation benchmark app. Data from FakeStore API.</span>
        {strategy && <span className="footer__badge">Composition: {strategy}</span>}
      </div>
    </footer>
  );
}
