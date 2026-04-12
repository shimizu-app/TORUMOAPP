"use client";
// ============================================================
// DebtFinancePanel.jsx
// 使い方:
//   import { DebtFinancePanel, calcCreditModel, DEMO_INPUTS } from './DebtFinancePanel';
//
//   // 決算書データを渡すだけで動く
//   <DebtFinancePanel inputs={myInputs} result={calcCreditModel(myInputs)} />
//
//   // inputs のキー一覧（単位：万円）
//   bookEquity, cash, receivables, payables,
//   invRaw, invWip, invFinished, invGoods, invStaleness,
//   fixedAssetsWithCollateral, interestBearingDebt,
//   ebitdaY1, ebitdaY2, ebitdaY3,   ← 3期分のEBITDA
//   excessiveExecComp, tax, maintenanceCapex,
//   industry,                         ← "stable"|"general"|"cyclical"|"high_risk"
//   monthlyMgmtScore, customerDiversityScore, pricingPowerScore,
//   customerConcentration, inventoryMgmtWeak, planDeviationRisk,
//   fundPurpose,                      ← "equipment"|"working"
//   hasCollateral                     ← boolean
// ============================================================
import { useState, useMemo } from "react";
 
const G="#10B981",GD="#059669",GL="#D1FAE5",GL2="#ECFDF5";
const GRAD="linear-gradient(90deg,#10B981,#22C55E)";
const BG="#EEF2EF",CARD="#fff",SOFT="#F7FAF8";
const SH="0 4px 20px rgba(15,23,42,0.06)";
const SHG="0 8px 24px rgba(16,185,129,0.22)";
const BD="#E2E8F0",T1="#0A0F0A",T2="#334155",T3="#94A3B8";
const RED="#EF4444",REDBG="#FEE2E2",REDBR="#FCA5A5",REDTC="#991B1B";
const YLW="#F59E0B",YLWBG="#FEF3C7",YLWBR="#FCD34D",YLWTC="#92400E";
const PRP="#7C3AED",PRPBG="#F5F3FF",PRPBR="#C4B5FD",PRPTC="#5B21B6";
const BLU="#1D4ED8",BLUBG="#EFF6FF",BLUBR="#BFDBFE",BLUTC="#1E3A8A";
const ORGL="#FFF4ED",ORGD="#C2510A";
 
function SL({children,color=G}){return <div style={{fontSize:9,fontWeight:700,color,letterSpacing:".14em",textTransform:"uppercase",fontFamily:"Inter,sans-serif",marginBottom:8}}>{children}</div>;}
function Card({children,style={}}){return <div style={{background:CARD,borderRadius:18,padding:20,boxShadow:SH,marginBottom:12,...style}}>{children}</div>;}
 
// ── デモデータ ──────────────────────────────────
// 3期分のEBITDA入力に対応（ebitdaY1〜Y3）
const DEMO_INPUTS={
  bookEquity:2200, cash:800,
  // 売掛金：決算書から振り出し日が取れないケースを想定し、
  // 一律で業種平均回転日数を超過した分を割引評価する簡易方式
  receivables:2200,        // 売掛金合計（帳簿）
  // 在庫
  invRaw:200, invWip:400, invFinished:300, invGoods:0, invStaleness:20,
  // BS
  payables:600,            // 買入債務（買掛金＋支払手形）
  fixedAssetsWithCollateral:3000,
  interestBearingDebt:4000,
  // PL 3期分（Y1=直近, Y2=前期, Y3=前々期）
  ebitdaY1:470, ebitdaY2:430, ebitdaY3:390,
  // 過大役員報酬調整（3期平均EBITDAに加算）
  excessiveExecComp:0,
  // 税・維持投資
  tax:80, maintenanceCapex:60,
  // 業種
  industry:"cyclical",
  // 定性評価
  monthlyMgmtScore:true, customerDiversityScore:false, pricingPowerScore:false,
  customerConcentration:true, inventoryMgmtWeak:false, planDeviationRisk:false,
  // 資金使途（"working"=運転資金 / "equipment"=設備資金）
  fundPurpose:"equipment",
  // 担保差し入れ有無（設備資金の場合）
  hasCollateral:true,
};
const DEMO_ANSWERS={industry:"製造業",prefecture:"愛知県",employees:"51〜100名",founded:"20年以上",challenge:"設備投資・自動化",sales:"s3000",debt:"d3000p",purpose:"設備投資"};
 
// ══════════════════════════════════════════════════
// 与信計算エンジン v2
//
// 仕様思想（実務ベース）
// ─────────────────────────────────────────────────
// Step1 資産評価 → 顧客セグメント判定
//   調整純資産・自己資本比率・流動比率をスコアリングして
//   【積極支援 / 是々非々 / 与信不可】を内部判定
//   → 表示は「銀行から見た信用度：高 / 中 / 要改善」に翻訳
//
// Step2 支援スタンス・保全方針
//   運転資金: 基本無担保。所用運転資金（CCC）の範囲内
//   設備資金: 担保差し入れ有無で融資額が変動
//
// Step3 資金使途別の融資額算定
//   運転資金上限 = (売上債権 + 棚卸資産) − 買入債務
//   設備資金     = 3期平均EBITDAベースのDSCR判定
//
// Step4 DCR（返済可能期間）スクリーニング
//   有利子負債 ÷ 3期平均EBITDA
//   10年超 → 減点・条件強化
//
// 売掛金評価: 振り出し日が決算書から取れないケースを考慮し
//   一律で業種平均回転日数を超過した分を割引する簡易方式
// ══════════════════════════════════════════════════
function calcCreditModel(inp){
  const{
    bookEquity=0, cash=0,
    receivables=0,
    invRaw=0, invWip=0, invFinished=0, invGoods=0, invStaleness=0,
    payables=0,
    fixedAssetsWithCollateral=0, interestBearingDebt=0,
    ebitdaY1=0, ebitdaY2=0, ebitdaY3=0,
    excessiveExecComp=0, tax=0, maintenanceCapex=0,
    industry="cyclical",
    monthlyMgmtScore=false, customerDiversityScore=false, pricingPowerScore=false,
    customerConcentration=false, inventoryMgmtWeak=false, planDeviationRisk=false,
    fundPurpose="equipment", hasCollateral=true,
    // 後方互換：旧フォーマットのフォールバック
    operatingProfit=0, depreciation=0,
  }=inp;
 
  // ── 3期平均EBITDA（入力がない場合は旧フォーマットにフォールバック）──
  const hasThreeYear = ebitdaY1>0||ebitdaY2>0||ebitdaY3>0;
  const ebitdaAvg = hasThreeYear
    ? (ebitdaY1+(ebitdaY2||ebitdaY1)+(ebitdaY3||ebitdaY1))/([ebitdaY1,ebitdaY2,ebitdaY3].filter(v=>v>0).length)
    : (operatingProfit+depreciation+excessiveExecComp);
  const ebitda = ebitdaAvg + excessiveExecComp; // 過大役員報酬を正常化
 
  // ── 売掛金評価（一律簡易方式）──────────────────────
  // 業種別の平均回転日数を超過した分を割引
  // 振り出し日が決算書から取れないケースへの対応
  const recTurnDays={stable:45,general:60,cyclical:75,high_risk:90}[industry]||60;
  // 売上高推計（EBITDA÷利益率で逆算、簡易）
  const salesEst=ebitda>0?ebitda/0.1:receivables*5;
  const normalRec=salesEst*(recTurnDays/365); // 業種平均範囲内の売掛金
  const excessRec=Math.max(0,receivables-normalRec);
  const evalRec=normalRec+excessRec*0.50; // 超過分は50%掛け
  const recGap=receivables-evalRec;
 
  // ── 在庫評価 ────────────────────────────────────
  const staleFactor=invStaleness>=50?0.70:invStaleness>=30?0.85:1.0;
  const evalInv=(invRaw*0.35+invWip*0.15+invFinished*0.55+invGoods*0.65)*staleFactor;
  const totalBookInv=invRaw+invWip+invFinished+invGoods;
  const invGap=totalBookInv-evalInv;
 
  // ── 調整純資産 ───────────────────────────────────
  const adjEquity=bookEquity-invGap-recGap;
  const totalAssets=bookEquity+interestBearingDebt; // 簡易総資産
  const equityRatio=totalAssets>0?bookEquity/totalAssets:0;
  const currentRatio=totalAssets>0?(cash+evalRec+evalInv)/(interestBearingDebt*0.4):1.5; // 簡易流動比率
 
  // ── Step1: 顧客セグメント判定（内部）──────────────
  // 調整純資産・自己資本比率・流動比率をスコアリング
  let segScore=0;
  if(adjEquity>0)segScore+=2;else segScore-=2;
  if(equityRatio>=0.30)segScore+=2;else if(equityRatio>=0.20)segScore+=1;else segScore-=1;
  if(currentRatio>=1.5)segScore+=1;else if(currentRatio>=1.0)segScore+=0;else segScore-=1;
  if(monthlyMgmtScore)segScore+=1;
  if(customerConcentration)segScore-=1;
  if(inventoryMgmtWeak)segScore-=1;
  // 内部セグメント → 表示用信用度に翻訳
  const segment=segScore>=4?"積極支援":segScore>=1?"是々非々":"与信不可";
  const creditRating=segment==="積極支援"?"高":segment==="是々非々"?"中":"要改善";
  // 支援スタンス・担保方針（内部ロジック）
  const supportStance=segment==="積極支援"?"無担保可":segment==="是々非々"?"保全確保":"保全内";
 
  // ── Step2/3: 資金使途別の融資額算定 ──────────────
  // 【運転資金】所用運転資金（CCC）= (売上債権+棚卸資産) − 買入債務
  const workingCapitalNeeds=Math.max(0,evalRec+evalInv-payables);
  // 既存借入のうち運転資金分を推計（全体の30%と仮定）
  const existingWorkingDebt=interestBearingDebt*0.30;
  const workingCapitalRoom=Math.max(0,workingCapitalNeeds-existingWorkingDebt);
 
  // 【設備資金】3期平均EBITDAベース
  const netDebt=Math.max(0,interestBearingDebt-cash);
  const multiplier={stable:4.5,general:3.5,cyclical:2.5,high_risk:2.0}[industry]||3.5;
  const debtCeil=Math.max(0,ebitda*multiplier);
  // 担保差し入れによる上限拡張
  const collateralBonus=hasCollateral&&fundPurpose==="equipment"?fixedAssetsWithCollateral*0.70*0.70:0;
  const equipmentCeil=Math.max(0,debtCeil+collateralBonus-netDebt);
 
  // 資産側上限（純資産ベース）
  // 「資産見合いかどうか」の判定に使用。単純に調整純資産から除算
  const assetCeil=Math.max(0,adjEquity*2.5); // 純資産の2.5倍が概ねの目安
 
  const fundingCeil=fundPurpose==="working"?workingCapitalRoom:equipmentCeil;
  const raw=Math.min(assetCeil,fundingCeil);
  const binding=assetCeil<=fundingCeil?"asset":"debt";
 
  // ── Step4: DCR（返済可能期間）スクリーニング ──────
  // 有利子負債 ÷ 3期平均EBITDA。10年超で減点
  const dcr=ebitda>0?netDebt/ebitda:null;
  const dcrPenalty=dcr!==null&&dcr>10?0.80:dcr!==null&&dcr>7?0.90:1.0;
  const dcrStatus=dcr===null?"unknown":dcr>10?"danger":dcr>7?"caution":dcr>5?"watch":"good";
 
  // ── DSCR（返済余力）──────────────────────────────
  const annRep=interestBearingDebt>0?interestBearingDebt/7:0;
  const dscr=annRep>0?(ebitda-tax-maintenanceCapex)/annRep:null;
  const dscrStatus=dscr===null?"unknown":dscr<1.0?"reject":dscr<1.2?"caution":dscr<1.5?"standard":"good";
 
  // ── 定性補正 ─────────────────────────────────────
  let q=0;
  if(monthlyMgmtScore)q+=0.3;if(customerDiversityScore)q+=0.3;if(pricingPowerScore)q+=0.2;
  if(customerConcentration)q-=0.5;if(inventoryMgmtWeak)q-=0.4;if(planDeviationRisk)q-=0.5;
  const qualMultiplier=1+0.1*q;
 
  // ── 最終融資可能額 ───────────────────────────────
  // セグメント×DCRペナルティ×定性補正
  const segMultiplier=segment==="与信不可"?0:segment==="是々非々"?0.75:1.0;
  const final=Math.max(0,raw*qualMultiplier*dcrPenalty*segMultiplier);
 
  // ── 判定 ─────────────────────────────────────────
  const verdict=segment==="与信不可"?"REJECT":
    dscr!==null&&dscr<1.0?"REJECT":
    final<=0?"REJECT":
    dscr!==null&&dscr<1.2||segment==="是々非々"?"CONDITIONAL":"APPROVE";
 
  const ebitdaMult=netDebt>0&&ebitda>0?netDebt/ebitda:null;
 
  // ── 感度分析 ─────────────────────────────────────
  const sensitivities=[];
  if(invWip>0){
    const imp=(invRaw*0.35+(invWip*0.5)*0.55+(invFinished+invWip*0.5)*0.55+invGoods*0.65)*staleFactor;
    const improveddAdj=bookEquity-(totalBookInv-imp)-recGap;
    const improvedAssetCeil=Math.max(0,improveddAdj*2.5);
    const d=Math.max(0,Math.min(improvedAssetCeil,fundingCeil)*qualMultiplier*dcrPenalty*segMultiplier-final);
    if(d>50)sensitivities.push({label:"仕掛品の製品化・在庫回転を改善",delta:d,note:"仕掛品換価率0.15→製品0.55に改善することで調整純資産が増加"});
  }
  if(ebitda>0){
    const ce=240,ie=ebitda+ce,dc=Math.max(0,ie*multiplier+collateralBonus-netDebt);
    const d=Math.max(0,Math.min(assetCeil,dc)*qualMultiplier*dcrPenalty*segMultiplier-final);
    if(d>50)sensitivities.push({label:"役員報酬を月20万円圧縮（年240万EBITDA改善）",delta:d,note:`3期平均EBITDA向上で返済側上限が${Math.round(ce*multiplier)}万円拡大`});
  }
  if(dcr!==null&&dcr>7){
    const targetDebt=ebitda*7;const repay=netDebt-targetDebt;
    if(repay>0){
      const newDCRpen=1.0;const d=Math.max(0,raw*qualMultiplier*newDCRpen*segMultiplier-final);
      if(d>50)sensitivities.push({label:`借入${Math.round(repay)}万円を返済してDCR7年以内に改善`,delta:d,note:"DCRペナルティが解消され融資可能額が拡大"});
    }
  }
 
  return{
    // 資産評価
    bookEquity, adjEquity, invGap, recGap, evalInv, evalRec,
    totalBookInv, totalBookRec:receivables,
    assetCeil,
    // EBITDA
    ebitda, ebitdaAvg, hasThreeYear, netDebt, ebitdaMult, multiplier,
    // 資金使途
    workingCapitalNeeds, workingCapitalRoom, equipmentCeil, debtCeil,
    fundPurpose, collateralBonus,
    // スコア
    segment, creditRating, supportStance, segScore,
    equityRatio: Math.round(equityRatio*100),
    // 返済
    dcr, dcrStatus, dscr, dscrStatus,
    // 最終
    binding, final, verdict, qualMultiplier, dcrPenalty,
    sensitivities, interestBearingDebt,
  };
}
 
