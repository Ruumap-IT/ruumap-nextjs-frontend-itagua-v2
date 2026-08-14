## Why

`src/providers/AssetPreloadProvider.tsx` mounts a hidden, always-on set of `<Image priority unoptimized>` elements (`alt="preload-cache"`) that includes, today, four unrelated categories in one array: the map snapshot, the contact banner, one image per building floor, **and** the first gallery photo of every amenity and every unit-type family. The last two categories can grow with the size of the project's catalog and are downloaded/decoded on every single page load regardless of whether the visitor ever opens that gallery. This is unnecessary network and memory pressure on mobile/low-memory/Save-Data conditions, and it is safe to remove: the pages that show those galleries (`/departments/[model]`, `/amenities/[model]`) already render them through `ZoomableImage`, which has its own contextual fade/skeleton and does not depend on this preload to avoid a blank or broken state.

Floor plan images are explicitly excluded from this change: `src/components/ui/AssetImage.tsx` documents (and depends on) the fact that floor images arrive already cached from this same provider to avoid re-introducing a previously-fixed fade/flash regression when switching floors in `FloorViewer.tsx`.

## What Changes

- `AssetPreloadProvider` stops adding to its hidden preload set:
  - The first gallery image of the "Amenities" unit type.
  - The first gallery image of each unit-type (model) family.
- `AssetPreloadProvider` continues, unchanged, to preload:
  - `project.map_snapshot`.
  - `project.contact_banner`.
  - Every floor plan image returned by `getAllFloors(project)`.
- No other file changes. No video, navigation, data-fetching, PWA/service-worker, environment-variable, or lint-cleanup work is included.

## Capabilities

### New Capabilities
- `hidden-image-preload`: defines which project images the app is allowed to eagerly preload as hidden, high-priority DOM elements before the user requests them, and which images must instead rely on their own contextual/lazy loading when the corresponding view is opened.

### Modified Capabilities
(none — no existing `openspec/specs/` capabilities exist yet in this repository)

## Impact

- **Affected code**: `src/providers/AssetPreloadProvider.tsx` only.
- **Affected runtime behavior**: fewer hidden `<img alt="preload-cache">` elements mounted on every route; fewer image requests/bytes/decoded pixels during initial load and during the entire session (the provider stays mounted for the app's lifetime via `src/app/layout.tsx`).
- **Not affected**: `AdoptedVideo`, any video component/context, `page.tsx` splash timers, routing/redirects, `ViewTransition`, `ProjectDataProvider`/polling, environment variables, Serwist/service-worker config, `ZoomableImage`, `AssetImage`, `FloorViewer`, `FloorPlanOverlay`.
- **Dependencies**: none on other planned milestones; independently deployable and revertible via a single-file `git revert`.
