## Purpose

Defines which project images the application is allowed to eagerly preload as hidden, high-priority elements before the user requests them, so that only images with a demonstrated navigation-continuity need are preloaded up front, while every other image relies on the view's own contextual loading behavior.

## ADDED Requirements

### Requirement: Hidden preload set is limited to navigation-continuity assets
The system SHALL restrict the hidden, always-mounted image preload set to only: the project map snapshot, the project contact banner, and every floor plan image available for the project. The system SHALL NOT include in this hidden preload set the first gallery image of the "Amenities" unit type, nor the first gallery image of any other unit-type (model) family.

#### Scenario: Floor plans, map snapshot, and contact banner remain preloaded
- **WHEN** the hidden asset preload mechanism mounts for a loaded project
- **THEN** a hidden preloaded image is present for the map snapshot, for the contact banner, and for every floor image available for the project

#### Scenario: Amenity and model gallery cover photos are not preloaded
- **WHEN** the hidden asset preload mechanism mounts for a loaded project
- **THEN** no hidden preloaded image is present for the first gallery photo of the "Amenities" unit type or for the first gallery photo of any other unit-type/model family

### Requirement: Removing amenity/model preload does not degrade gallery loading
Views that display a unit-type or amenity gallery for the first time in a session SHALL continue to render that gallery through their existing contextual loading behavior (fade/skeleton), independent of whether the shown image was previously preloaded by the hidden preload set.

#### Scenario: First visit to a never-before-preloaded model gallery
- **WHEN** a user opens a department (unit-type) detail view whose gallery cover photo was never preloaded in the current session
- **THEN** the gallery image loads and reveals using the view's existing fade/skeleton behavior, and the view never shows a blank, white, or black screen in place of the image

#### Scenario: First visit to a never-before-preloaded amenity gallery
- **WHEN** a user opens an amenity detail view whose gallery cover photo was never preloaded in the current session
- **THEN** the gallery image loads and reveals using the view's existing fade/skeleton behavior, and the view never shows a blank, white, or black screen in place of the image

### Requirement: Floor plan continuity is preserved
Switching between floor plans SHALL continue to render the target floor's image without reintroducing a fade or loading delay for floors already covered by the hidden preload set.

#### Scenario: Repeated floor switching
- **WHEN** a user switches between floor plans belonging to the project's floor list
- **THEN** each floor image appears without the fade/loading transition that only occurs for images not yet present in the browser cache

### Requirement: Individual image failures do not block the experience
A failure or absence of any single preloaded or contextually-loaded image SHALL NOT block navigation, rendering of other content, or interaction with the rest of the showroom.

#### Scenario: One hidden-preloaded image fails to load
- **WHEN** one of the hidden preloaded images (map snapshot, contact banner, or a floor image) fails to load
- **THEN** the rest of the application continues to function normally and no blocking error is surfaced to the user
