import React, {useCallback, useRef, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {PAGE_SCALE, PAGE_WIDTH, WIDTH, theme} from './theme';

export type Marks = {
  docHeight: number;
  sommario: number; // the one-sentence headline
  call: number; // the "Worth a call" box
  callHeight: number;
  /**
   * The acknowledgement box, directly under it. The saved copy of the report
   * strips the form - pressing a button on a page opened from the filesystem
   * has nowhere to write - which is why it was missing from the first cut of
   * this section even though the product has always had it. The filming copy
   * carries the markup the local server actually serves.
   */
  readBottom: number;
  glance: number; // the AT A GLANCE block - the five rows at their three scales
  green: number; // the compacted rows below it, the ones that read fine
  words: number; // her own words, the first <q> in the opened row
  numeri: number; // the counted table
  footer: number; // "not a medical opinion and not advice"
};

/**
 * The real report page, embedded and scrolled. Nothing here is a screenshot:
 * the browser lays the actual HTML out every frame, so the scroll is sub-pixel
 * smooth and the type stays sharp at any scale.
 *
 * Positions are measured from the live document rather than hardcoded, so the
 * camera still lands correctly if the report's layout changes.
 */
export const ReportPage: React.FC<{
  scrollY: number;
  onMeasured: (m: Marks) => void;
}> = ({scrollY, onMeasured}) => {
  const ref = useRef<HTMLIFrameElement>(null);
  const [handle] = useState(() => delayRender('measuring the report layout'));
  const [height, setHeight] = useState(4000);

  const measure = useCallback(() => {
    const doc = ref.current?.contentDocument;
    if (!doc) return;

    // Force the light palette: the report honours prefers-color-scheme, and the
    // film wants it as paper on a dark ground regardless of the render host.
    const force = doc.createElement('style');
    force.textContent = `:root{--ink:#1c1a17;--bg:#f7f4ef;--line:#d8d3cb;--soft:#efece5;
      --accent:#1d6f5c;--basso:#1d6f5c;--medio:#9a6b1f;--alto:#a33028}
      html,body{background:#f7f4ef!important}`;
    doc.head.appendChild(force);

    // The page ships collapsed, which is right for a family reading it on a phone
    // and wrong for film: the narration promises her own words and the counted
    // part, so those two are opened before anything is measured. The other four
    // indicator rows stay shut, which is the point - a quiet week reads quiet.
    const firstRow = doc.querySelector('details.riga') as HTMLDetailsElement | null;
    const counted = doc.querySelector('details.blocco') as HTMLDetailsElement | null;
    if (firstRow) firstRow.open = true;
    if (counted) counted.open = true;

    const top = (el: Element | null) =>
      el ? (el as HTMLElement).getBoundingClientRect().top + (doc.documentElement.scrollTop || 0) : 0;

    const callEl = doc.querySelector('.call');
    const readEl = doc.querySelector('.read, .letto');
    const paras = Array.from(doc.querySelectorAll('p'));
    const disclaimer = paras.find((p) => /not a medical opinion/i.test(p.textContent || ''));
    const docHeight = doc.documentElement.scrollHeight;

    setHeight(docHeight);
    onMeasured({
      docHeight,
      sommario: top(doc.querySelector('.sommario')),
      call: top(callEl),
      callHeight: callEl ? (callEl as HTMLElement).getBoundingClientRect().height : 0,
      readBottom: readEl
        ? top(readEl) + (readEl as HTMLElement).getBoundingClientRect().height
        : top(callEl) + (callEl ? (callEl as HTMLElement).getBoundingClientRect().height : 0),
      glance: top(firstRow),
      green: top(doc.querySelectorAll('details.riga')[1] ?? null),
      words: top(firstRow?.querySelector('q') ?? null),
      numeri: top(doc.querySelector('table.numeri')),
      footer: top(disclaimer ?? paras[paras.length - 1] ?? null),
    });
    continueRender(handle);
  }, [handle, onMeasured]);

  return (
    <div
      style={{
        position: 'absolute',
        left: (WIDTH - PAGE_WIDTH * PAGE_SCALE) / 2,
        top: 0,
        width: PAGE_WIDTH,
        transform: `scale(${PAGE_SCALE}) translateY(${-scrollY}px)`,
        transformOrigin: 'top left',
        boxShadow: '0 0 90px rgba(0,0,0,0.55)',
        background: theme.paper,
      }}
    >
      <iframe
        ref={ref}
        onLoad={measure}
        src={staticFile('report-peggy.html')}
        width={PAGE_WIDTH}
        height={height}
        scrolling="no"
        style={{border: 'none', display: 'block', background: theme.paper}}
      />
    </div>
  );
};
