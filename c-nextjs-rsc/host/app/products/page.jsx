import ListingMFE, { parseListingQuery } from 'c-plp';
import Mfe from '../_components/Mfe.jsx';

export const dynamic = 'force-dynamic';

export default async function ListingPage({ searchParams }) {
  const query = parseListingQuery(await searchParams);
  return <Mfe name="plp"><ListingMFE query={query} /></Mfe>;
}
