-- ======================================
-- トルモ Supabaseスキーマ
-- ======================================

-- ユーザープロファイル（Supabase Authと連携）
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 企業情報（インテーク回答）
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  industry TEXT,
  industry_detail TEXT,
  prefecture TEXT,
  city TEXT,
  founded TEXT,
  employees TEXT,
  revenue TEXT,
  profit TEXT,
  cashflow TEXT,
  borrowing TEXT,
  challenges TEXT[],
  employment TEXT,
  certifications TEXT[],
  subsidy_exp TEXT,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 補助金マスタDB
CREATE TABLE subsidies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  org TEXT NOT NULL,
  layer TEXT NOT NULL CHECK (layer IN ('national','prefecture','city','chamber','other')),
  prefecture TEXT,
  max_amount TEXT,
  rate TEXT,
  deadline_date DATE,
  score_base INTEGER DEFAULT 60,
  status TEXT DEFAULT '公募中',
  summary TEXT,
  strategy TEXT,
  name_ideas JSONB,
  tags TEXT[],
  eligible TEXT,
  expense TEXT,
  difficulty TEXT,
  sections JSONB,
  url TEXT,
  form_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 申請書ドラフト
CREATE TABLE drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  subsidy_id UUID REFERENCES subsidies(id),
  company_id UUID REFERENCES companies(id),
  section_id TEXT,
  content TEXT,
  name_idea_index INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- チャット履歴
CREATE TABLE chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  subsidy_id UUID REFERENCES subsidies(id),
  role TEXT CHECK (role IN ('user','ai')),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_subsidies_layer ON subsidies(layer);
CREATE INDEX idx_subsidies_prefecture ON subsidies(prefecture);
CREATE INDEX idx_subsidies_active ON subsidies(is_active);
CREATE INDEX idx_drafts_user ON drafts(user_id, subsidy_id);

-- RLS（Row Level Security）
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "users_own_company" ON companies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_drafts" ON drafts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_chatlogs" ON chat_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "subsidies_public_read" ON subsidies FOR SELECT USING (TRUE);

-- ======================================
-- 初期補助金データ（3件）
-- ======================================

INSERT INTO subsidies (name, org, layer, max_amount, rate, deadline_date, score_base, status, summary, strategy, name_ideas, tags, eligible, expense, difficulty, sections, url) VALUES
(
  'ものづくり補助金',
  '中小企業庁',
  'national',
  '1,000万円',
  '1/2',
  '2026-03-31',
  70,
  '公募中',
  '中小企業・小規模事業者が革新的な製品・サービス開発や生産プロセス改善に取り組む際の設備投資を支援。DX・GX要素を加えると補助額が増加する。',
  '製造ラインのIoT化を組み合わせることでDX枠として申請でき補助上限が750万→1,000万円にアップ',
  '[{"label":"攻め","text":"製造ラインのIoT化・自動化による生産効率300%向上と新製品開発の実現"},{"label":"標準","text":"生産設備の更新とDXによる製造プロセス革新・品質向上"},{"label":"確実","text":"老朽設備の更新による生産性向上と安定した製品供給体制の構築"}]',
  ARRAY['DX推進','生産性向上','IoT活用'],
  '中小企業・小規模事業者',
  '機械装置・システム構築費',
  '中',
  '[{"id":"s1","label":"革新性・独自性","sub":"他社との違い・新規性"},{"id":"s2","label":"事業の背景と必要性","sub":"業界課題・自社の現状"},{"id":"s3","label":"実施体制・スケジュール","sub":"推進チーム・マイルストーン"},{"id":"s4","label":"市場性・将来性","sub":"市場規模・成長性"},{"id":"s5","label":"資金計画・収益性","sub":"調達・CF・返済計画"}]',
  'https://portal.monodukuri-hojo.jp/'
),
(
  'IT導入補助金（デジタル化基盤導入枠）',
  '経済産業省',
  'national',
  '350万円',
  '3/4',
  '2026-04-15',
  65,
  '公募中',
  '中小企業のITツール導入を支援。会計・在庫・生産管理システムなど幅広いソフトウェアが対象で、導入費用の最大3/4を補助する。',
  '生産管理システムの導入として申請することで製造業の業務効率化を数値で示しやすい',
  '[{"label":"攻め","text":"AIを活用した生産管理システム導入による完全デジタル化"},{"label":"標準","text":"生産管理・在庫管理システムの統合導入による業務効率化"},{"label":"確実","text":"既存の紙運用からのデジタル化によるコスト削減"}]',
  ARRAY['IT化','業務効率化','デジタル化'],
  '中小企業・小規模事業者',
  'ソフトウェア・クラウド利用費',
  '低',
  '[{"id":"s1","label":"業務課題・現状","sub":"デジタル化前の問題点"},{"id":"s2","label":"導入ツールの概要","sub":"選定理由・機能説明"},{"id":"s3","label":"期待される効果","sub":"定量的な改善目標"},{"id":"s4","label":"セキュリティ対策","sub":"情報管理方針"}]',
  'https://it-hojo.jp/'
),
(
  '小規模事業者持続化補助金',
  '日本商工会議所',
  'chamber',
  '200万円',
  '2/3',
  '2026-06-01',
  68,
  '公募中',
  '小規模事業者の販路開拓・生産性向上を支援。商工会議所が申請をサポートするため採択率が高く初めての申請にも向いている。',
  '「販路開拓×デジタル活用」の組み合わせで申請するとインボイス特例枠で上限が200万円にアップ',
  '[{"label":"攻め","text":"ECサイト構築と展示会出展による新規顧客開拓と売上30%増の実現"},{"label":"標準","text":"デジタルツールを活用した販路拡大と生産性向上"},{"label":"確実","text":"ホームページ整備と営業資料作成による既存顧客深耕"}]',
  ARRAY['販路開拓','持続化','商工会議所'],
  '小規模事業者',
  '広報費・機械装置費',
  '低',
  '[{"id":"s1","label":"企業概要","sub":"事業内容・強み"},{"id":"s2","label":"顧客ニーズと市場","sub":"ターゲット・競合分析"},{"id":"s3","label":"販路開拓の取り組み","sub":"具体的な施策内容"},{"id":"s4","label":"経費明細","sub":"補助対象経費の内訳"}]',
  'https://jizokukahojokin.info/'
);
