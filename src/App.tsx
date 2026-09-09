import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  decodeState,
  encodeState,
  LengthUnit,
  PRESETS,
  PrintMode,
  printCalc,
  screenDensity,
} from './density.ts';

type Tab = 'screen' | 'print';

const fmt = (n: number, dp = 1) => (Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: dp, minimumFractionDigits: 0 }) : '—');

const QUALITY_LABEL: Record<string, string> = {
  excellent: 'Excellent — photo quality (≥ 300 DPI)',
  good: 'Good — fine for most prints (200–299 DPI)',
  acceptable: 'Acceptable — OK at arm’s length (150–199 DPI)',
  low: 'Low — visibly soft up close (< 150 DPI)',
};

export default function App() {
  const [tab, setTab] = useState<Tab>('screen');

  // screen
  const [w, setW] = useState('2560');
  const [h, setH] = useState('1440');
  const [diag, setDiag] = useState('27');

  // print
  const [mode, setMode] = useState<PrintMode>('toSize');
  const [unit, setUnit] = useState<LengthUnit>('in');
  const [pxW, setPxW] = useState('6000');
  const [pxH, setPxH] = useState('4000');
  const [lenW, setLenW] = useState('8');
  const [lenH, setLenH] = useState('10');
  const [dpi, setDpi] = useState('300');

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const s = decodeState(window.location.search);
    if (!s) return;
    if (s.t === 'print') setTab('print');
    if (s.w) setW(s.w);
    if (s.h) setH(s.h);
    if (s.d) setDiag(s.d);
  }, []);

  const screen = useMemo(() => screenDensity(Number(w), Number(h), Number(diag)), [w, h, diag]);

  const print = useMemo(
    () =>
      printCalc({
        mode,
        unit,
        widthPx: Number(pxW),
        heightPx: Number(pxH),
        widthLen: Number(lenW),
        heightLen: Number(lenH),
        dpi: Number(dpi),
      }),
    [mode, unit, pxW, pxH, lenW, lenH, dpi],
  );

  const share = useCallback(() => {
    const qs = encodeState({ t: 'screen', w, h, d: diag });
    window.history.replaceState(null, '', `?${qs}`);
    navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}?${qs}`).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {},
    );
  }, [w, h, diag]);

  const U = unit === 'in' ? 'in' : 'cm';

  return (
    <div className="wrap">
      <header>
        <h1>PPI &amp; DPI Calculator</h1>
        <p className="sub">
          Pixels per inch for a screen from its resolution and diagonal, and the pixel-count ⇄
          print-size ⇄ DPI conversions for printing an image.
        </p>
      </header>

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'screen'} className={tab === 'screen' ? 'on' : ''} onClick={() => setTab('screen')}>
          Screen PPI
        </button>
        <button role="tab" aria-selected={tab === 'print'} className={tab === 'print' ? 'on' : ''} onClick={() => setTab('print')}>
          Print DPI
        </button>
      </div>

      {tab === 'screen' && (
        <>
          <section className="card">
            <label className="field">
              <span>Pick a common device (optional)</span>
              <select
                value=""
                onChange={(e) => {
                  const p = PRESETS[Number(e.target.value)];
                  if (p) {
                    setW(String(p.w));
                    setH(String(p.h));
                    setDiag(String(p.diag));
                  }
                }}
              >
                <option value="">—</option>
                {PRESETS.map((p, i) => (
                  <option key={p.name} value={i}>{p.name}</option>
                ))}
              </select>
            </label>
            <div className="grid3">
              <label className="field">
                <span>Width (px)</span>
                <input inputMode="numeric" value={w} onChange={(e) => setW(e.target.value)} />
              </label>
              <label className="field">
                <span>Height (px)</span>
                <input inputMode="numeric" value={h} onChange={(e) => setH(e.target.value)} />
              </label>
              <label className="field">
                <span>Diagonal (in)</span>
                <input inputMode="decimal" value={diag} onChange={(e) => setDiag(e.target.value)} />
              </label>
            </div>
          </section>

          {screen.ok ? (
            <section className="card out">
              <div className="big">
                <span>Pixel density</span>
                <b>{fmt(screen.ppi)} <small>PPI</small></b>
              </div>
              <div className="og">
                <div><span>Dot pitch</span><b>{fmt(screen.dotPitchMm, 4)} mm</b></div>
                <div><span>Resolution</span><b>{fmt(screen.megapixels, 2)} MP</b></div>
                <div><span>Aspect ratio</span><b>{screen.aspect}</b></div>
                <div><span>Screen size</span><b>{fmt(screen.widthIn, 1)}″ × {fmt(screen.heightIn, 1)}″</b></div>
                <div><span>Screen size</span><b>{fmt(screen.widthCm, 1)} × {fmt(screen.heightCm, 1)} cm</b></div>
                <div><span>"Retina" distance</span><b>{fmt(screen.retinaDistanceCm, 0)} cm / {fmt(screen.retinaDistanceIn, 1)}″</b></div>
              </div>
              <p className="note">
                Beyond about <b>{fmt(screen.retinaDistanceCm, 0)} cm</b> a person with 20/20 vision
                can no longer pick out individual pixels on this display.
              </p>
              <button className="ghost" onClick={share}>{copied ? 'Link copied' : 'Share this'}</button>
            </section>
          ) : (
            <p className="warn">{screen.error}</p>
          )}
        </>
      )}

      {tab === 'print' && (
        <>
          <section className="card">
            <div className="seg">
              <button className={mode === 'toSize' ? 'on' : ''} onClick={() => setMode('toSize')}>Image → print size</button>
              <button className={mode === 'toPixels' ? 'on' : ''} onClick={() => setMode('toPixels')}>Size → pixels needed</button>
              <button className={mode === 'toDpi' ? 'on' : ''} onClick={() => setMode('toDpi')}>Find the DPI</button>
            </div>
            <div className="seg small">
              <button className={unit === 'in' ? 'on' : ''} onClick={() => setUnit('in')}>inches</button>
              <button className={unit === 'cm' ? 'on' : ''} onClick={() => setUnit('cm')}>cm</button>
            </div>

            <div className="grid3">
              {(mode === 'toSize' || mode === 'toDpi') && (
                <label className="field">
                  <span>Image width (px)</span>
                  <input inputMode="numeric" value={pxW} onChange={(e) => setPxW(e.target.value)} />
                </label>
              )}
              {mode === 'toSize' && (
                <label className="field">
                  <span>Image height (px)</span>
                  <input inputMode="numeric" value={pxH} onChange={(e) => setPxH(e.target.value)} />
                </label>
              )}
              {(mode === 'toPixels' || mode === 'toDpi') && (
                <label className="field">
                  <span>Printed width ({U})</span>
                  <input inputMode="decimal" value={lenW} onChange={(e) => setLenW(e.target.value)} />
                </label>
              )}
              {mode === 'toPixels' && (
                <label className="field">
                  <span>Printed height ({U})</span>
                  <input inputMode="decimal" value={lenH} onChange={(e) => setLenH(e.target.value)} />
                </label>
              )}
              {mode !== 'toDpi' && (
                <label className="field">
                  <span>Resolution (DPI)</span>
                  <input inputMode="numeric" value={dpi} onChange={(e) => setDpi(e.target.value)} />
                </label>
              )}
            </div>
          </section>

          {print.ok ? (
            <section className="card out">
              {mode === 'toSize' && (
                <div className="big">
                  <span>Prints at</span>
                  <b>{fmt(print.widthOut!, 2)} × {fmt(print.heightOut!, 2)} {U}</b>
                </div>
              )}
              {mode === 'toPixels' && (
                <div className="big">
                  <span>You need</span>
                  <b>{fmt(print.widthPx!, 0)} × {fmt(print.heightPx!, 0)} px</b>
                </div>
              )}
              {mode === 'toDpi' && (
                <div className="big">
                  <span>Effective resolution</span>
                  <b>{fmt(print.dpi!, 0)} <small>DPI</small></b>
                </div>
              )}
              <p className={`quality q-${print.quality}`}>{QUALITY_LABEL[print.quality!]}</p>
            </section>
          ) : (
            <p className="warn">{print.error}</p>
          )}
        </>
      )}

      <section className="explainer">
        <h2>PPI, DPI and pixel density</h2>
        <p>
          <b>PPI</b> (pixels per inch) describes a <i>screen</i>: how tightly its pixels are
          packed. It's the screen's diagonal in pixels — <code>√(width² + height²)</code> — divided
          by its diagonal in inches. <b>DPI</b> (dots per inch) is the same idea for a <i>printer</i>
          or a printed image. The terms are used interchangeably in everyday language.
        </p>
        <h3>Why it matters for a screen</h3>
        <p>
          Higher PPI means text and images look sharper. Apple's "Retina" marketing refers to a
          density high enough that, at a normal viewing distance, you can't resolve individual
          pixels — roughly 220 PPI for a laptop held at 50 cm, or 300+ PPI for a phone at 30 cm.
        </p>
        <h3>Why it matters for printing</h3>
        <p>
          A photo lab wants about <b>300 DPI</b> for prints you'll hold. Divide your image's pixel
          dimensions by 300 to see the largest size it prints well. Big wall prints and posters,
          viewed from further away, are fine at 150 DPI or even less.
        </p>
        <h3>Nothing is measured automatically</h3>
        <p>
          A web page can't read your monitor's physical size, so enter the diagonal from the
          spec sheet. Everything is calculated in your browser.
        </p>
        <footer>PPI &amp; DPI Calculator · works offline · no tracking</footer>
      </section>
    </div>
  );
}
