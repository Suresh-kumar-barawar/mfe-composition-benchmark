import DetailMFE from 'c-pdp';
import Mfe from '../../_components/Mfe.jsx';

export const dynamic = 'force-dynamic';

export default async function DetailPage({ params }) {
  const { id } = await params;
  return <Mfe name="pdp"><DetailMFE id={id} /></Mfe>;
}
