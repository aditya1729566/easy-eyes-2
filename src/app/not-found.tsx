import Link from 'next/link';

export default function NotFound() {
  return <div className="page-shell status-page"><p className="eyebrow">Easy Eyes / 404</p><h1 className="page-title">Out of frame.</h1><p>We could not find this page.</p><Link className="line-link" href="/shop">Explore the frames →</Link></div>;
}
