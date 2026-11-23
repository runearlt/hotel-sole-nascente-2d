# Lake Garda realism update — 23 November 2026

The current learning modules, numerical evidence, actor disclosure rules, saved-work schema, workbook validation and progression are unchanged. The changes are confined to rendering, materials, character geometry and environmental dressing.

Added self-hosted photographic diffuse, OpenGL normal and roughness maps for terrain, asphalt, wood and roof tiles. Sources (Poly Haven, CC0):
- https://polyhaven.com/a/aerial_grass_rock
- https://polyhaven.com/a/asphalt_02
- https://polyhaven.com/a/wood_floor_deck
- https://polyhaven.com/a/roof_tiles_14
- Licence: https://polyhaven.com/license

Maps were downloaded from Poly Haven's official dl.polyhaven.org CDN, resized from 1K to 512px WebP, embedded in realism-surfaces.js, and decoded before the playable scene is marked ready. No external asset requests are made at runtime. Existing plaster/paving maps and Three.js licences remain as documented in GARDA_SCENE_PLAN.md.

Original code-authored geometry supplies adult figures with knee/elbow pivots, smaller anatomical features, differentiated clothing, hair, collars and role details; veined grapevine leaf cutouts; shoreline coping and rocks; grasses/lavender; village infill; and additional interior details. Clearer blue daylight, a softly clouded sky, higher-resolution desktop shadows and reflective blue-green water replace the former yellow-grey appearance. All buildings retain their existing detailed façades and shared collision routes.

This release improves realism but does not achieve GTA V photorealism. Characters remain procedural articulated models, not scanned humans or production facial rigs. Trees remain layered foliage cards, distant buildings simplified geometry, and interiors architectural cutaways. A future production-asset pass would be needed for film-quality human faces, bespoke photogrammetric vegetation and detailed interiors throughout the distant village. No Rockstar assets are used.

Desktop uses 2048px shadows; mobile keeps reduced foliage, pixel ratio and shadows. WebGL2 is required for graphics; the workbook and direct location controls remain available without it. Existing automated tests cover desktop/phone rendering, camera clearance, navigation, saved work and student progression. Actor requests in automated verification are mocked; no paid requests are authorised or required.
