# GM mode on localhost, player mode when deployed

The campaign app splits behavior by hostname: `localhost` or `127.0.0.1` (any port) is **GM mode** — editable campaign state, GM prep links on the index, JSON written to the repo on change. Any other host (notably GitHub Pages) is **player mode** — read-only campaign state, campaign tools only on the index.

We chose hostname detection over explicit login, role flags, or env-var toggles because only the GM runs the Quasar dev server locally; players use the deployed build. Publishing is git: the GM commits and pushes hero JSON; players see updates after deploy. Trust model: convention that players do not run the dev server locally.

**Considered options:** env-var or build-time `GM_MODE` flag; separate GM deploy; auth-backed roles. Rejected as unnecessary for a single-GM table tool where the dev server already implies GM intent.

**Consequences:** A player who runs `quasar dev` locally gets GM powers — acceptable by convention. All campaign tools must respect the same mode check. GM-only surfaces (prep lessons, heart editing, add-hero) gate on hostname, not on a user identity.
