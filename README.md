# PPI & DPI Calculator

Two tools:

**Screen PPI** — enter a screen's resolution (width × height in pixels) and its diagonal in
inches, or pick a common device. Get:

- **Pixels per inch** — `√(w² + h²) / diagonal`
- **Dot pitch** (mm), **megapixels**, **aspect ratio**
- Physical screen size in inches and cm
- **"Retina" distance** — beyond this a 20/20 eye can't resolve individual pixels
  (`pixel size ÷ one arc-minute`)

**Print DPI** — three modes:

- *Image → print size*: pixel dimensions ÷ DPI → inches / cm
- *Size → pixels needed*: printed size × DPI → pixel dimensions
- *Find the DPI*: pixels ÷ printed size → effective DPI

Each print result gets a quality badge (excellent ≥ 300, good ≥ 200, acceptable ≥ 150, low
below).

## Stack

React 18 + TypeScript + Vite, no runtime dependencies beyond React. Logic is in the pure module
`src/density.ts`. Tests:

```
node --experimental-strip-types src/density.test.mjs
```

Static build, deployed to Cloudflare Workers. A web page can't read your monitor's physical
size, so the diagonal is entered by hand.
