import { navigateToUrl } from 'single-spa';

/** Adapter so shared components can use `href` with Single-SPA's cross-app navigation. */
export default function Link({ href, onClick, ...rest }) {
  const handle = (e) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    navigateToUrl(e); // pushState; Single-SPA then mounts/unmounts the right apps
  };
  return <a href={href} {...rest} onClick={handle} />;
}