function intakeToModel(a){
  const sm={s100:500,s500:2000,s1000:4000,s3000:6000,s5000:8000,s5000p:12000};
  const dm={none:0,d500:300,d1000:700,d3000:2000,d3000p:4000};
  const sales=sm[a.sales]||5000,debt=dm[a.debt]||4000;
  const ind={"製造業":"cyclical","IT":"general","建設業":"cyclical","飲食業":"cyclical","小売業":"general","サービス業":"general","医療・福祉":"stable","その他":"general"};
  const inv=sales*0.09;const eb=sales*0.094;
  return{bookEquity:Math.round(sales*0.28),cash:Math.round(debt*0.2),
    receivables:Math.round(sales*0.38),payables:Math.round(sales*0.12),
    invRaw:Math.round(inv*0.22),invWip:Math.round(inv*0.44),invFinished:Math.round(inv*0.34),invGoods:0,invStaleness:20,
    fixedAssetsWithCollateral:Math.round(sales*0.6),interestBearingDebt:debt,
    ebitdaY1:Math.round(eb),ebitdaY2:Math.round(eb*0.93),ebitdaY3:Math.round(eb*0.86),
    excessiveExecComp:0,tax:Math.round(sales*0.018),maintenanceCapex:Math.round(sales*0.011),
    industry:ind[a.industry]||"cyclical",
    monthlyMgmtScore:true,customerDiversityScore:false,pricingPowerScore:false,
    customerConcentration:false,inventoryMgmtWeak:false,planDeviationRisk:false,
    fundPurpose:a.purpose==="運転資金"?"working":"equipment",hasCollateral:true};
}
 
