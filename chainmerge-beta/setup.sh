#!/bin/bash
echo "=== Step 1: Renaming chaincodec -> chainmerge ==="

FILES=(
  "packages/api/index.js"
  "packages/frontend/src/App.jsx"
  "packages/frontend/src/index.css"
  "packages/frontend/src/pages/DecoderPage.jsx"
  "packages/frontend/src/pages/ChainViewPage.jsx"
  "packages/frontend/src/pages/ChainIndexPage.jsx"
  "packages/frontend/src/pages/DocsPage.jsx"
  "packages/frontend/src/components/ChainSelector.jsx"
  "packages/frontend/src/components/HashInput.jsx"
  "packages/frontend/src/components/OutputViewer.jsx"
  "packages/frontend/index.html"
  "packages/frontend/package.json"
  "packages/frontend/vite.config.js"
)

for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    sed -i 's/chaincodec/chainmerge/g' "$f"
    sed -i 's/ChainCodec/ChainMerge/g' "$f"
    sed -i 's/CHAINCODEC/CHAINMERGE/g' "$f"
    echo "  done: $f"
  else
    echo "  skipped: $f"
  fi
done

find packages/core-rust -name "*.rs" -o -name "Cargo.toml" 2>/dev/null | while read f; do
  sed -i 's/chaincodec/chainmerge/g' "$f"
  sed -i 's/ChainCodec/ChainMerge/g' "$f"
  echo "  done: $f"
done

echo ""
echo "=== Step 2: Removing defi-dashboard + sdk from monorepo ==="
rm -rf packages/defi-dashboard && echo "  removed packages/defi-dashboard"
rm -rf packages/sdk && echo "  removed packages/sdk"

echo ""
echo "=== Step 3: Commit and push ==="
git add -A
git commit -m "refactor: rename chaincodec to chainmerge, remove defi-dashboard and sdk"
git push origin phase-5/sdk-and-demo

echo ""
echo "Done! Now create the standalone defi-dashboard repo."
