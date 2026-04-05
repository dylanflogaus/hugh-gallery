-- Default catalog (matches gallery-store.js). Fills empty D1 so checkout IDs resolve.
-- INSERT OR IGNORE: skips rows if that id already exists (admin / prior seed).

INSERT OR IGNORE INTO gallery_items (
  id, sort_order, title, meta, description, detail_description, label, price,
  cart_title, gradient, tags, badge, large, featured, sold, cart_color, image_url, image_dimmed
) VALUES
(
  'garden-reverie', 0, 'Garden Reverie',
  'Watercolour on cold-press · 60×80 cm · 2025',
  'A lush celebration of midsummer — petals dissolving into soft pools of colour, referencing the abundance and impermanence of bloom.',
  'A lush celebration of midsummer — petals dissolving into soft pools of colour, referencing the abundance and impermanence of bloom. Unframed; framing available on request.',
  'Original · 2025', 1850, 'Garden Reverie',
  'linear-gradient(135deg, #f7c5c0 0%, #d5c9e8 35%, #bfd9f0 70%, #c5e4d8 100%)',
  'original watercolour floral', 'new', 1, 0, 0, '#d5c9e8', '', 0
),
(
  'drift', 1, 'Drift',
  'Acrylic wash · 40×50 cm · 2025',
  'Layers of translucent blue and violet, exploring movement and stillness at once.',
  'Layers of translucent blue and violet, exploring movement and stillness at once. Ships on canvas, ready to hang.',
  'Original · 2025', 980, 'Drift',
  'linear-gradient(160deg, #bfd9f0 0%, #c4a8d8 60%, #f7c5c0 100%)',
  'original abstract', '', 0, 0, 0, '#bfd9f0', '', 0
),
(
  'peach-blossom', 2, 'Peach Blossom',
  'Giclee print · Ed. of 25 · A2',
  'A delicate study of spring stone-fruit blossoms, rendered in warm peach and rose tones.',
  'A delicate study of spring stone-fruit blossoms, rendered in warm peach and rose tones. Each print is hand-signed and numbered.',
  'Print · Edition of 25', 290, 'Peach Blossom (Print)',
  'linear-gradient(135deg, #f2c9a0 0%, #f7c5c0 50%, #e8a8b0 100%)',
  'print floral', 'print', 0, 0, 0, '#f2c9a0', '', 0
),
(
  'morning-mist', 3, 'Morning Mist',
  'Watercolour · 30×40 cm · 2024',
  'Soft seafoam and mint evoke the hush of a morning garden before the world wakes.',
  'Soft seafoam and mint evoke the hush of a morning garden before the world wakes. Only 1 left — this is the last available original.',
  'Original · 2024', 780, 'Morning Mist',
  'linear-gradient(160deg, #c5e4d8 0%, #bfd9f0 50%, #f5eac0 100%)',
  'original watercolour', 'last', 0, 0, 0, '#c5e4d8', '', 0
),
(
  'reverie-4', 4, 'Reverie No. 4',
  'Mixed media · 50×50 cm · 2025',
  'Part of an ongoing abstract series meditating on memory and colour temperature.',
  'Part of an ongoing abstract series meditating on memory and colour temperature. Ink, watercolour, and soft pastel on cotton rag.',
  'Original · 2025', 1200, 'Reverie No. 4',
  'linear-gradient(125deg, #c4a8d8 0%, #f7c5c0 50%, #f5eac0 100%)',
  'original abstract', '', 0, 0, 0, '#c4a8d8', '', 0
),
(
  'wild-meadow', 5, 'Wild Meadow',
  'Watercolour · 40×55 cm · 2024',
  'A joyful scatter of wildflowers in sage, mint, and sky blue. This piece has found its home.',
  'A joyful scatter of wildflowers in sage, mint, and sky blue. This piece has found its home.',
  'Original · 2024', 1050, 'Wild Meadow',
  'linear-gradient(140deg, #a8c5b0 0%, #c5e4d8 40%, #bfd9f0 100%)',
  'original floral watercolour', 'sold', 0, 0, 1, '#a8c5b0', '', 1
),
(
  'warm-study', 6, 'Warm Study',
  'Giclee print · Ed. of 15 · A3',
  'Golden butter, peach, and rose — a study in warmth and late afternoon light.',
  'Golden butter, peach, and rose — a study in warmth and late afternoon light. Printed on heavyweight matte paper.',
  'Print · Edition of 15', 195, 'Warm Study (Print)',
  'linear-gradient(170deg, #f5eac0 0%, #f2c9a0 40%, #e8a8b0 100%)',
  'print abstract', 'print', 0, 0, 0, '#f5eac0', '', 0
),
(
  'spectrum', 7, 'Spectrum',
  'Watercolour & Ink · 70×100 cm · 2025',
  'A full-spectrum wash from lavender through sky, mint, blush, and butter — Hugh''s most ambitious piece of the year.',
  'A full-spectrum wash from lavender through sky, mint, blush, and butter. Hugh''s most ambitious piece of the year. Professionally stretched on linen.',
  'Original · 2025', 2400, 'Spectrum',
  'linear-gradient(115deg, #d5c9e8 0%, #bfd9f0 25%, #c5e4d8 50%, #f7c5c0 75%, #f5eac0 100%)',
  'original abstract watercolour', 'new', 1, 0, 0, '#d5c9e8', '', 0
),
(
  'rose-study', 8, 'Rose Study I',
  'Watercolour · 25×35 cm · 2024',
  'A close, intimate look at the unfurling rose — blush into deep rose, lavender shadows.',
  'A close, intimate look at the unfurling rose — blush into deep rose, lavender shadows. Delicate and luminous. Perfect for a small wall or hallway.',
  'Original · 2024', 620, 'Rose Study I',
  'linear-gradient(150deg, #e8a8b0 0%, #f7c5c0 40%, #c4a8d8 100%)',
  'original floral', '', 0, 0, 0, '#e8a8b0', '', 0
),
(
  'lavender-haze', 9, 'Lavender Haze',
  'Watercolour on paper · 40×50 cm',
  'Soft violet atmospheres layered over warm paper — luminous and calm.',
  'Soft violet atmospheres layered over warm paper — luminous and calm. Unframed; float framing recommended.',
  'Original', 1100, 'Lavender Haze',
  'linear-gradient(145deg, #f7c5c0, #d5c9e8, #bfd9f0)',
  'original watercolour abstract', '', 0, 1, 0, '#d5c9e8', '', 0
),
(
  'first-light', 10, 'First Light',
  'Acrylic wash · 30×40 cm',
  'Cool mint and sky opening into a warm horizon — the quiet of early day.',
  'Cool mint and sky opening into a warm horizon — the quiet of early day.',
  'Original', 860, 'First Light',
  'linear-gradient(145deg, #c5e4d8, #bfd9f0, #f5eac0)',
  'original abstract', '', 0, 1, 0, '#c5e4d8', '', 0
),
(
  'bloom-3', 11, 'Bloom Study III',
  'Mixed media · 50×60 cm',
  'Warm peach and orchid — an abstracted bloom with tactile surface.',
  'Warm peach and orchid — an abstracted bloom with tactile surface. Mixed media on cradled panel.',
  'Original', 1450, 'Bloom Study III',
  'linear-gradient(145deg, #f2c9a0, #f7c5c0, #c4a8d8)',
  'original floral abstract', '', 0, 1, 0, '#f2c9a0', '', 0
);
