# Họa sắc Việt artwork

`frontend/src/assets/hoasac-hue.webp` is original decorative artwork generated with the built-in image generation tool, inspired by the user's Huế pen drawing and Vietnamese travel illustration references. It is an artistic composition, not an architectural reconstruction. The optimized asset is 1200 × 800 with alpha transparency.

`PatternsArtwork.tsx` shares this illustration between the homepage, theme selector and page banners. Separate SVG lanterns, petals and water lines animate gently; the theme selector stays still. All motion respects the background-motion setting, admin reduced-motion setting and `prefers-reduced-motion`.

## Tower removal edit

At the user's request, the tall pagoda tower was removed using the built-in image editing tool. The edited asset replaces the same WebP used throughout the theme.

Edit prompt: Remove ONLY the tall multi-tier pagoda tower in the upper right background, completely from its finial through its base behind the right wing roof. Replace its area with unobtrusive foliage continuous with the nearby green tree canopy at the bottom, and transparent empty background above. No tall tower, spire or replacement monument. Preserve the central low Huế gateway building and all roofs, flowering tree, green trees, steps, boat and boatman, woman carrying baskets, cyclo rider, river, composition, style, palette and genuine alpha transparency.

## Generation prompt

Use case: illustration-story. Create an exquisite Vietnamese cultural travel illustration for a website theme called Hoa sac Viet. Landscape 3:2 composition, all objects fully inside frame with airy margins. Blend elegant burgundy hand-drawn architectural pen linework of Hue pagoda courtyard and seven-tier pagoda tower with warm vintage flat-color travel illustration: golden ochre tiled roofs, delicate flowering tree, leafy jade shrubs, a small wooden boat with a Vietnamese boatman on subtle teal river strokes in lower left, Vietnamese woman in red ao dai and conical hat carrying two baskets lower right, small traditional cyclo rider nearby. Architecture is dominant central focal point; people and boat small supporting vignettes. Rich but restrained vermilion, plum burgundy, dusty jade teal and antique golden yellow palette. Fine detailed ink contours, lightly textured watercolor pigment accents, sophisticated editorial heritage illustration. Transparent background with actual alpha, NO opaque rectangular paper backdrop. Do NOT draw lanterns (they will be layered in code), no maps, no lettering, labels, watermark, border, photorealism, 3D or giant abstract blobs. Cultural inspiration from Hue architecture and Vietnamese daily life; harmonious connected scene, not a dense sticker sheet. High readability at 500px wide.