// ── 用語集 ───────────────────────────────────────
const GLOSSARY={
  調整純資産:{what:"帳簿上の純資産から、在庫・売掛金の換価評価差額を差し引いた銀行が実態として見る純資産です。",why:"銀行は清算価値で資産を評価します。仕掛品や遅延売掛金は額面通りに回収できないため厳しく割り引かれます。",formula:"帳簿純資産 − 在庫評価差額 − 売掛金評価差額",good:"帳簿純資産の70%以上が目安"},
  資産側上限:{what:"調整純資産を基礎に算出した「資産担保ベースの融資上限」です。純資産が低いほど上限が下がります。",why:"銀行は「この会社が清算されたら実際にいくら回収できるか」という目線で資産を評価し、それを基に融資上限を設定します。",formula:"調整純資産 × 2.5（目安）",good:"返済側上限を上回っていれば資産側は問題なし"},
  返済側上限:{what:"3期平均EBITDAに業種別の倍率をかけた「収益力ベースの融資上限」です。",why:"銀行は収益力でどれだけ返済できるかを評価します。景気敏感業種は2.5倍が上限で、EBITDAが低いほど借りられる額が小さくなります。",formula:"3期平均EBITDA × 倍率（安定4.5/一般3.5/景気敏感2.5/高リスク2.0）",good:"資産側上限を上回っていれば問題なし"},
  正常化EBITDA:{what:"一過性の損益を除いた「実態ベースの稼ぐ力」です。営業利益に減価償却費を足し、過大役員報酬などを戻した数値です。",why:"銀行は単年度の利益ではなく継続的な稼ぐ力を見ます。役員報酬で利益を圧縮している会社は正常化後の数値が銀行の評価になります。",formula:"営業利益 + 減価償却費 + 過大役員報酬調整 ± 一過性損益",good:"高いほど良い。業種平均との比較が重要"},
  "3期平均EBITDA":{what:"直近3期分のEBITDA（税引前利益＋減価償却＋役員報酬調整）の単純平均です。",why:"単年度の数字は特別損益や繁閑で大きくブレます。銀行は3期並べて「実態の稼ぐ力」を判断します。1期だけで申請すると「たまたま良かった期」と見られるリスクがあります。",formula:"（EBITDA直近期 ＋ 前期 ＋ 前々期）÷ 3",good:"3期とも安定していると評価が高い。増加傾向があれば加点"},
  DSCR:{what:"年間キャッシュフローが年間元利返済額の何倍あるかを示す返済能力の指標です。",why:"銀行が最も重視する指標で1.0未満は即否決。1.5以上で「余裕がある」と評価されます。この数値が低いと追加融資はほぼ通りません。",formula:"（3期平均EBITDA − 税金 − 維持投資） ÷ 年間元利返済額",good:"1.5以上が良好 / 1.2〜1.5が標準 / 1.0未満は融資困難"},
  "DCR（返済可能期間）":{what:"有利子負債を3期平均EBITDAで割った「今の稼ぎ力で借金を全部返すのに何年かかるか」を示す指標です。",why:"銀行が借入過多かどうかを判断する基準のひとつです。10年を超えると「現状の収益力では長期にわたって返済が必要」と判断され、融資に減点が入ります。7年超から要注意水準とされることが多いです。",formula:"有利子負債（ネット）÷ 3期平均EBITDA",good:"7年以内が目安。10年超で減点"},
  EBITDA倍率:{what:"ネット有利子負債を3期平均EBITDAで割った「今の稼ぎ力で何年分の借金があるか」を示す指標です。",why:"銀行が借入過多かどうかを判断する基準で、景気敏感業種は2.5〜3倍が上限です。これを超えると「現在の収益力では返済が困難」と判断されます。",formula:"ネット有利子負債 ÷ 3期平均EBITDA",good:"景気敏感業種は3倍以下が目安"},
  仕掛品換価率:{what:"銀行が仕掛品を評価する際に使う掛け目です。帳簿上の仕掛品に15%をかけた額が銀行の評価額になります。",why:"仕掛品は特定の取引先向けに加工された中途半端な製品のため、他社での転用がほぼ不可能です。清算価値がほぼゼロに近いとして15%という極めて低い評価になります。",formula:"仕掛品帳簿額 × 0.15",good:"仕掛品残高を最小化することが評価改善の鍵"},
  定性補正:{what:"財務数値では測れない経営の質（月次管理の迅速さ・顧客分散・価格決定力）を融資可能額に反映させる調整係数です。",why:"銀行は財務数値だけでなく経営者への信頼感も判断します。月次試算表の提出が早い会社・顧客が分散している会社は信用力が高く評価されます。",formula:"融資可能額 × (1 + 0.1 × 補正係数合計)",good:"月次管理の迅速化と顧客分散が最も効果が高い加点要因"},
  売掛金換価率:{what:"銀行が売掛金を評価する際の掛け目です。業種平均の回転日数を超過した分を50%で割引評価する簡易方式を採用しています。",why:"振り出し日が決算書から読み取れないケースが多いため、業種平均の回転日数を超えた分を「回収リスクあり」として割り引きます。",formula:"業種平均範囲内の売掛金 ＋ 超過分 × 0.50",good:"売掛金回転日数を業種平均以内に抑えることが最善"},
  銀行から見た信用度:{what:"調整純資産・自己資本比率・返済可能期間・定性評価をスコアリングして、銀行が「この会社をどう支援するか」を判定した結果です。",why:"銀行は融資額を決める前に「この会社は支援に値するか」という定性的な判断を行います。「高」なら積極支援、「中」なら条件付き支援、「要改善」なら原則的に融資が難しい状態です。",formula:"調整純資産・自己資本比率・DCR・定性評価の複合スコア",good:"「高」評価に近づくには自己資本比率30%以上・DCR7年以内が鍵"},
  所用運転資金:{what:"「売上債権＋棚卸資産 − 買入債務」で計算される、事業を回すために常時必要な運転資金の量です。",why:"銀行は運転資金融資を「所用運転資金の範囲内」でしか支援しません。これを超える資金需要には資金使途の説明が必要で、難色を示されることがあります。",formula:"（評価売掛金 ＋ 評価在庫）− 買入債務",good:"既存借入の30〜40%が運転資金目的の場合は範囲内に収まることが多い"},
  自己資本比率:{what:"総資産のうち、返済不要の自己資本（純資産）がどれだけあるかを示す比率です。",why:"「会社の体力」を示す指標です。低いと融資が難しくなり、30%未満では審査で指摘事項になることが多いです。",formula:"純資産 ÷ 総資産 × 100",good:"30%以上が目安。20%未満は要改善"},
};
function GlossaryButton({term}){
  const [open,setOpen]=useState(false);const info=GLOSSARY[term];if(!info)return null;
  return(<>
    <button onClick={()=>setOpen(true)} style={{background:SOFT,border:`1px solid ${BD}`,borderRadius:"50%",width:20,height:20,display:"inline-flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,padding:0,transition:"all .12s"}}
      onMouseEnter={e=>{e.currentTarget.style.background=GL2;e.currentTarget.style.borderColor=G;}} onMouseLeave={e=>{e.currentTarget.style.background=SOFT;e.currentTarget.style.borderColor=BD;}}>
      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke={T3} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    </button>
    {open&&<div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div onClick={e=>e.stopPropagation()} style={{background:CARD,borderRadius:20,padding:26,maxWidth:440,width:"100%",boxShadow:"0 24px 64px rgba(0,0,0,0.18)",position:"relative"}}>
        <button onClick={()=>setOpen(false)} style={{position:"absolute",top:14,right:14,background:SOFT,border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke={T2} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div style={{fontSize:17,fontWeight:900,color:T1,marginBottom:16,fontFamily:"Noto Sans JP,sans-serif"}}>{term}</div>
        <div style={{marginBottom:12}}><div style={{fontSize:9,fontWeight:700,color:G,letterSpacing:".12em",textTransform:"uppercase",fontFamily:"Inter,sans-serif",marginBottom:5}}>What — どういう意味？</div><div style={{fontSize:13,color:T2,lineHeight:1.85,fontWeight:500}}>{info.what}</div></div>
        <div style={{marginBottom:14}}><div style={{fontSize:9,fontWeight:700,color:PRP,letterSpacing:".12em",textTransform:"uppercase",fontFamily:"Inter,sans-serif",marginBottom:5}}>Why — 銀行が見る理由</div><div style={{fontSize:13,color:"#4C1D95",lineHeight:1.85,padding:"12px 14px",background:PRPBG,borderRadius:11,borderLeft:`3px solid ${PRP}`,fontWeight:500}}>{info.why}</div></div>
        <div style={{display:"flex",gap:8}}>
          <div style={{flex:1,background:SOFT,borderRadius:11,padding:"11px 13px"}}><div style={{fontSize:9,color:T3,fontWeight:700,marginBottom:4}}>計算式</div><div style={{fontSize:11,color:T1,fontWeight:700,lineHeight:1.5}}>{info.formula}</div></div>
          <div style={{flex:1,background:GL2,borderRadius:11,padding:"11px 13px"}}><div style={{fontSize:9,color:GD,fontWeight:700,marginBottom:4}}>目安</div><div style={{fontSize:11,color:GD,fontWeight:700,lineHeight:1.5}}>{info.good}</div></div>
        </div>
      </div>
    </div>}
  </>);
}
 
// ── 与信診断の視覚化パーツ ──────────────────────
function AdjustedEquityWaterfall({result}){
  const items=[
    {label:"帳簿純資産",value:result.bookEquity,type:"base",note:"決算書の純資産合計",term:null},
    {label:"在庫評価差額",value:-Math.round(result.invGap),type:"minus",note:`帳簿${result.totalBookInv}万円 → 評価${Math.round(result.evalInv)}万円（仕掛品×0.15、製品×0.55等）`,term:"仕掛品換価率"},
    {label:"売掛金評価差額",value:-Math.round(result.recGap),type:"minus",note:`帳簿${result.totalBookRec}万円 → 評価${Math.round(result.evalRec)}万円（遅延分を割引評価）`,term:"売掛金換価率"},
    {label:"調整純資産",value:Math.round(result.adjEquity),type:"result",note:"銀行が実態として見る純資産",term:"調整純資産"},
  ];
  const mx=result.bookEquity;
  return(
    <div>
      {items.map((item,i)=>{
        const isR=item.type==="result",isM=item.type==="minus";
        const bc=isR?G:isM?RED:"#94A3B8",pct=Math.abs(item.value)/mx*100;
        return(
          <div key={i} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                  <div style={{fontSize:12,fontWeight:isR?800:600,color:isR?G:T1}}>{item.label}</div>
                  {item.term&&<GlossaryButton term={item.term}/>}
                </div>
                <div style={{fontSize:10,color:T3,lineHeight:1.5}}>{item.note}</div>
              </div>
              <div style={{fontSize:16,fontWeight:900,color:isR?G:isM?RED:T1,fontFamily:"Inter,sans-serif",flexShrink:0,marginLeft:12}}>
                {isM&&item.value<0?"▼ ":isR?"= ":""}{Math.abs(item.value).toLocaleString()}万円
              </div>
            </div>
            <div style={{height:isR?8:6,background:BD,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(100,pct)}%`,background:bc,borderRadius:4}}/></div>
            {i===2&&<div style={{borderTop:`1.5px solid ${BD}`,marginTop:8,marginBottom:2}}/>}
          </div>
        );
      })}
    </div>
  );
}
function InventoryBreakdown({inputs}){
  const items=[{label:"原材料",book:inputs.invRaw,rate:0.35,note:"換価率35%：市場売却は可能だが業種特化品は低評価"},{label:"仕掛品",book:inputs.invWip,rate:0.15,note:"換価率15%：他社では使えない中途半端な状態のもの。銀行が最も低く見る"},{label:"製品",book:inputs.invFinished,rate:0.55,note:"換価率55%：完成品は流動性があるが在庫整理時の値引きを考慮"}].filter(x=>x.book>0);
  return(<div>{items.map((item,i)=>(
    <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<items.length-1?`1px solid ${BD}`:"none"}}>
      <div style={{flex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
          <span style={{fontSize:12,fontWeight:700,color:T1}}>{item.label}</span>
          <span style={{fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:999,background:item.rate>=0.5?GL2:item.rate>=0.3?YLWBG:REDBG,color:item.rate>=0.5?GD:item.rate>=0.3?YLWTC:REDTC}}>換価率 {Math.round(item.rate*100)}%</span>
        </div>
        <div style={{fontSize:10,color:T3,lineHeight:1.5}}>{item.note}</div>
      </div>
      <div style={{textAlign:"right",flexShrink:0}}>
        <div style={{fontSize:11,color:T3,fontWeight:600}}>{item.book}万円</div>
        <div style={{fontSize:14,fontWeight:900,color:item.rate<0.3?RED:T1,fontFamily:"Inter,sans-serif"}}>→ {Math.round(item.book*item.rate)}万円</div>
      </div>
    </div>
  ))}</div>);
}
function BindingConstraintCard({result}){
  const isA=result.binding==="asset";
  return(
    <div style={{borderRadius:16,overflow:"hidden",border:`1.5px solid ${isA?YLWBR:PRPBR}`}}>
      <div style={{background:isA?YLW:PRP,padding:"10px 18px"}}><span style={{fontSize:12,fontWeight:800,color:"#fff"}}>制約条件：{isA?"資産回収力（担保・純資産）が上限を決めています":"返済能力（EBITDA・CF）が上限を決めています"}</span></div>
      <div style={{background:isA?YLWBG:PRPBG,padding:"16px 18px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          {[{label:"資産側上限",val:Math.round(result.assetCeil),isB:isA,bc:isA?YLWBR:BD,oc:isA?`2px solid ${YLW}`:"none",tc:isA?YLWTC:T1,term:"資産側上限"},{label:"返済側上限",val:Math.round(result.debtCeil),isB:!isA,bc:!isA?PRPBR:BD,oc:!isA?`2px solid ${PRP}`:"none",tc:!isA?PRPTC:T1,term:"返済側上限"}].map(item=>(
            <div key={item.label} style={{background:"rgba(255,255,255,0.7)",borderRadius:12,padding:"12px 14px",border:`1.5px solid ${item.bc}`,outline:item.oc}}>
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}><div style={{fontSize:10,color:T3,fontWeight:600}}>{item.label}</div><GlossaryButton term={item.term}/></div>
              <div style={{fontSize:20,fontWeight:900,color:item.tc,fontFamily:"Inter,sans-serif"}}>{item.val.toLocaleString()}万円</div>
              {item.isB&&<div style={{fontSize:9,fontWeight:700,color:item.tc,marginTop:3}}>← この数値が制約</div>}
            </div>
          ))}
        </div>
        <div style={{fontSize:13,color:T1,lineHeight:1.8,fontWeight:500}}>{isA?"在庫・売掛金の評価損と自己資本比率の低さが融資可能額の天井になっています。担保を積むか、在庫回転・売掛金管理を改善することで上限が上がります。":`正常化EBITDA（${Math.round(result.ebitda)}万円）に対して借入残高が重く、返済能力が天井になっています。役員報酬の適正化・利益率改善でEBITDAを上げることが最優先です。`}</div>
      </div>
    </div>
  );
}
function SensitivityPanel({result}){
  if(!result.sensitivities.length)return null;
  return(
    <Card style={{background:PRPBG,border:`1px solid ${PRPBR}`}}>
      <SL color={PRPTC}>感度分析 — ここを改善すると融資額がいくら増えるか</SL>
      {result.sensitivities.map((s,i)=>(
        <div key={i} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"10px 0",borderBottom:i<result.sensitivities.length-1?`1px solid ${PRPBR}`:"none"}}>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:T1,marginBottom:4}}>{s.label}</div><div style={{fontSize:11,color:T2,lineHeight:1.65,fontWeight:500}}>{s.note}</div></div>
          <div style={{flexShrink:0,textAlign:"right"}}><div style={{fontSize:10,color:PRPTC,fontWeight:700,marginBottom:1}}>融資額の増加</div><div style={{fontSize:18,fontWeight:900,color:PRPTC,fontFamily:"Inter,sans-serif"}}>+{Math.round(s.delta).toLocaleString()}万円</div></div>
        </div>
      ))}
    </Card>
  );
}
 
// ── CFOカード生成 ─────────────────────────────────
const PRIORITIES_CFO=[
  {id:"urgent",   label:"今すぐ対処すべきこと",   bg:REDBG,border:REDBR,tc:REDTC,dot:RED,hdr:RED,labelShort:"Priority 01"},
  {id:"midterm",  label:"6ヶ月以内に検討すること", bg:YLWBG,border:YLWBR,tc:YLWTC,dot:YLW,hdr:YLW,labelShort:"Priority 02"},
  {id:"longterm", label:"1〜3年の資金戦略",        bg:GL2,  border:GL,   tc:GD,   dot:G,  hdr:G,  labelShort:"Priority 03"},
  {id:"opportunity",label:"見逃している調達機会",  bg:PRPBG,border:PRPBR,tc:PRPTC,dot:PRP,hdr:PRP,labelShort:"Priority 04"},
];
function buildCFOCards(result,inp){
  const isA=result.binding==="asset";
  const adj=Math.round(result.bookEquity-result.adjEquity);
  const invWip=inp.invWip||400;const invTotal=inp.invRaw+inp.invWip+inp.invFinished;
  return[
    {priority:"urgent",
      title:isA?`帳簿純資産${result.bookEquity}万円が銀行評価では${Math.round(result.adjEquity)}万円になっています。${adj}万円の評価損が融資額の天井を下げています`:`正常化EBITDA${Math.round(result.ebitda)}万円に対して借入${result.interestBearingDebt}万円は重すぎます。返済能力が融資の上限を決めています`,
      summary:isA?`銀行は帳簿上の在庫をそのまま評価しません。仕掛品は換価率15%、原材料は35%で評価するため、帳簿在庫${invTotal}万円が評価後${Math.round(result.evalInv)}万円まで落ちています。この差額${Math.round(result.invGap)}万円が純資産から差し引かれ、資産側の融資上限を${Math.round(result.assetCeil)}万円に制限しています。特に仕掛品${invWip}万円の換価率が15%と極端に低く、「他社では使えない中途半端な状態の製品」として銀行は価値をほとんど認めません。`:`EBITDA倍率（ネット有利子負債÷正常化EBITDA）が現在${result.ebitdaMult?.toFixed(1)||"—"}倍で、景気敏感業種の上限${result.multiplier}倍${result.ebitdaMult&&result.ebitdaMult>result.multiplier?"を超えています":"に近づいています"}。DSCRは${result.dscr?.toFixed(2)||"—"}で${result.dscrStatus==="good"?"良好水準":result.dscrStatus==="standard"?"標準水準ですがもう一段の改善で信用力が上がります":result.dscrStatus==="caution"?"要注意水準で銀行の追加融資が難しい状態です":"融資困難水準です"}。`,
      action:isA?"仕掛品の製品化サイクルを短縮し、在庫回転率の改善計画を作成する":"役員報酬の見直しと利益率改善でEBITDAを年200万円以上引き上げる",
      detail:{
        narrative:[
          {heading:isA?"銀行はなぜ在庫をこんなに低く評価するのか":"EBITDA倍率と融資可能額の関係",
           body:isA?`銀行の在庫評価は「清算したら実際にいくらになるか」という視点で行われます。製造業の仕掛品は特定の製品向けに加工された材料であるため、取引先が倒産・撤退した場合に他社での転用が難しく、換価率15%という極めて低い評価になります。貴社の場合、仕掛品${invWip}万円が${Math.round(invWip*0.15)}万円に評価されており、差額${Math.round(invWip*0.85)}万円が純資産から消えています。仕掛品の滞留を減らすだけで直接的に資産評価が上がります。`:`EBITDA倍率とは「ネット有利子負債が年間EBITDAの何倍あるか」を示す指標です。景気敏感業種（製造業の多く）では2.5〜3.0倍が銀行の許容上限であり、これを超えると「現在の収益力では返済が困難」と判断されます。貴社の正常化EBITDAは${Math.round(result.ebitda)}万円ですが、過大役員報酬の調整や一過性損失の戻し入れで実態EBITDAをもう100〜200万円改善できる余地があります。`},
          {heading:isA?"売掛金の遅延管理も重要です":"DSCRを1.5以上に持っていく方法",
           body:isA?`売掛金も銀行は額面通りに評価しません。30〜90日遅延分は50%評価、90日超は20%評価です。遅延売掛金が${(inp.receivablesDelayed30||0)+(inp.receivablesDelayed90||0)}万円あり、評価差額${Math.round(result.recGap)}万円が純資産を削っています。取引先の入金管理を強化し、遅延が発生したら即座に督促・回収する体制を作ることで評価売掛金が改善されます。`:`DSCRを1.5以上にするためには年間元利返済額を変えずにEBITDAを上げるか、繰り上げ返済で返済額を減らすかの2つしかありません。最も現実的なのは①役員報酬の節税目的圧縮分を戻してEBITDAを正常化する（年240万円程度）、②ものづくり補助金採択後に750万円を繰り上げ返済して元金を減らす、の組み合わせです。`},
          {heading:"改善すると融資可能額がどう変わるか",
           body:result.sensitivities.length>0?result.sensitivities.map(s=>`${s.label}：+${Math.round(s.delta)}万円（${s.note}）`).join("。")+"。これらの改善を組み合わせると融資可能額が大幅に拡大します。":`現在の与信モデルでは融資可能額${Math.round(result.final)}万円が算出されています。財務改善と並行して、定性評価の加点要因（月次管理の迅速化・顧客分散）を整備することで最終融資額をさらに引き上げられます。`},
        ],
        benchmarks:[
          {label:"帳簿純資産",value:`${result.bookEquity}万円`,bench:`調整後 ${Math.round(result.adjEquity)}万円`,gap:`差額 -${adj}万円`,status:adj>500?"bad":"warning"},
          {label:"在庫評価差額",value:`-${Math.round(result.invGap)}万円`,bench:"換価可能額ベースに調整",gap:"仕掛品が主因",status:result.invGap>200?"bad":"warning"},
          {label:"DSCR",value:result.dscr?result.dscr.toFixed(2):"—",bench:"1.5以上が良好",gap:result.dscrStatus,status:result.dscrStatus},
        ],
        actions:isA?[
          {timing:"今すぐ",text:"仕掛品の製品化サイクルを短縮するため、生産スケジュールと工程管理を見直す。仕掛品残高を現状から40%削減する計画を立てる。",impact:`資産評価 +${Math.round((invWip*0.4)*(0.55-0.15))}万円`},
          {timing:"1〜2ヶ月",text:"30日以上遅延している売掛金の回収強化。与信限度額の設定と入金サイクルの統一を実施する。",impact:`売掛評価 +${Math.round(result.recGap*0.5)}万円`},
          {timing:"3ヶ月以内",text:"改善を数値化した資料を持参し、政策公庫・地銀に事前相談。「調整純資産改善計画」として提示し審査担当者に改善意欲を示す。",impact:"融資審査の前向き検討につなげる"},
        ]:[
          {timing:"今月",text:"税理士と協議し、節税目的で圧縮している役員報酬の適正水準を確認。正常化EBITDAに反映させた財務計画書を作成する。",impact:`EBITDA +${Math.round(result.ebitda-(inp.operatingProfit||290)-(inp.depreciation||180))+240}万円改善`},
          {timing:"補助金採択後",text:"ものづくり補助金750万円を受領後、即繰り上げ返済を実行。ネット有利子負債を削減しEBITDA倍率を改善する。",impact:`EBITDA倍率 -${(750/result.ebitda).toFixed(1)}倍改善`},
          {timing:"1年以内",text:"プロパー融資への切り替え交渉を地銀担当者と開始。DSCR1.5以上を達成してから金利引き下げ交渉を進める。",impact:"年間利息 -60万円"},
        ],
      },
    },
    {priority:"midterm",
      title:"材料費率38%・不良率3.2%：この2つで年間230万円の損失が出ており、設備更新と同時に手を打つべきです",
      summary:"貴社の損益計算書を見ると、売上原価率が60%で業界平均の58%を2ポイント上回っています。この差は年間100万円の利益差に相当します。材料費率が業界平均より3ポイント高いこと（差額150万円/年）と、不良率3.2%による廃棄ロスが年間約80万円あることが主因です。設備更新を検討している今がこの2つを同時に改善できる最大のチャンスです。",
      action:"政策公庫の事前相談を今月中に予約し、融資と補助金の申請を並行準備する",
      detail:{
        narrative:[
          {heading:"材料費率38%はなぜ高いのか",body:"業界平均の材料費率35%に対して3ポイント高い状態です。調達先が1〜2社に集中していると価格交渉力が弱くなります。月次発注を四半期まとめ発注に切り替えることで通常5〜8%のコスト削減が可能です。愛知県の金属加工業では、調達先を3社以上に分散した企業の7割が材料費率を2ポイント以上改善しているというデータがあります。"},
          {heading:"不良率3.2%の本当のコスト",body:`不良率3.2%は業界平均1.5%の約2倍です。表面上の廃棄ロスは年間80万円ですが、手直し工数・検査工数・顧客クレーム対応を含めると年間150〜200万円規模の損失になっているはずです。設備更新にAI画像検査装置を追加することで不良率を0.5%以下に抑えられます。AI画像検査装置はものづくり補助金の対象経費に含まれるため、実質25〜40万円程度の負担で年間80万円の損失を解消できます。`},
          {heading:"設備更新と補助金のタイミングを合わせる理由",body:`ものづくり補助金は採択後に設備を発注・購入し後払いで補助金が入金されます。政策公庫のつなぎ融資を先に実行しておくことでこの問題を解消できます。融資申請は直近の良好な決算書が使えるうちに行うことが重要で、決算後6ヶ月を超えると審査が複雑化するため今から2ヶ月以内の申請を強く推奨します。`},
        ],
        benchmarks:[
          {label:"売上原価率",value:"60%",bench:"業界平均 58%",gap:"+2pt（差額100万円/年）",status:"bad"},
          {label:"材料費率",value:"38%",bench:"業界平均 35%",gap:`+3pt（差額150万円/年）`,status:"bad"},
          {label:"不良率",value:"3.2%",bench:"業界平均 1.5%",gap:`廃棄ロス年80万円`,status:"bad"},
        ],
        actions:[
          {timing:"今すぐ",text:"主要材料サプライヤー3社以上から相見積もりを取得。発注ロットの見直しも並行して実施。",impact:"材料費率-2pt（年100万円）"},
          {timing:"1ヶ月以内",text:"政策公庫に事前相談を予約し、ものづくり補助金の申請書をトルモで作成。AI画像検査を対象経費に含める。",impact:`補助金750万円＋不良率改善80万円/年`},
          {timing:"設備導入後",text:"不良率の月次モニタリングを開始し、DSCRへの改善効果を数値で追跡。次回融資申請の根拠資料として蓄積する。",impact:`返済側上限 +${Math.round((80+150)*result.multiplier)}万円の改善`},
        ],
      },
    },
    {priority:"longterm",
      title:"今の借入構造を2年間維持すると利息だけで120万円余分に払います。プロパー融資への切り替え計画を今から作るべきです",
      summary:`現在のEBITDA倍率は${result.ebitdaMult?.toFixed(1)||"約8"}倍で、景気敏感業種の銀行許容上限${result.multiplier}倍を超えています。この状態ではプロパー融資（保証なしの直接融資）の申請は難しく、政策公庫や保証付き融資に依存せざるを得ません。EBITDA倍率を3倍台に改善することで、金利1.8%→1.2%へのプロパー移行が現実的になり、残高2,000万円に対して年60万円の利息削減が見込めます。`,
      action:"今期末にメインバンクの担当者へ経営計画書を共有し、関係構築を始める",
      detail:{
        narrative:[
          {heading:"プロパー融資と保証付き融資の本質的な違い",body:"現在の政策公庫融資や信用保証協会付き融資は、銀行・公庫にとってリスクが低い商品のため金利が高めに設定されています。一方、地銀のプロパー融資は担当者が「この会社なら返してくれる」と判断して銀行の自己リスクで貸す商品です。金利は交渉次第で1.0%台まで下がることがあります。"},
          {heading:"2年間で何を積み上げるか",body:"地銀がプロパー融資を判断する際に見るのは、①返済の遅延がないこと、②自己資本比率が改善傾向にあること、③売上・利益が安定または成長していること、④担当者に経営状況を定期的に開示していること、の4点です。貴社は①と③はすでに満たしており、②を2年以内に30%超にすること、④を今から始めることが課題です。"},
          {heading:"切り替えによる長期的な効果",body:`金利1.8%→1.2%への切り替えで残高2,000万円に対して年60万円の節約は、10年間では600万円になります。またプロパー融資の実績ができると次の資金調達がより柔軟になり、設備増強・M&A・事業承継など将来の大型投資にも対応しやすくなります。`},
        ],
        benchmarks:[
          {label:"EBITDA倍率（現在）",value:`${result.ebitdaMult?.toFixed(1)||"—"}倍`,bench:`目標 ${result.multiplier}倍以下`,gap:"プロパー移行の条件",status:result.ebitdaMult&&result.ebitdaMult>result.multiplier?"bad":"warning"},
          {label:"現在の金利",value:"1.8%",bench:"プロパー目標 1.2%",gap:"年間60万円削減可能",status:"warning"},
          {label:"繰り上げ返済の効果",value:"750万円（補助金活用）",bench:`倍率 -${(750/result.ebitda).toFixed(1)}倍改善`,gap:"",status:"good"},
        ],
        actions:[
          {timing:"今期末",text:"メインバンク担当者に決算書・設備投資計画を共有。「2年後にプロパー移行を目指している」と明示する。",impact:"関係構築の開始"},
          {timing:"補助金採択後",text:"補助金750万円を受領後に即繰り上げ返済。EBITDA倍率の改善を数値で示し中間報告を実施。",impact:`EBITDA倍率 -${(750/result.ebitda).toFixed(1)}倍改善`},
          {timing:"2〜3年後",text:"プロパー融資への借換え交渉を本格開始。複数行からの提示を受け最も条件の良い行と契約。",impact:"年間-60万円の利息削減"},
        ],
      },
    },
    {priority:"opportunity",
      title:"ものづくり補助金＋キャリアアップ助成金の組み合わせで、1,500万円の投資が実質340万円の自己負担になります",
      summary:"設備投資1,500万円に対して、ものづくり補助金（最大750万円）とキャリアアップ助成金（2名正社員化で最大160万円）、政策公庫のつなぎ融資（250万円）を組み合わせると、自己負担を340万円まで圧縮できます。この3つを同時に活用している製造業は全体の12%に過ぎません。",
      action:"ハローワークにキャリアアップ助成金の対象要件を確認し、正社員化計画を設計する",
      detail:{
        narrative:[
          {heading:"なぜキャリアアップ助成金と組み合わせるのか",body:`ものづくり補助金は設備投資に対する補助ですが、キャリアアップ助成金は「非正規社員を正社員に転換した事業主」への助成金で、両者は補助対象が完全に別なため同時申請・受給ができます。自動化ラインの導入で省人化される2名分の工数を品質管理・営業サポートへの正社員転換に活用することで助成金の要件を満たせます。1人80万円×2名=160万円です。`},
          {heading:"政策公庫のつなぎ融資が必要な理由",body:"補助金は「先に設備を購入し、後から補助金が入金される」後払い方式です。設備代金の支払いから補助金入金まで通常3〜5ヶ月かかるため、この期間を資金繰りでカバーする必要があります。政策公庫のつなぎ融資は補助金の採択通知を担保に低利で借りられる仕組みで、補助金が入金されたら即繰り上げ返済します。"},
          {heading:"申請スケジュールを組み立てる",body:`ものづくり補助金の公募は年に3〜4回あり、申請から採択通知まで約3ヶ月、採択から交付決定まで2ヶ月、設備納入・検収・実績報告から補助金入金まで2ヶ月と合計7〜8ヶ月かかります。今月から動き始めれば、来年度内に全ての資金を受け取ることができます。申請書類の作成で最も時間がかかる事業計画書は、トルモを使うことで大幅に短縮できます。`},
        ],
        benchmarks:[
          {label:"設備投資額",value:"1,500万円",bench:"自己負担 340万円まで圧縮可",gap:"▲1,160万円を外部資金で調達",status:"good"},
          {label:"ものづくり補助金",value:"最大 750万円",bench:"補助率1/2",gap:"申請書はトルモで作成",status:"good"},
          {label:"EBITDA倍率改善",value:`-${(750/result.ebitda).toFixed(1)}倍`,bench:"繰り上げ返済750万円の効果",gap:"",status:"good"},
        ],
        actions:[
          {timing:"今すぐ",text:"ハローワークでキャリアアップ助成金の対象要件（雇用保険加入・転換計画の事前届出）を確認。転換予定2名を選定する。",impact:"助成金160万円の権利確定"},
          {timing:"1ヶ月以内",text:"政策公庫に融資申請。ものづくり補助金の申請書をトルモで作成し、認定支援機関の確認を経て提出。",impact:"補助金750万円＋つなぎ融資確保"},
          {timing:"採択後",text:"設備発注・正社員転換手続きを同時進行。補助金入金後に繰り上げ返済し、EBITDA倍率の改善をメインバンクに報告。",impact:`合計1,160万円の外部資金確保`},
        ],
      },
    },
  ];
}
function CFOCardComponent({card,p}){
  const [open,setOpen]=useState(false);
  const ss={good:{bg:GL2,border:GL,tc:GD},warning:{bg:YLWBG,border:YLWBR,tc:YLWTC},bad:{bg:REDBG,border:REDBR,tc:REDTC},standard:{bg:BLUBG,border:BLUBR,tc:BLUTC},caution:{bg:YLWBG,border:YLWBR,tc:YLWTC},reject:{bg:REDBG,border:REDBR,tc:REDTC}};
  return(
    <div style={{borderRadius:18,marginBottom:14,overflow:"hidden",boxShadow:open?"0 8px 32px rgba(0,0,0,0.1)":SH,border:`1.5px solid ${open?p.dot:p.border}`,transition:"border-color .2s"}}>
      <div style={{background:p.hdr,padding:"10px 22px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:13,fontWeight:800,color:"#fff",fontFamily:"Noto Sans JP,sans-serif"}}>{p.label}</span>
        <span style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.65)",fontFamily:"Inter,sans-serif",letterSpacing:".1em"}}>{p.labelShort}</span>
      </div>
      <div style={{background:p.bg,padding:"20px 22px"}}>
        <div style={{fontSize:15,fontWeight:900,color:T1,letterSpacing:"-.02em",marginBottom:14,fontFamily:"Noto Sans JP,sans-serif",lineHeight:1.5}}>{card.title}</div>
        <div style={{fontSize:13,color:T1,lineHeight:1.95,marginBottom:16,padding:"14px 16px",background:"rgba(255,255,255,0.7)",borderRadius:12,borderLeft:`3px solid ${p.dot}`,fontWeight:500}}>{card.summary}</div>
        <div style={{background:p.hdr,borderRadius:12,padding:"12px 16px",marginBottom:16}}>
          <div style={{fontSize:9,fontWeight:800,color:"rgba(255,255,255,0.7)",letterSpacing:".12em",textTransform:"uppercase",fontFamily:"Inter,sans-serif",marginBottom:5}}>今すぐ始めること</div>
          <div style={{fontSize:13,fontWeight:800,color:"#fff",lineHeight:1.55}}>{card.action}</div>
        </div>
        <button onClick={()=>setOpen(v=>!v)} style={{display:"flex",alignItems:"center",gap:7,background:"rgba(255,255,255,0.85)",border:`1.5px solid ${p.border}`,borderRadius:10,padding:"9px 18px",fontSize:12,fontWeight:700,color:p.tc,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,1)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.85)";}}>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {open?<polyline points="18 15 12 9 6 15"/>:<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}
          </svg>
          {open?"詳細分析を閉じる":"詳細分析・改善根拠を見る"}
        </button>
        {open&&(
          <div style={{marginTop:18,paddingTop:18,borderTop:`1.5px solid ${p.border}`}}>
            <div style={{marginBottom:20}}>
              <SL color={p.tc}>詳細分析</SL>
              {card.detail.narrative.map((n,i)=>(
                <div key={i} style={{marginBottom:i<card.detail.narrative.length-1?18:0}}>
                  <div style={{fontSize:12,fontWeight:800,color:p.tc,marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:18,height:18,borderRadius:6,background:p.hdr,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:9,fontWeight:800,color:"#fff"}}>{i+1}</span></div>
                    {n.heading}
                  </div>
                  <div style={{fontSize:13,color:T1,lineHeight:2,paddingLeft:26,fontWeight:500}}>{n.body}</div>
                </div>
              ))}
            </div>
            <div style={{marginBottom:20}}>
              <SL color={p.tc}>指標の比較</SL>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {card.detail.benchmarks.map((b,i)=>{
                  const s=ss[b.status]||ss.warning;
                  return(
                    <div key={i} style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:12,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:11,color:T3,fontWeight:600,marginBottom:3}}>{b.label}</div>
                        <div style={{display:"flex",alignItems:"baseline",gap:10,flexWrap:"wrap"}}>
                          <span style={{fontSize:18,fontWeight:900,color:s.tc,fontFamily:"Inter,sans-serif"}}>{b.value}</span>
                          <span style={{fontSize:11,color:T3,fontWeight:500}}>vs {b.bench}</span>
                        </div>
                      </div>
                      {b.gap&&<span style={{fontSize:10,fontWeight:700,color:s.tc,background:"rgba(255,255,255,0.8)",padding:"3px 9px",borderRadius:999,flexShrink:0,border:`1px solid ${s.border}`}}>{b.gap}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <SL color={p.tc}>アクションプラン</SL>
              {card.detail.actions.map((a,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 0",borderBottom:i<card.detail.actions.length-1?`1px solid ${p.border}`:"none"}}>
                  <span style={{fontSize:10,fontWeight:800,padding:"3px 9px",borderRadius:999,background:"rgba(255,255,255,0.8)",color:p.tc,border:`1px solid ${p.border}`,flexShrink:0,whiteSpace:"nowrap",marginTop:2}}>{a.timing}</span>
                  <div style={{flex:1,fontSize:13,color:T1,lineHeight:1.8,fontWeight:500}}>{a.text}</div>
                  <span style={{fontSize:11,fontWeight:800,color:p.tc,flexShrink:0,whiteSpace:"nowrap",marginTop:2}}>{a.impact}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
 
// ── 融資診断フルパネル（全タブ） ─────────────────
const FINANCE_TABS=[{id:"diagnosis",l:"与信診断"},{id:"cfo",l:"CFOエージェント"},{id:"lender",l:"金融機関おすすめ"},{id:"sim",l:"金利シミュ"},{id:"collateral",l:"担保判定"},{id:"compare",l:"調達手段比較"},{id:"reschedule",l:"リスケ相談"},{id:"scheme",l:"組み合わせスキーム"},{id:"reading",l:"決算書の読み方"},{id:"checklist",l:"書類チェック"}];
 
function DebtFinancePanel({inputs,result}){
  const [tab,setTab]=useState("diagnosis");
  const [showInputs,setShowInputs]=useState(false);
  const [inp,setInp]=useState(inputs);
  const [liveResult,setLiveResult]=useState(result);
  const setF=(k,v)=>{const ni={...inp,[k]:typeof v==="boolean"?v:parseFloat(v)||0};setInp(ni);setLiveResult(calcCreditModel(ni));};
  const r=liveResult;
  const dscrColor=r.dscrStatus==="good"?G:r.dscrStatus==="standard"?BLU:r.dscrStatus==="caution"?YLW:RED;
  const vMap={APPROVE:{bg:GL2,tc:GD,hdr:G,label:"承認見込み（APPROVE）",sub:"現在の財務状況で融資申請が見込まれます"},CONDITIONAL:{bg:YLWBG,tc:YLWTC,hdr:YLW,label:"条件付（CONDITIONAL）",sub:"財務改善または担保追加を条件に融資が見込まれます"},REJECT:{bg:REDBG,tc:REDTC,hdr:RED,label:"否決リスク（REJECT）",sub:"現状では融資審査が通りにくい状態です"}};
  const v=vMap[r.verdict]||vMap.CONDITIONAL;
  const cfoCards=useMemo(()=>buildCFOCards(r,inp),[r]);
 
  return(
    <div>
      {/* タブナビ */}
      <div style={{display:"flex",gap:4,overflowX:"auto",marginBottom:14}}>
        {FINANCE_TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"7px 14px",borderRadius:999,border:"none",whiteSpace:"nowrap",background:tab===t.id?CARD:"transparent",color:tab===t.id?T1:T2,fontSize:11,fontWeight:tab===t.id?700:500,boxShadow:tab===t.id?SH:"none",cursor:"pointer",fontFamily:"inherit",transition:"all .12s"}}>{t.l}</button>)}
      </div>
 
      {/* 与信診断 */}
      {tab==="diagnosis"&&(
        <div>
          {/* 判定バナー */}
          <div style={{borderRadius:16,overflow:"hidden",marginBottom:12,border:`1.5px solid ${v.tc}`}}>
            <div style={{background:v.hdr,padding:"10px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,fontWeight:800,color:"#fff"}}>{v.label}</span>
              <span style={{fontSize:11,color:"rgba(255,255,255,.7)",fontWeight:600}}>{v.sub}</span>
            </div>
            <div style={{background:v.bg,padding:"16px 18px",display:"flex",alignItems:"center",gap:24,flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:11,color:v.tc,fontWeight:600,marginBottom:2}}>推定融資可能額</div>
                <div style={{fontSize:36,fontWeight:900,color:v.tc,fontFamily:"Inter,sans-serif",lineHeight:1}}>{Math.round(r.final).toLocaleString()}万円</div>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {/* 銀行から見た信用度（セグメント翻訳） */}
                <div style={{background:"rgba(255,255,255,0.7)",borderRadius:10,padding:"8px 12px",border:`1px solid ${r.creditRating==="高"?G:r.creditRating==="中"?YLWBR:REDBR}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                    <div style={{fontSize:9,color:T3,fontWeight:600}}>銀行から見た信用度</div>
                    <GlossaryButton term="銀行から見た信用度"/>
                  </div>
                  <div style={{fontSize:16,fontWeight:900,color:r.creditRating==="高"?GD:r.creditRating==="中"?YLWTC:REDTC,fontFamily:"Inter,sans-serif"}}>{r.creditRating}</div>
                </div>
                {/* 資金使途 */}
                <div style={{background:"rgba(255,255,255,0.7)",borderRadius:10,padding:"8px 12px",border:`1px solid ${BD}`}}>
                  <div style={{fontSize:9,color:T3,fontWeight:600,marginBottom:2}}>資金使途</div>
                  <div style={{fontSize:14,fontWeight:800,color:T1}}>{r.fundPurpose==="working"?"運転資金":"設備資金"}</div>
                </div>
              </div>
            </div>
          </div>
 
          {/* 信用度の根拠（セグメントの説明） */}
          <Card style={{background:r.creditRating==="高"?GL2:r.creditRating==="中"?YLWBG:REDBG,border:`1.5px solid ${r.creditRating==="高"?GL:r.creditRating==="中"?YLWBR:REDBR}`}}>
            <SL color={r.creditRating==="高"?GD:r.creditRating==="中"?YLWTC:REDTC}>銀行の支援スタンス（内部評価の翻訳）</SL>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
              <div style={{background:"rgba(255,255,255,0.75)",borderRadius:10,padding:"10px 12px"}}>
                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                  <div style={{fontSize:9,color:T3,fontWeight:600}}>自己資本比率（推計）</div>
                  <GlossaryButton term="自己資本比率"/>
                </div>
                <div style={{fontSize:16,fontWeight:900,color:r.equityRatio>=30?GD:r.equityRatio>=20?YLWTC:REDTC,fontFamily:"Inter,sans-serif"}}>{r.equityRatio}%</div>
                <div style={{fontSize:9,color:T3,marginTop:1}}>目安：30%以上</div>
              </div>
              <div style={{background:"rgba(255,255,255,0.75)",borderRadius:10,padding:"10px 12px"}}>
                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                  <div style={{fontSize:9,color:T3,fontWeight:600}}>返済可能期間（DCR）</div>
                  <GlossaryButton term="DCR（返済可能期間）"/>
                </div>
                <div style={{fontSize:16,fontWeight:900,color:r.dcrStatus==="good"?GD:r.dcrStatus==="watch"?YLWTC:REDTC,fontFamily:"Inter,sans-serif"}}>{r.dcr?r.dcr.toFixed(1)+"年":"—"}</div>
                <div style={{fontSize:9,color:T3,marginTop:1}}>有利子負債÷3期平均EBITDA。10年超で減点</div>
              </div>
            </div>
            <div style={{fontSize:12,color:T2,lineHeight:1.75,fontWeight:500}}>
              {r.creditRating==="高"
                ?"調整純資産・自己資本比率・返済可能期間の3指標が良好水準にあり、積極的な融資支援が期待できます。担保なしでの対応も視野に入ります。"
                :r.creditRating==="中"
                ?"財務内容に改善余地がある項目があり、銀行は条件付きの支援スタンスを取る可能性があります。保証協会の利用や担保提供で対応幅が広がります。"
                :"財務状況が厳しく、現状では通常の融資審査は難しい状態です。財務改善計画の策定と提示が先決です。"}
            </div>
            {r.dcrPenalty<1&&<div style={{marginTop:8,fontSize:11,fontWeight:700,color:REDTC,padding:"6px 10px",background:REDBG,borderRadius:8}}>DCR {r.dcr?.toFixed(1)}年超のため融資可能額に{Math.round((1-r.dcrPenalty)*100)}%のペナルティが適用されています</div>}
          </Card>
 
          <div style={{marginBottom:12}}><BindingConstraintCard result={r}/></div>
 
          {/* 所用運転資金（資金使途が運転資金の場合に表示） */}
          {r.fundPurpose==="working"&&(
            <Card>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                <SL>所用運転資金（CCC）— 運転資金融資の上限</SL>
                <GlossaryButton term="所用運転資金"/>
              </div>
              <div style={{fontSize:12,color:T2,lineHeight:1.7,fontWeight:500,marginBottom:12,padding:"10px 14px",background:SOFT,borderRadius:10,borderLeft:`3px solid ${BLU}`}}>
                運転資金融資は基本的に「売上債権＋棚卸資産 − 買入債務」の所用運転資金の範囲内で支援されます。これを超えると銀行から資金使途の説明を求められます。
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {[{l:"売上債権＋棚卸資産",v:`${Math.round(r.evalRec+r.evalInv).toLocaleString()}万円`,c:T1},{l:"買入債務",v:`-${(inp.payables||0).toLocaleString()}万円`,c:REDTC},{l:"所用運転資金",v:`${Math.round(r.workingCapitalNeeds).toLocaleString()}万円`,c:GD}].map(item=>(
                  <div key={item.l} style={{background:SOFT,borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:T3,fontWeight:600,marginBottom:3}}>{item.l}</div>
                    <div style={{fontSize:15,fontWeight:900,color:item.c,fontFamily:"Inter,sans-serif"}}>{item.v}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
 
          <Card>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><SL>調整純資産 — 帳簿から銀行評価へ</SL><GlossaryButton term="調整純資産"/></div>
            <div style={{fontSize:12,color:T2,lineHeight:1.7,fontWeight:500,marginBottom:14,padding:"10px 14px",background:SOFT,borderRadius:10,borderLeft:`3px solid ${RED}`}}>
              銀行は帳簿上の純資産をそのまま信用しません。在庫・売掛金の換価可能性を厳しく評価し、「実際に回収できる金額」に修正します。{r.hasThreeYear&&"EBITDAは3期平均を使用しています。"}
            </div>
            <AdjustedEquityWaterfall result={r}/>
          </Card>
          {(inp.invRaw>0||inp.invWip>0||inp.invFinished>0)&&(
            <Card>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><SL color={RED}>在庫の換価評価 — ここが最も厳しく見られます</SL><GlossaryButton term="仕掛品換価率"/></div>
              <div style={{fontSize:12,color:T2,lineHeight:1.7,fontWeight:500,marginBottom:12,padding:"10px 14px",background:REDBG,borderRadius:10,borderLeft:`3px solid ${RED}`}}>
                特に仕掛品（WIP）は換価率15%です。「他社では使えない中途半端な製品」として銀行は極端に低く評価します。
              </div>
              <InventoryBreakdown inputs={inp}/>
            </Card>
          )}
          <Card>
            <SL>返済能力（3期平均EBITDA・DSCR・DCR）</SL>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
              {[
                {l:"3期平均EBITDA",v:`${Math.round(r.ebitdaAvg).toLocaleString()}万円`,bg:SOFT,c:T1,term:"3期平均EBITDA",sub:r.hasThreeYear?"3期平均（過大役員報酬調整後）":"推計値"},
                {l:"DSCR（返済余力）",v:r.dscr?r.dscr.toFixed(2):"—",bg:r.dscr&&r.dscr<1.2?REDBG:r.dscr&&r.dscr<1.5?YLWBG:GL2,c:dscrColor,term:"DSCR",sub:"1.5以上が良好"},
                {l:"DCR（返済可能期間）",v:r.dcr?r.dcr.toFixed(1)+"年":"—",bg:r.dcrStatus==="danger"?REDBG:r.dcrStatus==="caution"||r.dcrStatus==="watch"?YLWBG:GL2,c:r.dcrStatus==="danger"?REDTC:r.dcrStatus==="caution"||r.dcrStatus==="watch"?YLWTC:GD,term:"DCR（返済可能期間）",sub:"10年超で減点要因"},
              ].map(item=>(
                <div key={item.l} style={{background:item.bg,borderRadius:12,padding:"12px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}><div style={{fontSize:10,color:T3,fontWeight:600}}>{item.l}</div><GlossaryButton term={item.term}/></div>
                  <div style={{fontSize:18,fontWeight:900,color:item.c,fontFamily:"Inter,sans-serif"}}>{item.v}</div>
                  <div style={{fontSize:9,color:T3,marginTop:2}}>{item.sub}</div>
                </div>
              ))}
            </div>
          </Card>
          <SensitivityPanel result={r}/>
          <button onClick={()=>setShowInputs(v=>!v)} style={{width:"100%",background:CARD,border:`1.5px solid ${BD}`,borderRadius:13,height:44,fontSize:13,fontWeight:700,color:T2,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=G;e.currentTarget.style.color=GD;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=BD;e.currentTarget.style.color=T2;}}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{showInputs?<polyline points="18 15 12 9 6 15"/>:<polyline points="6 9 12 15 18 9"/>}</svg>
            {showInputs?"数字を閉じる":"自社の数字で試算する"}
          </button>
          {showInputs&&(
            <Card style={{marginTop:12}}>
              <SL>財務数字を入力（万円単位）</SL>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[["bookEquity","帳簿純資産"],["cash","現預金"],["interestBearingDebt","有利子負債"],["fixedAssetsWithCollateral","担保固定資産"],["receivables","売掛金合計"],["payables","買入債務（買掛金）"],["invRaw","原材料"],["invWip","仕掛品"],["invFinished","製品"],["ebitdaY1","EBITDA（直近期）"],["ebitdaY2","EBITDA（前期）"],["ebitdaY3","EBITDA（前々期）"]].map(([k,l])=>(
                  <div key={k}><div style={{fontSize:11,color:T2,marginBottom:4,fontWeight:600}}>{l}</div><input type="number" value={inp[k]||""} onChange={e=>setF(k,e.target.value)} style={{width:"100%",background:SOFT,border:`1.5px solid ${BD}`,borderRadius:8,padding:"8px 12px",fontSize:13,color:T1,outline:"none",fontFamily:"inherit",boxSizing:"border-box",fontWeight:600}}/></div>
                ))}
              </div>
              <div style={{marginTop:12}}>
                <div style={{fontSize:11,fontWeight:700,color:T2,marginBottom:6}}>資金使途</div>
                <div style={{display:"flex",gap:8}}>
                  {[{v:"equipment",l:"設備資金"},{v:"working",l:"運転資金"}].map(opt=>(
                    <button key={opt.v} onClick={()=>setF("fundPurpose",opt.v)} style={{flex:1,padding:"8px 0",borderRadius:10,border:`1.5px solid ${inp.fundPurpose===opt.v?G:BD}`,background:inp.fundPurpose===opt.v?GL2:SOFT,color:inp.fundPurpose===opt.v?GD:T2,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{opt.l}</button>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
 
      {/* CFOエージェント */}
      {tab==="cfo"&&(
        <div>
          <div style={{background:GRAD,borderRadius:18,padding:"22px 26px",marginBottom:16,boxShadow:SHG,position:"relative",overflow:"hidden"}}>
            <svg style={{position:"absolute",right:-25,top:-25,opacity:.12,pointerEvents:"none"}} width={140} height={140} viewBox="0 0 140 140" fill="none"><path d="M128 10 C116 -6,86 2,72 28 C58 54,90 74,76 98 C62 122,34 118,22 132" stroke="white" strokeWidth="20" strokeLinecap="round"/></svg>
            <div style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,.6)",letterSpacing:".14em",textTransform:"uppercase",fontFamily:"Inter,sans-serif",marginBottom:4}}>CFO Agent</div>
            <div style={{fontSize:18,fontWeight:900,color:"#fff",letterSpacing:"-.03em",marginBottom:4,fontFamily:"Noto Sans JP,sans-serif"}}>与信モデルに基づく財務戦略</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.8)",lineHeight:1.65,marginBottom:12,fontWeight:500}}>各カードの「詳細分析・改善根拠を見る」を押すと、業界平均との比較と具体的な改善方法が展開されます。</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {[["推定融資可能額",`${Math.round(r.final).toLocaleString()}万円`,"ok"],["制約条件",r.binding==="asset"?"資産回収力":"返済能力","warning"],["DSCR",r.dscr?.toFixed(2)||"—",r.dscrStatus==="good"||r.dscrStatus==="standard"?"ok":"warning"],["EBITDA倍率",r.ebitdaMult?r.ebitdaMult.toFixed(1)+"x":"—",r.ebitdaMult&&r.ebitdaMult>r.multiplier?"warning":"ok"]].map(([k,val,st])=>(
                <div key={k} style={{background:"rgba(255,255,255,.15)",borderRadius:8,padding:"6px 12px",display:"flex",gap:6,alignItems:"center"}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:st==="ok"?"#fff":"#FCD34D",flexShrink:0}}/>
                  <div><div style={{fontSize:9,color:"rgba(255,255,255,.6)",fontWeight:600}}>{k}</div><div style={{fontSize:12,fontWeight:800,color:"#fff"}}>{val}</div></div>
                </div>
              ))}
            </div>
          </div>
          {cfoCards.map((card,i)=>{const p=PRIORITIES_CFO.find(x=>x.id===card.priority)||PRIORITIES_CFO[2];return <CFOCardComponent key={i} card={card} p={p}/>;})
          }
        </div>
      )}
 
      {/* 金利シミュ */}
      {tab==="sim"&&<SimTab/>}
      {/* 担保判定 */}
      {tab==="collateral"&&<CollateralTab result={r}/>}
      {/* 調達手段比較 */}
      {tab==="compare"&&<CompareTab/>}
      {/* 金融機関おすすめ */}
      {tab==="lender"&&<LenderTab result={r}/>}
      {/* リスケ相談 */}
      {tab==="reschedule"&&<RescheduleTab result={r}/>}
      {/* 組み合わせスキーム */}
      {tab==="scheme"&&<SchemeTab result={r}/>}
      {/* 決算書の読み方 */}
      {tab==="reading"&&<ReadingTab result={r} onExtracted={(newInp)=>{const merged={...inp,...newInp};setInp(merged);setLiveResult(calcCreditModel(merged));setTab("diagnosis");}}/>}
      {/* 書類チェック */}
      {tab==="checklist"&&<ChecklistTab/>}
    </div>
  );
}
 
function SimTab(){
  const [amount,setAmount]=useState(1800);const [rate,setRate]=useState(1.8);const [ay,setAy]=useState(10);
  const calc=(y)=>{const P=amount*10000,r=rate/100/12,n=y*12,m=r===0?P/n:P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);return{monthly:Math.round(m/10000),total:Math.round(m*n/10000),interest:Math.round((m*n-P)/10000)};};
  const years=[3,5,7,10,15,20];const active=calc(ay);
  return(<div><Card><SL>借入額 / 金利を設定</SL>{[{label:"借入額",min:100,max:5000,step:100,val:amount,set:setAmount,display:`${amount.toLocaleString()}万円`},{label:"金利",min:0.5,max:5,step:0.1,val:rate,set:setRate,display:`${rate.toFixed(1)}%`}].map(s=><div key={s.label} style={{marginBottom:18}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}><span style={{fontSize:12,color:T2,fontWeight:600}}>{s.label}</span><span style={{fontSize:16,fontWeight:900,color:T1,fontFamily:"Inter,sans-serif"}}>{s.display}</span></div><input type="range" min={s.min} max={s.max} step={s.step} value={s.val} onChange={e=>s.set(parseFloat(e.target.value))} style={{width:"100%",accentColor:G}}/></div>)}</Card><Card><SL>返済期間別シミュレーション</SL><div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:6,marginBottom:14}}>{years.map(y=>{const d=calc(y);const isA=ay===y;return(<div key={y} onClick={()=>setAy(y)} style={{borderRadius:12,padding:"10px 6px",textAlign:"center",cursor:"pointer",border:`1.5px solid ${isA?G:BD}`,background:isA?GL2:SOFT,transition:"all .12s"}}><div style={{fontSize:11,fontWeight:700,color:isA?GD:T2,marginBottom:4}}>{y}年</div><div style={{fontSize:14,fontWeight:900,color:isA?GD:T1,fontFamily:"Inter,sans-serif"}}>{d.monthly}<span style={{fontSize:9}}>万</span></div><div style={{fontSize:9,color:T3,marginTop:2}}>月返済</div></div>);})}</div><div style={{background:GL2,borderRadius:14,padding:"14px 16px",border:`1.5px solid ${GL}`,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>{[{l:"月々の返済",v:`${active.monthly}万円`,c:BLU},{l:"総返済額",v:`${active.total.toLocaleString()}万円`,c:T1},{l:"利息総額",v:`${active.interest}万円`,c:YLW}].map(m=><div key={m.l} style={{textAlign:"center"}}><div style={{fontSize:10,color:T3,marginBottom:4,fontWeight:600}}>{m.l}</div><div style={{fontSize:18,fontWeight:900,color:m.c,fontFamily:"Inter,sans-serif"}}>{m.v}</div></div>)}</div></Card><Card><SL>全期間比較表</SL><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr style={{borderBottom:`1px solid ${BD}`}}>{["返済期間","月返済額","総返済額","利息総額","利息割合"].map((h,hi)=><th key={h} style={{padding:"7px 8px",textAlign:hi===0?"left":"right",color:T3,fontWeight:700,fontSize:11}}>{h}</th>)}</tr></thead><tbody>{years.map(y=>{const d=calc(y);const isA=ay===y;return(<tr key={y} onClick={()=>setAy(y)} style={{borderBottom:`1px solid ${BD}`,background:isA?GL2:"transparent",cursor:"pointer"}}><td style={{padding:"9px 8px",fontWeight:isA?800:600,color:isA?GD:T1}}>{y}年</td><td style={{padding:"9px 8px",textAlign:"right",fontWeight:800,color:isA?GD:BLU}}>{d.monthly}万円</td><td style={{padding:"9px 8px",textAlign:"right",color:T1,fontWeight:600}}>{d.total.toLocaleString()}万円</td><td style={{padding:"9px 8px",textAlign:"right",color:YLW,fontWeight:700}}>{d.interest}万円</td><td style={{padding:"9px 8px",textAlign:"right",color:T3,fontSize:11,fontWeight:600}}>{Math.round(d.interest/d.total*100)}%</td></tr>);})}</tbody></table></Card></div>);
}
// ── 金融機関おすすめタブ ─────────────────────────
function LenderTab({result}){
  const r=result;
  // 与信診断結果からおすすめ金融機関を動的に判定
  const isGood=r.creditRating==="高";
  const isMid=r.creditRating==="中";
  const isBad=r.creditRating==="要改善";
  const dcrOk=r.dcrStatus==="good"||r.dcrStatus==="watch";
  const dscrOk=r.dscrStatus==="good"||r.dscrStatus==="standard";
  const hasCollateral=(r.interestBearingDebt||0)<(r.assetCeil||0)*1.5;
 
  // 金融機関ごとの評価
  const lenders=[
    {
      id:"koukou",
      name:"日本政策金融公庫",
      type:"政府系",
      typeBg:GL2,typeTc:GD,
      limit:"最大2,000万円（中小企業事業は無制限）",
      rate:"1.2〜2.5%",
      collateral:"原則不要",
      timing:"審査〜実行まで約3週間",
      score:isBad?60:isMid?82:90,
      recommend:isBad?"財務が厳しい状況でも比較的柔軟に対応します。まず相談すべき窓口です。":
                isMid?"自己資本比率や DCR に不安があっても事業計画の内容で判断してもらえます。初回融資として最適です。":
                "信用度が高い状態です。無担保・低金利での対応が期待でき、優先的に申請すべき先です。",
      caution:"補助金と組み合わせる場合は「つなぎ融資」として活用できます。創業融資・設備資金に強い。",
      priority:isBad?1:1,
    },
    {
      id:"hoshyo",
      name:"信用保証協会付き融資（地銀・信金）",
      type:"保証付き",
      typeBg:BLUBG,typeTc:BLUTC,
      limit:"保証枠内（一般保証 2億円）",
      rate:"1.5〜2.8%＋保証料0.5〜2%",
      collateral:"原則不要",
      timing:"審査〜実行まで約4週間",
      score:isBad?55:isMid?78:82,
      recommend:isBad?"公庫と並行して相談できますが、信用保証協会の審査も通過が前提です。財務改善後に挑戦する方が確率が上がります。":
                isMid?"担保なしで対応でき、地域の信金・地銀との関係構築にも使えます。金利は公庫より若干高めです。":
                "保証協会枠を使いながら、地銀との関係を深める足がかりになります。将来のプロパー移行を見据えて活用を。",
      caution:"保証料が実質的なコストに上乗せされます。保証枠の残高管理に注意が必要です。",
      priority:isBad?2:2,
    },
    {
      id:"proper",
      name:"地銀・信金プロパー融資",
      type:"プロパー",
      typeBg:PRPBG,typeTc:PRPTC,
      limit:"制限なし（銀行の判断）",
      rate:"1.0〜3.5%（信用度により大きく変動）",
      collateral:"要交渉（不動産担保が多い）",
      timing:"審査〜実行まで約6週間",
      score:isBad?20:isMid?45:isGood&&dcrOk&&dscrOk?85:65,
      recommend:isBad?"現状では申請しても否決される可能性が高いです。財務改善を先行させてから2〜3年後に挑戦することを推奨します。":
                isMid?"条件によっては対応可能ですが、担保提供が求められる可能性が高いです。まず政策公庫・保証付きで実績を作ってから交渉するのが現実的です。":
                "返済実績が2年以上あり、自己資本比率30%超であればプロパー申請の条件が整っています。金利交渉の余地も大きいです。",
      caution:"担当者との関係性が金利・条件に直結します。定期的な決算報告と経営計画の共有が重要です。",
      priority:isBad?4:isMid?3:1,
    },
    {
      id:"factoring",
      name:"ファクタリング（売掛債権の現金化）",
      type:"ノンバンク",
      typeBg:YLWBG,typeTc:YLWTC,
      limit:"売掛金残高の70〜90%",
      rate:"手数料2〜10%（年利換算で高い）",
      collateral:"不要",
      timing:"最短2営業日",
      score:isBad?70:50,
      recommend:isBad?"資金繰りが急迫している場合の緊急手段です。コストは高いですが、銀行融資が通らない状況での繋ぎとして使えます。":"銀行融資が通る状態であればコストが高すぎます。補助金の入金待ちなど一時的なつなぎ目的に限定して活用を。",
      caution:"手数料が実質的に高利となるケースがあります。悪質業者も存在するため、取引先に通知が必要な「2社間ファクタリング」か確認を。",
      priority:isBad?1:5,
    },
  ].sort((a,b)=>a.priority-b.priority);
 
  const ScoreBar=({score})=>{
    const color=score>=80?G:score>=60?YLW:RED;
    return(
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{flex:1,height:6,background:BD,borderRadius:4,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${score}%`,background:color,borderRadius:4,transition:"width .5s"}}/>
        </div>
        <span style={{fontSize:12,fontWeight:800,color,fontFamily:"Inter,sans-serif",flexShrink:0}}>{score}</span>
      </div>
    );
  };
 
  return(
    <div>
      {/* ヘッダー */}
      <div style={{background:GRAD,borderRadius:18,padding:"20px 24px",marginBottom:14,boxShadow:SHG}}>
        <div style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,.6)",letterSpacing:".14em",textTransform:"uppercase",fontFamily:"Inter,sans-serif",marginBottom:4}}>Lender Recommendation</div>
        <div style={{fontSize:18,fontWeight:900,color:"#fff",marginBottom:4,fontFamily:"Noto Sans JP,sans-serif"}}>今の状態でどこに相談すべきか</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,.8)",fontWeight:500,lineHeight:1.65}}>
          与信診断の結果（信用度：{r.creditRating} / DSCR：{r.dscr?.toFixed(2)||"—"} / DCR：{r.dcr?.toFixed(1)||"—"}年）をもとに、今の財務状況で現実的に対応できる金融機関を優先度順で表示しています。
        </div>
      </div>
 
      {/* 今すぐ動くべきかの判断 */}
      {isBad&&(
        <Card style={{background:REDBG,border:`1.5px solid ${REDBR}`}}>
          <SL color={REDTC}>まず財務改善が先です</SL>
          <div style={{fontSize:13,color:T1,lineHeight:1.85,fontWeight:500}}>
            現在の財務状況では、銀行に相談しても否決される可能性が高く、否決の記録が残ることで次の申請にも影響が出ます。下記の改善を先行させてから申請することを強く推奨します。
          </div>
          <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:8}}>
            {[
              r.equityRatio<20&&"自己資本比率20%未満 → 役員報酬の圧縮・利益積み上げを優先",
              r.dcr&&r.dcr>10&&`DCR${r.dcr.toFixed(1)}年超 → 繰り上げ返済または利益改善でDCR7年以内に`,
              r.dscr&&r.dscr<1.0&&"DSCR1.0未満 → 返済原資が不足。リスケを先に検討",
            ].filter(Boolean).map((item,i)=>(
              <div key={i} style={{display:"flex",gap:10,padding:"8px 12px",background:"rgba(255,255,255,0.7)",borderRadius:8}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:RED,flexShrink:0,marginTop:5}}/>
                <div style={{fontSize:12,color:T1,fontWeight:500}}>{item}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
 
      {/* 金融機関カード */}
      {lenders.map((l,i)=>(
        <div key={l.id} style={{background:CARD,borderRadius:18,overflow:"hidden",marginBottom:12,boxShadow:SH,border:`1.5px solid ${BD}`}}>
          {/* 優先度バー */}
          <div style={{background:i===0?l.typeBg:SOFT,padding:"9px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${BD}`}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:9,fontWeight:800,color:"#fff",background:i===0?GD:i===1?BLU:i===2?PRP:YLWTC,padding:"2px 10px",borderRadius:999,letterSpacing:".06em"}}>優先度 {i+1}</span>
              <span style={{fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:999,background:l.typeBg,color:l.typeTc}}>{l.type}</span>
            </div>
            <div style={{fontSize:10,color:T3,fontWeight:600}}>適合スコア</div>
          </div>
          <div style={{padding:"16px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:12}}>
              <div style={{fontSize:16,fontWeight:900,color:T1,flex:1,fontFamily:"Noto Sans JP,sans-serif"}}>{l.name}</div>
              <div style={{width:120,flexShrink:0}}><ScoreBar score={l.score}/></div>
            </div>
            {/* 基本情報 */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
              {[["融資上限",l.limit],["金利目安",l.rate],["担保",l.collateral],["審査期間",l.timing]].map(([k,v])=>(
                <div key={k} style={{background:SOFT,borderRadius:8,padding:"7px 10px"}}>
                  <div style={{fontSize:9,color:T3,fontWeight:600,marginBottom:2}}>{k}</div>
                  <div style={{fontSize:11,fontWeight:700,color:T1,lineHeight:1.4}}>{v}</div>
                </div>
              ))}
            </div>
            {/* 貴社への評価 */}
            <div style={{padding:"12px 14px",background:l.score>=80?GL2:l.score>=60?YLWBG:REDBG,borderRadius:11,borderLeft:`3px solid ${l.score>=80?G:l.score>=60?YLW:RED}`,marginBottom:10}}>
              <div style={{fontSize:9,fontWeight:700,color:l.score>=80?GD:l.score>=60?YLWTC:REDTC,letterSpacing:".1em",textTransform:"uppercase",fontFamily:"Inter,sans-serif",marginBottom:4}}>貴社の状況への評価</div>
              <div style={{fontSize:13,color:T1,lineHeight:1.8,fontWeight:500}}>{l.recommend}</div>
            </div>
            <div style={{padding:"8px 12px",background:SOFT,borderRadius:8}}>
              <div style={{fontSize:9,fontWeight:700,color:T3,letterSpacing:".08em",textTransform:"uppercase",fontFamily:"Inter,sans-serif",marginBottom:3}}>注意点</div>
              <div style={{fontSize:11,color:T2,lineHeight:1.65,fontWeight:500}}>{l.caution}</div>
            </div>
          </div>
        </div>
      ))}
      <div style={{fontSize:11,color:T3,textAlign:"center",lineHeight:1.6,fontWeight:500,marginTop:4}}>
        本診断は参考情報です。実際の審査結果は各金融機関の判断によります。
      </div>
    </div>
  );
}
 
// ── リスケ相談タブ ───────────────────────────────
function RescheduleTab({result}){
  const r=result;
  const [step,setStep]=useState(0);
  // 現状から緊急度を判定
  const urgency=r.dscrStatus==="reject"?"high":r.dscrStatus==="caution"?"mid":"low";
  const urgencyMap={high:{label:"返済が既に苦しい状態です",color:RED,bg:REDBG,border:REDBR,tc:REDTC},mid:{label:"このままだと6〜12ヶ月で資金繰りが厳しくなる可能性があります",color:YLW,bg:YLWBG,border:YLWBR,tc:YLWTC},low:{label:"現時点では緊急性は低いですが、知識として把握しておくことを推奨します",color:G,bg:GL2,border:GL,tc:GD}};
  const u=urgencyMap[urgency];
 
  const STEPS=[
    {
      num:"01",title:"リスケを申し出る前に必ずやること",
      body:"リスケ（返済条件の変更）を銀行に申し出る前に、以下を準備することで交渉が圧倒的に有利になります。銀行が「この会社は真剣に立て直そうとしている」と判断する材料を先に揃えることが重要です。",
      items:[
        {label:"資金繰り表（12ヶ月先まで）",desc:"月次で資金がいつ・いくら不足するかを数字で示す。「あとどのくらいで底をつくか」を銀行に先に示すことで、誠実な姿勢を見せられる。"},
        {label:"経営改善計画書",desc:"なぜ苦しくなったか（原因）と、どうやって立て直すか（計画）を1〜2枚でまとめる。売上回復の根拠、コスト削減の具体策を数字で示すことが重要。"},
        {label:"現在の月次試算表",desc:"直近3ヶ月分の試算表を用意。銀行は「今いくらあるか」を真っ先に確認する。"},
      ],
    },
    {
      num:"02",title:"銀行への申し出方とタイミング",
      body:"リスケを申し出るタイミングは「早ければ早いほど良い」です。返済が遅延してから連絡すると「延滞先」として記録され、条件が大幅に悪化します。返済が難しくなりそうだと気づいた時点で、返済日の1〜2ヶ月前に相談することが鉄則です。",
      items:[
        {label:"誰に・何を伝えるか",desc:"担当者に電話し「今後の返済条件について相談したい」と伝える。「リスケ」という言葉は使わなくてよい。「条件変更の相談をしたい」という言い方で構わない。"},
        {label:"何を求めるか",desc:"元本の返済を一時的に止めて利息だけ払う「元金猶予（元金据え置き）」が一般的。期間は6ヶ月〜1年が多い。返済額を減額する「条件変更」も選択肢。"},
        {label:"複数の銀行がある場合",desc:"必ず全銀行に同時に相談すること。1行だけ先に動くと、他行が「うちだけが損をする」と判断し関係が悪化するリスクがある。"},
      ],
    },
    {
      num:"03",title:"リスケ後にやること・やってはいけないこと",
      body:"リスケは「猶予をもらって立て直す期間」です。この間の行動が次の融資や条件変更に直結します。",
      items:[
        {label:"必ずやること：月次報告の徹底",desc:"毎月、試算表と資金繰り実績を担当者に報告する。「見えている会社」は銀行の信頼を維持できる。報告がなくなると「隠している」と疑われる。"},
        {label:"必ずやること：経営改善の実行と記録",desc:"計画書に書いたコスト削減・売上回復を実際に進め、その実績を数字で示す。計画と実績の差分を説明できるようにしておく。"},
        {label:"やってはいけないこと",desc:"リスケ中に新規借入を他行で行うことは「返済能力があるのに返済しない」と判断され、関係が一気に悪化する。リスケ中の新規借入は必ず既存行に相談・報告する。"},
      ],
    },
    {
      num:"04",title:"リスケ後の出口戦略",
      body:"リスケは永遠に続けられません。銀行も「いつ正常化するか」を見ています。リスケ開始時から「いつまでに・どうやって返済を再開するか」を計画に織り込んでおくことが重要です。",
      items:[
        {label:"正常化の目標を明示する",desc:"「2期後には正常返済に戻る」という目標を計画書に入れ、定期的に進捗を報告する。目標に対して遅れている場合は、理由と修正計画を先に説明する。"},
        {label:"補助金・助成金を活用する",desc:"リスケ中でも補助金の申請は可能です。ものづくり補助金・持続化補助金を活用して設備更新・売上増に繋げることが、最も現実的な出口戦略になります。"},
        {label:"最終手段：専門家への相談",desc:"経営改善が見込めない場合は、中小企業診断士・弁護士・税理士と連携した「事業再生ADR」や「中小企業活性化協議会」への相談も選択肢に入れる。これも早めほど選択肢が広い。"},
      ],
    },
  ];
 
  return(
    <div>
      {/* ヘッダー */}
      <div style={{background:u.bg,borderRadius:18,padding:"20px 24px",marginBottom:14,border:`1.5px solid ${u.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:u.color,flexShrink:0}}/>
          <div style={{fontSize:9,fontWeight:700,color:u.tc,letterSpacing:".12em",textTransform:"uppercase",fontFamily:"Inter,sans-serif"}}>Rescheduling Guide</div>
        </div>
        <div style={{fontSize:16,fontWeight:900,color:T1,marginBottom:8,fontFamily:"Noto Sans JP,sans-serif",lineHeight:1.4}}>{u.label}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {[
            {l:"DSCR",v:r.dscr?.toFixed(2)||"—",ok:r.dscrStatus==="good"||r.dscrStatus==="standard"},
            {l:"DCR",v:r.dcr?r.dcr.toFixed(1)+"年":"—",ok:r.dcrStatus==="good"||r.dcrStatus==="watch"},
            {l:"信用度",v:r.creditRating,ok:r.creditRating==="高"},
          ].map(item=>(
            <div key={item.l} style={{background:"rgba(255,255,255,0.75)",borderRadius:10,padding:"8px 12px"}}>
              <div style={{fontSize:9,color:T3,fontWeight:600,marginBottom:2}}>{item.l}</div>
              <div style={{fontSize:15,fontWeight:900,color:item.ok?GD:REDTC,fontFamily:"Inter,sans-serif"}}>{item.v}</div>
            </div>
          ))}
        </div>
      </div>
 
      {/* ステップ */}
      {STEPS.map((s,i)=>(
        <div key={s.num} style={{background:CARD,borderRadius:18,overflow:"hidden",marginBottom:12,boxShadow:SH,border:`1.5px solid ${step===i?G:BD}`,transition:"border-color .15s"}}>
          {/* ヘッダー */}
          <div onClick={()=>setStep(step===i?-1:i)} style={{padding:"14px 20px",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:step===i?G:SOFT,color:step===i?"#fff":T3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,flexShrink:0,transition:"all .15s"}}>{s.num}</div>
            <div style={{flex:1,fontSize:14,fontWeight:800,color:T1,lineHeight:1.35}}>{s.title}</div>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke={T3} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,transform:step===i?"rotate(180deg)":"none",transition:"transform .2s"}}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          {/* 展開 */}
          {step===i&&(
            <div style={{padding:"0 20px 20px",borderTop:`1px solid ${BD}`}}>
              <div style={{fontSize:13,color:T2,lineHeight:1.85,fontWeight:500,marginTop:14,marginBottom:16,padding:"12px 14px",background:GL2,borderRadius:10,borderLeft:`3px solid ${G}`}}>{s.body}</div>
              {s.items.map((item,ii)=>(
                <div key={ii} style={{display:"flex",gap:12,marginBottom:ii<s.items.length-1?12:0}}>
                  <div style={{width:20,height:20,borderRadius:6,background:GL2,color:GD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,flexShrink:0,marginTop:2}}>{ii+1}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:800,color:T1,marginBottom:4}}>{item.label}</div>
                    <div style={{fontSize:12,color:T2,lineHeight:1.75,fontWeight:500}}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <Card style={{background:PRPBG,border:`1px solid ${PRPBR}`}}>
        <SL color={PRPTC}>相談窓口</SL>
        {[
          {name:"中小企業活性化協議会",desc:"各都道府県に設置。無料で経営改善・リスケ交渉の支援を行う公的機関。",tag:"無料"},
          {name:"よろず支援拠点",desc:"中小機構が設置する無料の経営相談窓口。資金繰り・融資の相談も可能。",tag:"無料"},
          {name:"中小企業診断士・税理士",desc:"民間専門家。経営改善計画書の作成支援。費用は数万〜数十万円。",tag:"有料"},
        ].map((item,i,arr)=>(
          <div key={i} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:i<arr.length-1?`1px solid ${PRPBR}`:"none"}}>
            <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999,background:item.tag==="無料"?GL2:YLWBG,color:item.tag==="無料"?GD:YLWTC,flexShrink:0,height:"fit-content",marginTop:2}}>{item.tag}</span>
            <div><div style={{fontSize:13,fontWeight:700,color:T1,marginBottom:3}}>{item.name}</div><div style={{fontSize:12,color:T2,lineHeight:1.65,fontWeight:500}}>{item.desc}</div></div>
          </div>
        ))}
      </Card>
    </div>
  );
}
 
function CollateralTab({result}){
  const items=[{label:"日本政策金融公庫",tag:"担保不要",ok:true},{label:"信用保証協会付き融資",tag:"担保不要",ok:true},{label:"プロパー融資 2,000万円以上",tag:"要交渉",ok:null},{label:"プロパー融資 3,000万円以上",tag:"不動産担保推奨",ok:false},{label:"代表者の連帯保証",tag:"政策公庫は免除可",ok:null}];
  return(<div><Card><SL>担保・保証人の要否判定</SL>{items.map((item,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:i<items.length-1?`1px solid ${BD}`:"none"}}><span style={{fontSize:13,color:T1,fontWeight:600}}>{item.label}</span><span style={{fontSize:11,padding:"3px 10px",borderRadius:999,fontWeight:700,background:item.ok===true?GL2:item.ok===false?ORGL:"#F1F5F9",color:item.ok===true?GD:item.ok===false?ORGD:T2}}>{item.tag}</span></div>)}</Card><Card style={{background:PRPBG,border:`1px solid ${PRPBR}`}}><SL color={PRPTC}>貴社へのアドバイス</SL><div style={{fontSize:13,color:"#3B0764",lineHeight:1.8,fontWeight:500}}>調整純資産ベースの評価では{result&&result.binding==="asset"?"資産側が制約になっています。担保を追加することで融資上限が上がります。固定資産3,000万円の担保評価を加えると資産ベースが改善されます。":"返済能力が制約になっています。まずはEBITDAの改善を優先し、担保追加はその後の交渉材料にしましょう。"}</div></Card></div>);
}
function CompareTab(){
  const cols=["政策公庫","信用保証","プロパー"],rows=[["上限額","2,000万円","1,000万円","制限なし"],["金利","1.2〜2.0%","1.8〜2.5%","2.0〜3.5%"],["担保","不要","不要","要交渉"],["保証人","免除可","代表者保証","代表者保証"],["審査期間","約3週間","約4週間","約6週間"],["保証料","なし","0.5〜2%","なし"]];
  return(<div><Card><SL>調達手段の比較</SL><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr style={{borderBottom:`1px solid ${BD}`}}><th style={{padding:"8px 10px",textAlign:"left",color:T3,fontWeight:700,fontSize:11}}>項目</th>{cols.map((c,i)=><th key={c} style={{padding:"8px 10px",textAlign:"center",fontWeight:800,color:i===0?GD:i===1?BLU:T1}}>{c}</th>)}</tr></thead><tbody>{rows.map((row,ri)=><tr key={ri} style={{borderBottom:ri<rows.length-1?`1px solid ${BD}`:"none"}}><td style={{padding:"10px",color:T2,fontSize:12,fontWeight:600}}>{row[0]}</td>{row.slice(1).map((cell,ci)=><td key={ci} style={{padding:"10px",textAlign:"center",fontWeight:ci===0?800:600,color:ci===0?GD:T1}}>{cell}</td>)}</tr>)}</tbody></table></Card><Card style={{background:GL2,border:`1px solid ${GL}`}}><SL>貴社のおすすめ</SL><div style={{fontSize:13,color:GD,lineHeight:1.8,fontWeight:500}}>初回は政策公庫で1,800万円を調達し、返済実績を作ってから地銀プロパー融資に切り替えると金利を下げられます。</div></Card></div>);
}
function SchemeTab({result}){
  const steps=[{n:"1",bg:GL2,tc:GD,title:"政策公庫で融資を実行（つなぎ）",sub:"設備代金の立て替えのため先に融資を受ける。補助金は後払いのためこの資金で設備を発注・購入します。",timing:"今すぐ"},{n:"2",bg:BLUBG,tc:BLUTC,title:"ものづくり補助金を申請",sub:"申請書はトルモが生成サポート。採択通知まで約3ヶ月。補助額は最大750万円（補助率1/2）。",timing:"1ヶ月以内"},{n:"3",bg:PRPBG,tc:PRPTC,title:"補助金採択・交付申請",sub:"採択通知から約2ヶ月で交付決定。この間は融資で運営。",timing:"Month 4"},{n:"4",bg:GL2,tc:GD,title:"補助金750万円を受領→繰り上げ返済",sub:`入金後に即繰り上げ返済。EBITDA倍率が${result?(750/result.ebitda).toFixed(1):"2.0"}倍改善し銀行評価が上がる。`,timing:"Month 7"}];
  return(<div><Card><SL>設備投資1,500万円の最適スキーム</SL>{steps.map((s,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:i<3?16:0}}><div style={{display:"flex",flexDirection:"column",alignItems:"center"}}><div style={{width:28,height:28,borderRadius:"50%",background:s.bg,color:s.tc,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,flexShrink:0}}>{s.n}</div>{i<3&&<div style={{width:1,height:20,background:BD,margin:"4px 0"}}/>}</div><div style={{flex:1,paddingTop:2}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{fontSize:13,fontWeight:800,color:T1}}>{s.title}</span><span style={{fontSize:10,padding:"2px 8px",borderRadius:999,background:SOFT,color:T3,fontWeight:600}}>{s.timing}</span></div><div style={{fontSize:12,color:T2,lineHeight:1.65,fontWeight:500}}>{s.sub}</div></div></div>)}<div style={{marginTop:16,padding:"12px 14px",background:SOFT,borderRadius:12}}><div style={{fontSize:12,color:T2,fontWeight:600}}>投資1,500万円 − 補助金750万円 = <strong style={{color:T1,fontWeight:900}}>実質負担 750万円</strong></div></div></Card></div>);
}
function ReadingTab({result, onExtracted}){
  const [uploading,setUploading]=useState(false);
  const [extracted,setExtracted]=useState(null);
  const [error,setError]=useState(null);
  const [activeSheet,setActiveSheet]=useState("bs");
 
  // BS項目定義（銀行目線のコメント付き）
  const BS_ITEMS={
    "資産の部":[
      {section:"流動資産",items:[
        {key:"cash",           label:"現金・預金",      tag:"重要",  tagC:GD,   tagBg:GL2,   note:"銀行が最初に確認する「即時返済能力」。少ないほど資金繰りリスクが高いと判断される。"},
        {key:"receivables",    label:"売掛金",          tag:"要確認",tagC:YLWTC,tagBg:YLWBG, note:"業種平均回転日数を超えた分は割引評価される。大口取引先への集中は与信リスクとして見られる。"},
        {key:"invTotal",       label:"棚卸資産（在庫）", tag:"要確認",tagC:YLWTC,tagBg:YLWBG, note:"仕掛品は換価率15%・製品は55%。多いほど調整純資産が下がる。回転日数が重要。"},
        {key:"otherCurrent",   label:"その他流動資産",  tag:"参考",  tagC:T3,   tagBg:SOFT,  note:"役員貸付金が含まれる場合は純資産の実質減として評価されることがある。"},
      ]},
      {section:"固定資産",items:[
        {key:"tangible",       label:"有形固定資産",    tag:"担保",  tagC:BLUTC,tagBg:BLUBG, note:"不動産は担保評価（帳簿の50〜70%）の対象。設備は担保価値が低いためキャッシュフロー勝負になる。"},
        {key:"intangible",     label:"無形固定資産",    tag:"参考",  tagC:T3,   tagBg:SOFT,  note:"のれんや開発費は回収可能性が不明確なため、銀行は保守的に評価するか無視することが多い。"},
        {key:"investments",    label:"投資その他資産",  tag:"参考",  tagC:T3,   tagBg:SOFT,  note:"関係会社への投資・出資金は評価が難しく、実態調査が必要な場合がある。"},
      ]},
    ],
    "負債・純資産の部":[
      {section:"流動負債",items:[
        {key:"payables",       label:"買掛金・支払手形", tag:"重要",  tagC:GD,   tagBg:GL2,   note:"所用運転資金の計算に使用。多いほど運転資金融資の必要額が小さくなる。"},
        {key:"shortDebt",      label:"短期借入金",      tag:"重要",  tagC:REDTC,tagBg:REDBG, note:"1年以内に返済が必要な借入。流動比率の悪化要因。資金繰り表との整合性が問われる。"},
        {key:"otherCurrentL",  label:"その他流動負債",  tag:"参考",  tagC:T3,   tagBg:SOFT,  note:"未払金・前受金等。急増している場合は実態確認が必要。"},
      ]},
      {section:"固定負債",items:[
        {key:"longDebt",       label:"長期借入金",      tag:"重要",  tagC:REDTC,tagBg:REDBG, note:"DCR計算の主体。有利子負債合計÷3期平均EBITDAが7〜10年を超えると減点要因になる。"},
        {key:"otherFixedL",    label:"その他固定負債",  tag:"参考",  tagC:T3,   tagBg:SOFT,  note:"退職給付引当金の積み立て不足は簿外負債として純資産から差し引かれることがある。"},
      ]},
      {section:"純資産",items:[
        {key:"capitalStock",   label:"資本金",          tag:"参考",  tagC:T3,   tagBg:SOFT,  note:"資本金の大小より利益剰余金の積み上がりを重視する。"},
        {key:"retainedEarnings",label:"利益剰余金",      tag:"重要",  tagC:GD,   tagBg:GL2,   note:"毎期の黒字が積み上がっているか。マイナス（欠損金）は自己資本を蝕む。"},
        {key:"bookEquity",     label:"純資産合計",      tag:"最重要",tagC:REDTC,tagBg:REDBG, note:"調整純資産算出の起点。在庫・売掛金の評価差額を差し引いた実態純資産が与信評価の基礎になる。"},
      ]},
    ],
  };
  const PL_ITEMS=[
    {key:"sales",           label:"売上高",              tag:"基準",  tagC:T3,  tagBg:SOFT,  note:"売上の増減トレンドを3期で見る。減少傾向は事業リスクとして評価される。"},
    {key:"cogs",            label:"売上原価",            tag:"参考",  tagC:T3,  tagBg:SOFT,  note:"売上原価率の業界平均比較が重要。高いほど利益率が低く、EBITDA改善余地がある。"},
    {key:"grossProfit",     label:"売上総利益（粗利）",   tag:"重要",  tagC:GD,  tagBg:GL2,   note:"粗利率が業界平均を下回っている場合、価格競争力や調達力に課題がある可能性がある。"},
    {key:"sgna",            label:"販管費",              tag:"参考",  tagC:T3,  tagBg:SOFT,  note:"固定費の大きさ。売上が落ちたときの耐性に影響する。役員報酬がここに含まれる。"},
    {key:"operatingProfit", label:"営業利益",            tag:"最重要",tagC:REDTC,tagBg:REDBG,note:"本業の稼ぐ力。銀行が最も重視する数字。赤字または業界平均以下は厳しく見られる。"},
    {key:"nonOpIncome",     label:"営業外収益",          tag:"参考",  tagC:T3,  tagBg:SOFT,  note:"一過性の収益は正常化EBITDAから除外される。"},
    {key:"nonOpExpense",    label:"営業外費用（支払利息等）",tag:"重要",tagC:YLWTC,tagBg:YLWBG,note:"支払利息が大きい場合は有利子負債が重いサイン。経常利益との差を確認する。"},
    {key:"ordinaryProfit",  label:"経常利益",            tag:"重要",  tagC:GD,  tagBg:GL2,   note:"本業＋財務の総合的な収益力。営業利益との乖離が大きい場合は財務コストが重い可能性。"},
    {key:"depreciation",    label:"減価償却費（注記）",   tag:"重要",  tagC:GD,  tagBg:GL2,   note:"EBITDA計算に加算。多いほど実態のキャッシュ創出力が高くなる。設備投資の減価償却が主体。"},
    {key:"netIncome",       label:"当期純利益",          tag:"重要",  tagC:GD,  tagBg:GL2,   note:"利益剰余金の増減に直結。黒字の継続が自己資本比率改善のカギ。"},
  ];
 
  // PDF アップロード → AI 抽出
  const handleUpload=async(e)=>{
    const file=e.target.files?.[0];if(!file)return;
    setUploading(true);setError(null);setExtracted(null);
    try{
      const b64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(file);});
      const prompt=`この決算書PDFからBS（貸借対照表）とPL（損益計算書）の主要数値を抽出し、以下のJSON形式のみで返してください。単位は万円。3期分ある場合はy1（直近）、y2（前期）、y3（前々期）に分けてください。数字が読み取れない場合はnullにしてください。前文・後文・説明は一切不要です。
 
{
  "company": "会社名",
  "fiscal_year": "決算年度（例：2024年3月期）",
  "bs": {
    "cash": 数値, "receivables": 数値, "invTotal": 数値, "otherCurrent": 数値,
    "tangible": 数値, "intangible": 数値, "investments": 数値,
    "payables": 数値, "shortDebt": 数値, "otherCurrentL": 数値,
    "longDebt": 数値, "otherFixedL": 数値,
    "capitalStock": 数値, "retainedEarnings": 数値, "bookEquity": 数値
  },
  "pl": {
    "y1": {"sales":数値,"cogs":数値,"grossProfit":数値,"sgna":数値,"operatingProfit":数値,"nonOpIncome":数値,"nonOpExpense":数値,"ordinaryProfit":数値,"depreciation":数値,"netIncome":数値},
    "y2": {同上またはnull},
    "y3": {同上またはnull}
  }
}`;
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,messages:[{role:"user",content:[{type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}},{type:"text",text:prompt}]}]})});
      const data=await res.json();
      const text=data.content?.[0]?.text||"";
      const s=text.indexOf("{"),e2=text.lastIndexOf("}");
      if(s===-1)throw new Error("JSON not found");
      const parsed=JSON.parse(text.slice(s,e2+1));
      setExtracted(parsed);
      // 与信モデルに自動マッピングして親に通知
      if(onExtracted&&parsed.bs&&parsed.pl?.y1){
        const b=parsed.bs,p1=parsed.pl.y1,p2=parsed.pl.y2||{},p3=parsed.pl.y3||{};
        const debt=(b.shortDebt||0)+(b.longDebt||0);
        onExtracted({
          bookEquity:b.bookEquity||0, cash:b.cash||0,
          receivables:b.receivables||0, payables:b.payables||0,
          invRaw:Math.round((b.invTotal||0)*0.25), invWip:Math.round((b.invTotal||0)*0.4),
          invFinished:Math.round((b.invTotal||0)*0.35), invGoods:0, invStaleness:20,
          fixedAssetsWithCollateral:b.tangible||0, interestBearingDebt:debt,
          ebitdaY1:Math.round((p1.operatingProfit||0)+(p1.depreciation||0)),
          ebitdaY2:p2.operatingProfit!=null?Math.round((p2.operatingProfit||0)+(p2.depreciation||0)):0,
          ebitdaY3:p3.operatingProfit!=null?Math.round((p3.operatingProfit||0)+(p3.depreciation||0)):0,
          excessiveExecComp:0, tax:Math.round((p1.ordinaryProfit||0)*0.3),
          maintenanceCapex:Math.round((p1.depreciation||0)*0.4),
        });
      }
    }catch(err){setError("PDFの読み取りに失敗しました。決算書のPDFをアップロードしてください。");}
    finally{setUploading(false);}
  };
 
  const fmt=(v)=>v!=null?`${Number(v).toLocaleString()}万円`:"—";
  const years=extracted?.pl?[extracted.pl.y1,extracted.pl.y2,extracted.pl.y3].filter(Boolean):[];
 
  return(
    <div>
      {/* アップロードエリア */}
      <Card>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
          <SL>決算書をアップロードして自動読み取り</SL>
        </div>
        <label style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,
          background:extracted?GL2:SOFT,border:`2px dashed ${extracted?G:BD}`,borderRadius:14,padding:"24px 20px",
          cursor:uploading?"not-allowed":"pointer",transition:"all .15s"}}
          onMouseEnter={e=>{if(!uploading){e.currentTarget.style.borderColor=G;e.currentTarget.style.background=GL2;}}}
          onMouseLeave={e=>{if(!extracted){e.currentTarget.style.borderColor=BD;e.currentTarget.style.background=SOFT;}}}>
          <input type="file" accept=".pdf" onChange={handleUpload} style={{display:"none"}} disabled={uploading}/>
          {uploading?(
            <div style={{textAlign:"center"}}>
              <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:8}}>
                {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:G,animation:`bounce .9s ${i*.18}s infinite`}}/>)}
              </div>
              <div style={{fontSize:13,fontWeight:700,color:T1}}>決算書を読み取り中...</div>
              <div style={{fontSize:11,color:T3,marginTop:4}}>AIがBS・PL項目を自動抽出しています</div>
            </div>
          ):extracted?(
            <div style={{textAlign:"center"}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:G,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px"}}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div style={{fontSize:13,fontWeight:800,color:GD}}>{extracted.company||"読み取り完了"}</div>
              <div style={{fontSize:11,color:T3,marginTop:2}}>{extracted.fiscal_year||""} — 別のファイルをアップロードして更新できます</div>
            </div>
          ):(
            <>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={T3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15l3-3 3 3"/></svg>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:13,fontWeight:700,color:T1}}>決算書PDFをドロップ / タップして選択</div>
                <div style={{fontSize:11,color:T3,marginTop:3}}>BS・PL・CF計算書が含まれるPDFをアップロード</div>
              </div>
            </>
          )}
        </label>
        {error&&<div style={{marginTop:10,fontSize:12,color:REDTC,fontWeight:600,padding:"8px 12px",background:REDBG,borderRadius:8}}>{error}</div>}
        {!extracted&&<div style={{marginTop:10,fontSize:11,color:T3,lineHeight:1.6,fontWeight:500}}>アップロードしない場合も、下記の一覧でBS・PLの各項目の見方を確認できます。</div>}
        {extracted&&<div style={{marginTop:10,padding:"8px 12px",background:BLUBG,borderRadius:8,border:`1px solid ${BLUBR}`}}><div style={{fontSize:11,color:BLUTC,fontWeight:700}}>読み取った数字が与信診断に自動反映されました。「与信診断」タブで結果を確認できます。</div></div>}
      </Card>
 
      {/* BS / PL 切り替えタブ */}
      <div style={{display:"flex",gap:4,marginBottom:12,background:SOFT,borderRadius:12,padding:4}}>
        {[{id:"bs",l:"BS（貸借対照表）"},{id:"pl",l:"PL（損益計算書）"}].map(t=>(
          <button key={t.id} onClick={()=>setActiveSheet(t.id)} style={{flex:1,padding:"8px 0",borderRadius:9,border:"none",background:activeSheet===t.id?CARD:"transparent",color:activeSheet===t.id?T1:T3,fontSize:12,fontWeight:activeSheet===t.id?700:500,boxShadow:activeSheet===t.id?SH:"none",cursor:"pointer",fontFamily:"inherit",transition:"all .12s"}}>{t.l}</button>
        ))}
      </div>
 
      {/* BS表示 */}
      {activeSheet==="bs"&&(
        <div>
          {Object.entries(BS_ITEMS).map(([side,sections])=>(
            <Card key={side}>
              <SL color={side==="資産の部"?BLU:RED}>{side}</SL>
              {sections.map((sec,si)=>(
                <div key={sec.section} style={{marginBottom:si<sections.length-1?16:0}}>
                  <div style={{fontSize:10,fontWeight:800,color:T2,marginBottom:8,paddingBottom:5,borderBottom:`1px solid ${BD}`,display:"flex",justifyContent:"space-between"}}>
                    <span>{sec.section}</span>
                    {extracted&&<span style={{color:T3,fontWeight:600}}>金額（万円）</span>}
                  </div>
                  {sec.items.map((item,ii)=>{
                    const val=extracted?.bs?.[item.key];
                    return(
                      <div key={item.key} style={{marginBottom:10}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <span style={{flex:1,fontSize:13,fontWeight:600,color:T1}}>{item.label}</span>
                          <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:999,background:item.tagBg,color:item.tagC,flexShrink:0}}>{item.tag}</span>
                          {extracted&&<span style={{fontSize:14,fontWeight:900,color:val!=null?T1:T3,fontFamily:"Inter,sans-serif",flexShrink:0,minWidth:80,textAlign:"right"}}>{fmt(val)}</span>}
                        </div>
                        <div style={{fontSize:11,color:T2,lineHeight:1.65,fontWeight:500,padding:"7px 10px",background:item.tagBg,borderRadius:8,borderLeft:`3px solid ${item.tagC}`}}>{item.note}</div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}
 
      {/* PL表示 */}
      {activeSheet==="pl"&&(
        <Card>
          <SL>損益計算書（PL）</SL>
          {extracted&&years.length>0&&(
            <div style={{display:"grid",gridTemplateColumns:`180px ${years.map(()=>"1fr").join(" ")}`,gap:0,marginBottom:16,background:SOFT,borderRadius:10,overflow:"hidden",border:`1px solid ${BD}`}}>
              <div style={{padding:"8px 12px",fontSize:10,fontWeight:700,color:T3,borderBottom:`1px solid ${BD}`}}>項目</div>
              {years.map((_,i)=><div key={i} style={{padding:"8px 12px",fontSize:10,fontWeight:700,color:T3,textAlign:"right",borderBottom:`1px solid ${BD}`,borderLeft:`1px solid ${BD}`}}>{["直近期","前期","前々期"][i]}</div>)}
            </div>
          )}
          {PL_ITEMS.map((item,idx)=>{
            const isTotal=["grossProfit","operatingProfit","ordinaryProfit","netIncome"].includes(item.key);
            return(
              <div key={item.key} style={{marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <div style={{flex:1,display:"flex",alignItems:"center",gap:6}}>
                    {isTotal&&<div style={{width:3,height:16,background:item.tagC,borderRadius:2,flexShrink:0}}/>}
                    <span style={{fontSize:isTotal?14:13,fontWeight:isTotal?800:600,color:T1}}>{item.label}</span>
                  </div>
                  <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:999,background:item.tagBg,color:item.tagC,flexShrink:0}}>{item.tag}</span>
                  {extracted&&years.length>0&&(
                    <div style={{display:"flex",gap:12,flexShrink:0}}>
                      {years.map((y,yi)=>{
                        const v=y?.[item.key];
                        const isNeg=v!=null&&v<0;
                        return<span key={yi} style={{fontSize:13,fontWeight:800,color:isNeg?REDTC:isTotal?item.tagC:T1,fontFamily:"Inter,sans-serif",minWidth:70,textAlign:"right"}}>{fmt(v)}</span>;
                      })}
                    </div>
                  )}
                </div>
                <div style={{fontSize:11,color:T2,lineHeight:1.65,fontWeight:500,padding:"7px 10px",background:item.tagBg,borderRadius:8,borderLeft:`3px solid ${item.tagC}`}}>{item.note}</div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
function ChecklistTab(){
  const allItems=[{label:"直近2期分の決算書（BS・PL・CF計算書）",cat:0},{label:"法人税申告書（別表一〜十）",cat:0},{label:"試算表（申請月の直近3ヶ月）",cat:0},{label:"資金繰り表（向こう12ヶ月）",cat:0},{label:"事業計画書",cat:0},{label:"借入申込書（公庫所定様式）",cat:1},{label:"設備資金の見積書",cat:1},{label:"登記事項証明書（3ヶ月以内）",cat:1},{label:"信用保証委託申込書",cat:2},{label:"印鑑証明書（代表者・会社）",cat:2}];
  const [checked,setChecked]=useState({0:true,1:true});
  const done=Object.values(checked).filter(Boolean).length,total=allItems.length;
  const cats=["必須書類","政策公庫の場合（追加）","信用保証付きの場合（追加）"];
  return(<div><div style={{background:GRAD,borderRadius:14,padding:"14px 18px",marginBottom:12,boxShadow:SHG,display:"flex",alignItems:"center",justifyContent:"space-between"}}><div><div style={{fontSize:11,color:"rgba(255,255,255,.7)",marginBottom:2,fontWeight:600}}>準備状況</div><div style={{fontSize:22,fontWeight:900,color:"#fff",fontFamily:"Inter,sans-serif"}}>{done} / {total} 件</div></div><div style={{width:60,height:60,position:"relative"}}><svg viewBox="0 0 60 60" style={{transform:"rotate(-90deg)"}}><circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="6"/><circle cx="30" cy="30" r="24" fill="none" stroke="#fff" strokeWidth="6" strokeDasharray={`${(done/total)*150.8} 150.8`} strokeLinecap="round"/></svg><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff"}}>{Math.round(done/total*100)}%</div></div></div>{cats.map((cat,ci)=><Card key={cat}><SL>{cat}</SL>{allItems.filter(item=>item.cat===ci).map(item=>{const idx=allItems.indexOf(item);return(<div key={idx} onClick={()=>setChecked(c=>({...c,[idx]:!c[idx]}))} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"0.5px solid "+BD,cursor:"pointer"}}><div style={{width:20,height:20,borderRadius:6,border:`2px solid ${checked[idx]?G:BD}`,background:checked[idx]?G:CARD,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>{checked[idx]&&<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}</div><span style={{fontSize:13,color:checked[idx]?T3:T1,fontWeight:checked[idx]?500:600,textDecoration:checked[idx]?"line-through":"none"}}>{item.label}</span></div>);})}</Card>)}</div>);
}
 
// ── 補助金カード ──────────────────────────────────
function getSubsidies(intake){
  const ind=intake.industry||"製造業";const isMfg=["製造業","建設業"].includes(ind);
  return[
    {id:"monodukuri",name:"ものづくり補助金",org:"経済産業省",amount:"最大750万円",rate:"補助率 1/2",deadline:"第18次：2025年7月18日",score:isMfg?92:68,tags:["設備投資","生産性向上","製造業向け"],
      strategy:{title:`「${isMfg?"スマート製造による生産性向上":"IT活用による業務効率化"}」の名目が通りやすい`,proposals:[isMfg?"IoT・AI導入による生産ライン自動化（採択率82%）":"クラウド基幹システム導入（採択率71%）","「DX推進×省人化」の組み合わせ名目で補助額が上がる可能性","政策公庫融資と組み合わせると自己負担を30%以下に圧縮できる"],caution:"事業計画書の「革新性」の記述が採択率を左右します。具体的な数値目標と業界比較を入れることが重要です。"}},
    {id:"it",name:"IT導入補助金",org:"経済産業省",amount:"最大350万円",rate:"補助率 3/4",deadline:"常時受付（随時締切）",score:72,tags:["IT・DX","会計ソフト","インボイス"],
      strategy:{title:"「インボイス対応×業務効率化」は今年最も通りやすい名目です",proposals:["会計・経理ソフトの導入はほぼ採択される（要件が易しい）","業種特化SaaSを対象にすると補助率が上がる","ものづくり補助金と時期をずらせば両方申請できる"],caution:"IT導入補助金はITツールがITAMSに登録されている必要があります。ベンダー選定前に確認を。"}},
    {id:"jizoku",name:"小規模事業者持続化補助金",org:"日本商工会議所",amount:"最大200万円",rate:"補助率 2/3",deadline:"第16回：2025年6月4日",score:74,tags:["販路拡大","広告","ウェブ制作"],
      strategy:{title:"「新規顧客層への販路開拓」の名目が最も採択されやすい",proposals:["ウェブサイト制作・EC構築は採択率が高い定番名目","展示会出展・カタログ制作","商工会議所の事前相談を受けると採択率が1.3倍になるデータがある"],caution:"「販路拡大」に直接つながらない設備投資は対象外になるため名目の書き方が重要です。"}},
    {id:"career",name:"キャリアアップ助成金",org:"厚生労働省",amount:"最大160万円",rate:"助成金（返済不要）",deadline:"正社員転換後6ヶ月以内に申請",score:85,tags:["人材","正社員転換","返済不要"],
      strategy:{title:"ものづくり補助金と同時取得で自己負担を最小化できます",proposals:["設備自動化で省人化した工数を正社員転換に充てると要件を満たしやすい","1人あたり80万円×2名で160万円。申請手続きは比較的シンプル","ものづくり補助金（750万）＋キャリアアップ（160万）＝合計910万円の確保が可能"],caution:"事前に雇用保険への加入と「キャリアアップ計画書」の届け出が必要です。転換前に手続きを完了させてください。"}},
  ].sort((a,b)=>b.score-a.score);
}
function SubsidyCard({s,rank}){
  const [open,setOpen]=useState(false);
  return(
    <div style={{background:CARD,borderRadius:18,overflow:"hidden",border:`1.5px solid ${open?G:BD}`,boxShadow:open?SHG:SH,marginBottom:12,transition:"border-color .2s"}}>
      <div style={{background:rank===0?GRAD:rank===1?"linear-gradient(90deg,#1D4ED8,#6366F1)":SOFT,padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:10,fontWeight:800,color:rank<2?"#fff":T3,fontFamily:"Inter,sans-serif",letterSpacing:".08em"}}>MATCH #{rank+1}</span>
          {s.tags.map(t=><span key={t} style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:999,background:"rgba(255,255,255,0.2)",color:rank<2?"#fff":T2}}>{t}</span>)}
        </div>
        <div style={{fontSize:13,fontWeight:900,color:rank<2?"#fff":GD,fontFamily:"Inter,sans-serif"}}>{s.score}%</div>
      </div>
      <div style={{padding:"18px 20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,gap:12}}>
          <div style={{flex:1}}><div style={{fontSize:9,color:T3,fontWeight:600,marginBottom:3}}>{s.org}</div><div style={{fontSize:16,fontWeight:900,color:T1,lineHeight:1.3,fontFamily:"Noto Sans JP,sans-serif"}}>{s.name}</div></div>
          <div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:18,fontWeight:900,color:GD,fontFamily:"Inter,sans-serif"}}>{s.amount}</div><div style={{fontSize:10,color:T3,fontWeight:600}}>{s.rate}</div></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14,padding:"7px 12px",background:SOFT,borderRadius:8}}>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke={T3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span style={{fontSize:11,color:T2,fontWeight:600}}>{s.deadline}</span>
        </div>
        <div style={{padding:"12px 14px",background:GL2,borderRadius:12,border:`1px solid ${GL}`,marginBottom:14}}>
          <div style={{fontSize:9,fontWeight:800,color:GD,letterSpacing:".1em",textTransform:"uppercase",fontFamily:"Inter,sans-serif",marginBottom:5}}>AIの戦略提案</div>
          <div style={{fontSize:13,fontWeight:700,color:T1,lineHeight:1.5}}>{s.strategy.title}</div>
        </div>
        <button onClick={()=>setOpen(v=>!v)} style={{display:"flex",alignItems:"center",gap:6,background:SOFT,border:`1.5px solid ${BD}`,borderRadius:10,padding:"8px 16px",fontSize:12,fontWeight:700,color:T2,cursor:"pointer",fontFamily:"inherit",transition:"all .12s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=G;e.currentTarget.style.color=GD;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=BD;e.currentTarget.style.color=T2;}}>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{open?<polyline points="18 15 12 9 6 15"/>:<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}</svg>
          {open?"閉じる":"申請のコツ・注意点を見る"}
        </button>
        {open&&(
          <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${BD}`}}>
            <div style={{marginBottom:12}}><div style={{fontSize:9,fontWeight:700,color:GD,letterSpacing:".12em",textTransform:"uppercase",fontFamily:"Inter,sans-serif",marginBottom:8}}>採択されやすい申請の方向性</div>
              {s.strategy.proposals.map((p,i)=>(
                <div key={i} style={{display:"flex",gap:10,marginBottom:8}}>
                  <div style={{width:20,height:20,borderRadius:6,background:GL2,color:GD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,flexShrink:0}}>{i+1}</div>
                  <div style={{fontSize:13,color:T1,lineHeight:1.7,fontWeight:500,flex:1}}>{p}</div>
                </div>
              ))}
            </div>
            <div style={{padding:"10px 14px",background:YLWBG,borderRadius:10,border:`1px solid ${YLWBR}`}}>
              <div style={{fontSize:9,fontWeight:700,color:YLWTC,letterSpacing:".1em",textTransform:"uppercase",fontFamily:"Inter,sans-serif",marginBottom:4}}>注意点</div>
              <div style={{fontSize:12,color:YLWTC,lineHeight:1.65,fontWeight:500}}>{s.strategy.caution}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
 
// ══════════════════════════════════════════════════
// MODE SELECT
 
export { calcCreditModel, DEMO_INPUTS };
export default DebtFinancePanel;
