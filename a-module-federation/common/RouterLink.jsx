import { Link } from 'react-router-dom';

/** Adapter so shared components can use `href` with React Router's client-side navigation. */
export default function RouterLink({ href, ...rest }) {
  return <Link to={href} {...rest} />;
}
