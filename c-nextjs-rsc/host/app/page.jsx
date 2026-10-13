import HomeMFE from 'c-home';
import Mfe from './_components/Mfe.jsx';

// Render on every request with fresh data (no static prerendering), like A and B.
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return <Mfe name="home"><HomeMFE /></Mfe>;
}
