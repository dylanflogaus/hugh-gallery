-- Gallery inventory for Hugh Gallery (D1)
CREATE TABLE IF NOT EXISTS gallery_items (
  id TEXT PRIMARY KEY NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  meta TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  detail_description TEXT NOT NULL DEFAULT '',
  label TEXT NOT NULL DEFAULT 'Original',
  price INTEGER NOT NULL DEFAULT 0,
  cart_title TEXT NOT NULL DEFAULT '',
  gradient TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT 'original',
  badge TEXT NOT NULL DEFAULT '',
  large INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  sold INTEGER NOT NULL DEFAULT 0,
  cart_color TEXT NOT NULL DEFAULT '#d5c9e8',
  image_url TEXT NOT NULL DEFAULT '',
  image_dimmed INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_gallery_items_sort ON gallery_items(sort_order);
