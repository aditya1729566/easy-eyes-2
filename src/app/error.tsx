'use client';

import { useEffect } from 'react';

export default function ErrorPage({error,reset}:{error:Error & {digest?:string};reset:()=>void}) {
  useEffect(()=>{console.error(error);},[error]);
  return <div className="page-shell status-page"><p className="eyebrow">Easy Eyes / Interruption</p><h1 className="page-title">A moment, please.</h1><p>Something went wrong while loading this view. Try again.</p><button className="button-dark" onClick={reset}>Try again</button></div>;
}
