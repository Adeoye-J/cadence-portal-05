# Design generator

`h2j.py` turns one Stitch design (`code.html`) into a React component that keeps the design's markup and classes, binds
the values that come from data, and swaps in the project's icons, logo placeholder and note dialog.

```
python3 scripts/design/h2j.py <stitch folder>/proposal_review_desktop/code.html \
  components/features/proposal/review-design.tsx ProposalReviewDesign docs/icon-map.md
```

The bindings in `build()` are written for the proposal review screen (texts to replace, repeated blocks to loop, controls
to wire). Another screen needs its own `build()`. `tree.py` is the small HTML tree the generator works on. The Stitch
export is not part of the repository, so keep it next to the project when you regenerate.

A generated file starts with a comment saying so. Edit the generator or the data and regenerate. Hand edits are lost.
