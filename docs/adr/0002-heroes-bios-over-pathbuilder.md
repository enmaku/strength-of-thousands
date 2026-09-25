# Heroes page shows table-canon bios, not PathBuilder stats

The Heroes page used to derive a combat reference tile from each hero's PathBuilder `build` blob. PathBuilder exports were unreliable, and several players barely maintain sheets there, so the page now shows a short **hero bio** (plus a one-line **tagline**) written from session transcripts and table canon.

**Considered options:** keep fighting PathBuilder sync; show a hybrid (bio + a few key numbers); drop the Heroes page. Rejected the hybrid because stale numbers are worse than no numbers when Prefab already covers combat math.

**Consequences:** Hero identity on the page is editorial (GM-maintained `bio` / `tagline` in hero JSON), not mechanical. Stored PathBuilder `build` blobs may remain for other tools (study level, party analysis) but are not the Heroes-page source of truth. Roster changes are hand-edited JSON, not in-app import.
