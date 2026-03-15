-- jgrants_id カラムを追加（重複排除に使う）
ALTER TABLE subsidies ADD COLUMN IF NOT EXISTS jgrants_id TEXT UNIQUE;
ALTER TABLE subsidies ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE subsidies ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- インデックス追加（検索高速化）
CREATE INDEX IF NOT EXISTS idx_subsidies_jgrants_id ON subsidies(jgrants_id);
CREATE INDEX IF NOT EXISTS idx_subsidies_city ON subsidies(city);
CREATE INDEX IF NOT EXISTS idx_subsidies_layer_pref ON subsidies(layer, prefecture);

-- 既存の手動データに city を設定
UPDATE subsidies SET city = '名古屋市' WHERE name LIKE '%名古屋市%' AND city IS NULL;
UPDATE subsidies SET city = '大阪市'  WHERE name LIKE '%大阪市%'  AND city IS NULL;
UPDATE subsidies SET city = '横浜市'  WHERE name LIKE '%横浜市%'  AND city IS NULL;
UPDATE subsidies SET city = '福岡市'  WHERE name LIKE '%福岡市%'  AND city IS NULL;
UPDATE subsidies SET city = '東京'    WHERE name LIKE '%東京都%'  AND city IS NULL AND layer = 'city';
