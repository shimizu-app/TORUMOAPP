"use client";
// ============================================================
// DebtFinancePanel.jsx — デットファイナンス与信診断パネル
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

// ── デモデータ ──
export const DEMO_INPUTS={
  bookEquity:2200, cash:800,
  receivables:2200,
  invRaw:200, invWip:400, invFinished:300, invGoods:0, invStaleness:20,
  payables:600,
  fixedAssetsWithCollateral:3000,
  interestBearingDebt:4000,
  ebitdaY1:470, ebitdaY2:430, ebitdaY3:390,
  excessiveExecComp:0,
  tax:80, maintenanceCapex:60,
  industry:"cyclical",
  monthlyMgmtScore:true, customerDiversityScore:false, pricingPowerScore:false,
  customerConcentration:true, inventoryMgmtWeak:false, planDeviationRisk:false,
  fundPurpose:"equipment",
  hasCollateral:true,
};

// ── 与信計算エンジン ──
export function calcCreditModel(inp){
  const{
    bookEquity=0, cash=0, receivables=0,
    invRaw=0, invWip=0, invFinished=0, invGoods=0, invStaleness=0,
    payables=0, fixedAssetsWithCollateral=0, interestBearingDebt=0,
    ebitdaY1=0, ebitdaY2=0, ebitdaY3=0,
    excessiveExecComp=0, tax=0, maintenanceCapex=0,
    industry="cyclical",
    monthlyMgmtScore=false, customerDiversityScore=false, pricingPowerScore=false,
    customerConcentration=false, inventoryMgmtWeak=false, planDeviationRisk=false,
    fundPurpose="equipment", hasCollateral=true,
    operatingProfit=0, depreciation=0,
  }=inp;

  const hasThreeYear = ebitdaY1>0||ebitdaY2>0||ebitdaY3>0;
  const ebitdaAvg = hasThreeYear
    ? (ebitdaY1+(ebitdaY2||ebitdaY1)+(ebitdaY3||ebitdaY1))/([ebitdaY1,ebitdaY2,ebitdaY3].filter(v=>v>0).length)
    : (operatingProfit+depreciation+excessiveExecComp);
  const ebitda = ebitdaAvg + excessiveExecComp;

  const recTurnDays={stable:45,general:60,cyclical:75,high_risk:90}[industry]||60;
  const salesEst=ebitda>0?ebitda/0.1:receivables*5;
  const normalRec=salesEst*(recTurnDays/365);
  const excessRec=Math.max(0,receivables-normalRec);
  const evalRec=normalRec+excessRec*0.50;
  const recGap=receivables-evalRec;

  const staleFactor=invStaleness>=50?0.70:invStaleness>=30?0.85:1.0;
  const evalInv=(invRaw*0.35+invWip*0.15+invFinished*0.55+invGoods*0.65)*staleFactor;
  const totalBookInv=invRaw+invWip+invFinished+invGoods;
  const invGap=totalBookInv-evalInv;

  const adjEquity=bookEquity-invGap-recGap;
  const totalAssets=bookEquity+interestBearingDebt;
  const equityRatio=totalAssets>0?bookEquity/totalAssets:0;

  let segScore=0;
  if(adjEquity>0)segScore+=2;else segScore-=2;
  if(equityRatio>=0.30)segScore+=2;else if(equityRatio>=0.20)segScore+=1;else segScore-=1;
  if(monthlyMgmtScore)segScore+=1;
  if(customerConcentration)segScore-=1;
  if(inventoryMgmtWeak)segScore-=1;
  const segment=segScore>=4?"積極支援":segScore>=1?"是々非々":"与信不可";
  const creditRating=segment==="積極支援"?"高":segment==="是々非々"?"中":"要改善";

  const workingCapitalNeeds=Math.max(0,evalRec+evalInv-payables);
  const existingWorkingDebt=interestBearingDebt*0.30;
  const workingCapitalRoom=Math.max(0,workingCapitalNeeds-existingWorkingDebt);

  const netDebt=Math.max(0,interestBearingDebt-cash);
  const multiplier={stable:4.5,general:3.5,cyclical:2.5,high_risk:2.0}[industry]||3.5;
  const debtCeil=Math.max(0,ebitda*multiplier);
  const collateralBonus=hasCollateral&&fundPurpose==="equipment"?fixedAssetsWithCollateral*0.70*0.70:0;
  const equipmentCeil=Math.max(0,debtCeil+collateralBonus-netDebt);

  const assetCeil=Math.max(0,adjEquity*2.5);
  const fundingCeil=fundPurpose==="working"?workingCapitalRoom:equipmentCeil;
  const raw=Math.min(assetCeil,fundingCeil);
  const binding=assetCeil<=fundingCeil?"asset":"debt";

  const dcr=ebitda>0?netDebt/ebitda:null;
  const dcrPenalty=dcr!==null&&dcr>10?0.80:dcr!==null&&dcr>7?0.90:1.0;
  const dcrStatus=dcr===null?"unknown":dcr>10?"danger":dcr>7?"caution":dcr>5?"watch":"good";

  const annRep=interestBearingDebt>0?interestBearingDebt/7:0;
  const dscr=annRep>0?(ebitda-tax-maintenanceCapex)/annRep:null;
  const dscrStatus=dscr===null?"unknown":dscr<1.0?"reject":dscr<1.2?"caution":dscr<1.5?"standard":"good";

  let q=0;
  if(monthlyMgmtScore)q+=0.3;if(customerDiversityScore)q+=0.3;if(pricingPowerScore)q+=0.2;
  if(customerConcentration)q-=0.5;if(inventoryMgmtWeak)q-=0.4;if(planDeviationRisk)q-=0.5;
  const qualMultiplier=1+0.1*q;

  const segMultiplier=segment==="与信不可"?0:segment==="是々非々"?0.75:1.0;
  const final=Math.max(0,raw*qualMultiplier*dcrPenalty*segMultiplier);

  const verdict=segment==="与信不可"?"REJECT":
    dscr!==null&&dscr<1.0?"REJECT":
    final<=0?"REJECT":
    dscr!==null&&dscr<1.2||segment==="是々非々"?"CONDITIONAL":"APPROVE";

  const ebitdaMult=netDebt>0&&ebitda>0?netDebt/ebitda:null;

  const sensitivities=[];
  if(invWip>0){
    const imp=(invRaw*0.35+(invWip*0.5)*0.55+(invFinished+invWip*0.5)*0.55+invGoods*0.65)*staleFactor;
    const improvedAdj=bookEquity-(totalBookInv-imp)-recGap;
    const improvedAssetCeil=Math.max(0,improvedAdj*2.5);
    const d=Math.max(0,Math.min(improvedAssetCeil,fundingCeil)*qualMultiplier*dcrPenalty*segMultiplier-final);
    if(d>50)sensitivities.push({label:"仕掛品の製品化・在庫回転を改善",delta:d,note:"仕掛品換価率0.15→製品0.55に改善することで調整純資産が増加"});
  }
  if(ebitda>0){
    const ce=240,ie=ebitda+ce,dc=Math.max(0,ie*multiplier+collateralBonus-netDebt);
    const d=Math.max(0,Math.min(assetCeil,dc)*qualMultiplier*dcrPenalty*segMultiplier-final);
    if(d>50)sensitivities.push({label:"役員報酬を月20万円圧縮（年240万EBITDA改善）",delta:d,note:`3期平均EBITDA向上で返済側上限が${Math.round(ce*multiplier)}万円拡大`});
  }

  return{
    bookEquity, adjEquity, invGap, recGap, evalInv, evalRec,
    totalBookInv, totalBookRec:receivables, assetCeil,
    ebitda, ebitdaAvg, hasThreeYear, netDebt, ebitdaMult, multiplier,
    workingCapitalNeeds, workingCapitalRoom, equipmentCeil, debtCeil,
    fundPurpose, collateralBonus,
    segment, creditRating, segScore,
    equityRatio: Math.round(equityRatio*100),
    dcr, dcrStatus, dscr, dscrStatus,
    binding, final, verdict, qualMultiplier, dcrPenalty,
    sensitivities, interestBearingDebt,
  };
}

// ── タブ定義 ──
const TABS=[
  {id:"diagnosis",label:"診断",icon:"◉"},
  {id:"cfo",label:"CFO提案",icon:"◆"},
  {id:"lender",label:"金融機関",icon:"▲"},
  {id:"sim",label:"金利試算",icon:"◇"},
  {id:"compare",label:"補助金比較",icon:"◎"},
  {id:"scheme",label:"組合せ",icon:"✦"},
  {id:"collateral",label:"担保",icon:"■"},
  {id:"checklist",label:"面談対策",icon:"☑"},
  {id:"reschedule",label:"リスケ",icon:"↺"},
  {id:"reading",label:"BS/PL読解",icon:"≡"},
];

// ── メインパネル ──
export default function DebtFinancePanel({inputs,result}){
  const [tab,setTab]=useState("diagnosis");
  const [inp,setInp]=useState(inputs);
  const [liveResult,setLiveResult]=useState(result);
  const setF=(k,v)=>{const ni={...inp,[k]:typeof v==="boolean"?v:parseFloat(v)||0};setInp(ni);setLiveResult(calcCreditModel(ni));};
  const r=liveResult;
  const dscrColor=r.dscrStatus==="good"?G:r.dscrStatus==="standard"?BLU:r.dscrStatus==="caution"?YLW:RED;
  const vMap={APPROVE:{bg:GL2,tc:GD,hdr:G,label:"承認見込み（APPROVE）",sub:"現在の財務状況で融資申請が見込まれます"},CONDITIONAL:{bg:YLWBG,tc:YLWTC,hdr:YLW,label:"条件付（CONDITIONAL）",sub:"財務改善または担保追加を条件に融資が見込まれます"},REJECT:{bg:REDBG,tc:REDTC,hdr:RED,label:"否決リスク（REJECT）",sub:"現状では融資審査が通りにくい状態です"}};
  const v=vMap[r.verdict]||vMap.CONDITIONAL;

  return(
    <div>
      {/* タブナビ */}
      <div style={{display:"flex",gap:4,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
        {TABS.map(t=>(
          <div key={t.id} onClick={()=>setTab(t.id)}
            style={{padding:"8px 14px",borderRadius:10,cursor:"pointer",whiteSpace:"nowrap",
              background:tab===t.id?GRAD:CARD,color:tab===t.id?"#fff":T2,
              border:`1px solid ${tab===t.id?G:BD}`,fontSize:11,fontWeight:700,
              boxShadow:tab===t.id?SHG:"none",transition:"all .15s"}}>
            <span style={{marginRight:5}}>{t.icon}</span>{t.label}
          </div>
        ))}
      </div>

      {tab!=="diagnosis"&&(
        <div>
          {tab==="cfo"&&<CFOTab r={r}/>}
          {tab==="lender"&&<LenderTab r={r}/>}
          {tab==="sim"&&<SimTab/>}
          {tab==="compare"&&<CompareTab/>}
          {tab==="scheme"&&<SchemeTab r={r}/>}
          {tab==="collateral"&&<CollateralTab inp={inp} r={r}/>}
          {tab==="checklist"&&<ChecklistTab r={r}/>}
          {tab==="reschedule"&&<RescheduleTab r={r}/>}
          {tab==="reading"&&<ReadingTab/>}
        </div>
      )}

      {tab==="diagnosis"&&<>
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
            <div style={{background:"rgba(255,255,255,0.7)",borderRadius:10,padding:"8px 12px",border:`1px solid ${r.creditRating==="高"?G:r.creditRating==="中"?YLWBR:REDBR}`}}>
              <div style={{fontSize:9,color:T3,fontWeight:600,marginBottom:2}}>銀行から見た信用度</div>
              <div style={{fontSize:16,fontWeight:900,color:r.creditRating==="高"?GD:r.creditRating==="中"?YLWTC:REDTC,fontFamily:"Inter,sans-serif"}}>{r.creditRating}</div>
            </div>
            <div style={{background:"rgba(255,255,255,0.7)",borderRadius:10,padding:"8px 12px",border:`1px solid ${BD}`}}>
              <div style={{fontSize:9,color:T3,fontWeight:600,marginBottom:2}}>資金使途</div>
              <div style={{fontSize:14,fontWeight:800,color:T1}}>{r.fundPurpose==="working"?"運転資金":"設備資金"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* EBITDA・DSCR・DCR */}
      <Card>
        <SL>返済能力（3期平均EBITDA・DSCR・DCR）</SL>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
          {[
            {l:"3期平均EBITDA",v:`${Math.round(r.ebitdaAvg).toLocaleString()}万円`,bg:SOFT,c:T1},
            {l:"DSCR（返済余力）",v:r.dscr?r.dscr.toFixed(2):"—",bg:r.dscr&&r.dscr<1.2?REDBG:r.dscr&&r.dscr<1.5?YLWBG:GL2,c:dscrColor},
            {l:"DCR（返済可能期間）",v:r.dcr?r.dcr.toFixed(1)+"年":"—",bg:r.dcrStatus==="danger"?REDBG:r.dcrStatus==="caution"||r.dcrStatus==="watch"?YLWBG:GL2,c:r.dcrStatus==="danger"?REDTC:r.dcrStatus==="caution"||r.dcrStatus==="watch"?YLWTC:GD},
          ].map(item=>(
            <div key={item.l} style={{background:item.bg,borderRadius:12,padding:"12px 14px"}}>
              <div style={{fontSize:10,color:T3,fontWeight:600,marginBottom:3}}>{item.l}</div>
              <div style={{fontSize:18,fontWeight:900,color:item.c,fontFamily:"Inter,sans-serif"}}>{item.v}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* 制約条件 */}
      <Card style={{background:r.binding==="asset"?YLWBG:PRPBG,border:`1.5px solid ${r.binding==="asset"?YLWBR:PRPBR}`}}>
        <SL color={r.binding==="asset"?YLWTC:PRPTC}>制約条件</SL>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[{label:"資産側上限",val:Math.round(r.assetCeil),isB:r.binding==="asset"},{label:"返済側上限",val:Math.round(r.debtCeil),isB:r.binding==="debt"}].map(item=>(
            <div key={item.label} style={{background:"rgba(255,255,255,0.7)",borderRadius:12,padding:"12px 14px",border:item.isB?`2px solid ${r.binding==="asset"?YLW:PRP}`:`1px solid ${BD}`}}>
              <div style={{fontSize:10,color:T3,fontWeight:600,marginBottom:4}}>{item.label}</div>
              <div style={{fontSize:20,fontWeight:900,color:item.isB?(r.binding==="asset"?YLWTC:PRPTC):T1,fontFamily:"Inter,sans-serif"}}>{item.val.toLocaleString()}万円</div>
              {item.isB&&<div style={{fontSize:9,fontWeight:700,color:r.binding==="asset"?YLWTC:PRPTC,marginTop:3}}>← この数値が制約</div>}
            </div>
          ))}
        </div>
      </Card>

      {/* 感度分析 */}
      {r.sensitivities.length>0&&(
        <Card style={{background:PRPBG,border:`1px solid ${PRPBR}`}}>
          <SL color={PRPTC}>感度分析 — ここを改善すると融資額が増える</SL>
          {r.sensitivities.map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"10px 0",borderBottom:i<r.sensitivities.length-1?`1px solid ${PRPBR}`:"none"}}>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:T1,marginBottom:4}}>{s.label}</div><div style={{fontSize:11,color:T2,lineHeight:1.65,fontWeight:500}}>{s.note}</div></div>
              <div style={{flexShrink:0,textAlign:"right"}}><div style={{fontSize:10,color:PRPTC,fontWeight:700,marginBottom:1}}>融資額の増加</div><div style={{fontSize:18,fontWeight:900,color:PRPTC,fontFamily:"Inter,sans-serif"}}>+{Math.round(s.delta).toLocaleString()}万円</div></div>
            </div>
          ))}
        </Card>
      )}

      {/* 調整純資産 */}
      <Card>
        <SL>調整純資産 — 帳簿から銀行評価へ</SL>
        {[
          {label:"帳簿純資産",value:r.bookEquity,type:"base"},
          {label:"在庫評価差額",value:-Math.round(r.invGap),type:"minus"},
          {label:"売掛金評価差額",value:-Math.round(r.recGap),type:"minus"},
          {label:"調整純資産",value:Math.round(r.adjEquity),type:"result"},
        ].map((item,i)=>{
          const isR=item.type==="result",isM=item.type==="minus";
          const bc=isR?G:isM?RED:"#94A3B8";
          const pct=Math.abs(item.value)/r.bookEquity*100;
          return(
            <div key={i} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div style={{fontSize:12,fontWeight:isR?800:600,color:isR?G:T1}}>{item.label}</div>
                <div style={{fontSize:16,fontWeight:900,color:isR?G:isM?RED:T1,fontFamily:"Inter,sans-serif"}}>
                  {isM&&item.value<0?"▼ ":isR?"= ":""}{Math.abs(item.value).toLocaleString()}万円
                </div>
              </div>
              <div style={{height:isR?8:6,background:BD,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(100,pct)}%`,background:bc,borderRadius:4}}/></div>
              {i===2&&<div style={{borderTop:`1.5px solid ${BD}`,marginTop:8,marginBottom:2}}/>}
            </div>
          );
        })}
      </Card>

      </>}
    </div>
  );
}

function SimTab(){
  const [amount,setAmount]=useState(1800);const [rate,setRate]=useState(1.8);const [ay,setAy]=useState(10);
  const calc=(y)=>{const P=amount*10000,r2=rate/100/12,n=y*12,m=r2===0?P/n:P*r2*Math.pow(1+r2,n)/(Math.pow(1+r2,n)-1);return{monthly:Math.round(m/10000),total:Math.round(m*n/10000),interest:Math.round((m*n-P)/10000)};};
  const years=[3,5,7,10,15,20];const active=calc(ay);
  return(<div>
    <Card><SL>金利シミュレーション</SL>
      {[{label:"借入額",min:100,max:5000,step:100,val:amount,set:setAmount,display:`${amount.toLocaleString()}万円`},{label:"金利",min:0.5,max:5,step:0.1,val:rate,set:setRate,display:`${rate.toFixed(1)}%`}].map(s=><div key={s.label} style={{marginBottom:18}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}><span style={{fontSize:12,color:T2,fontWeight:600}}>{s.label}</span><span style={{fontSize:16,fontWeight:900,color:T1,fontFamily:"Inter,sans-serif"}}>{s.display}</span></div><input type="range" min={s.min} max={s.max} step={s.step} value={s.val} onChange={e=>s.set(parseFloat(e.target.value))} style={{width:"100%",accentColor:G}}/></div>)}
    </Card>
    <Card><SL>返済期間別比較</SL>
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:6,marginBottom:14}}>
        {years.map(y=>{const d=calc(y);const isA=ay===y;return(
          <div key={y} onClick={()=>setAy(y)} style={{borderRadius:12,padding:"10px 6px",textAlign:"center",cursor:"pointer",border:`1.5px solid ${isA?G:BD}`,background:isA?GL2:SOFT,transition:"all .12s"}}>
            <div style={{fontSize:11,fontWeight:700,color:isA?GD:T2,marginBottom:4}}>{y}年</div>
            <div style={{fontSize:14,fontWeight:900,color:isA?GD:T1,fontFamily:"Inter,sans-serif"}}>{d.monthly}<span style={{fontSize:9}}>万</span></div>
            <div style={{fontSize:9,color:T3,marginTop:2}}>月返済</div>
          </div>);})}
      </div>
      <div style={{background:GL2,borderRadius:14,padding:"14px 16px",border:`1.5px solid ${GL}`,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        {[{l:"月々の返済",v:`${active.monthly}万円`,c:BLU},{l:"総返済額",v:`${active.total.toLocaleString()}万円`,c:T1},{l:"利息総額",v:`${active.interest}万円`,c:YLW}].map(m=><div key={m.l} style={{textAlign:"center"}}><div style={{fontSize:10,color:T3,marginBottom:4,fontWeight:600}}>{m.l}</div><div style={{fontSize:18,fontWeight:900,color:m.c,fontFamily:"Inter,sans-serif"}}>{m.v}</div></div>)}
      </div>
    </Card>
  </div>);
}

// ── CFO提案タブ ──
function CFOTab({r}){
  const cards=[
    {pri:"高",icon:"◆",title:"在庫圧縮で調整純資産を改善",desc:"仕掛品の製品化を進め、在庫評価差額を縮小。3ヶ月で実行可能。",impact:Math.round(r.invGap*0.6),color:G,bg:GL2},
    {pri:"高",icon:"◆",title:"役員報酬の正常化",desc:"過大役員報酬を年240万円圧縮し、3期平均EBITDAを改善。返済余力が向上。",impact:Math.round(240*r.multiplier),color:BLU,bg:BLUBG},
    {pri:"中",icon:"◇",title:"月次決算体制の構築",desc:"月次試算表の提出で銀行評価が1段階上昇。質的評価の上振れ要因。",impact:Math.round(r.final*0.1),color:PRP,bg:PRPBG},
    {pri:"中",icon:"◇",title:"取引先分散の推進",desc:"上位顧客への依存度を50%以下に。集中リスクを解消し与信評価向上。",impact:Math.round(r.final*0.08),color:YLW,bg:YLWBG},
    {pri:"低",icon:"○",title:"利益計画書の精度向上",desc:"3期分の事業計画を策定し、達成率の説明責任を果たす。",impact:50,color:GD,bg:SOFT},
  ];
  return(<div>
    <Card><SL>仮想CFOからの提案 — {r.verdict==="REJECT"?"承認獲得のための":""}優先施策</SL>
      {cards.map((c,i)=>(
        <div key={i} style={{display:"flex",gap:12,padding:"12px 14px",background:c.bg,borderRadius:12,marginBottom:8,border:`1px solid ${c.color}33`}}>
          <div style={{fontSize:24,color:c.color}}>{c.icon}</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:3}}>
              <div style={{fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:999,background:c.color,color:"#fff"}}>優先度:{c.pri}</div>
              <div style={{fontSize:13,fontWeight:800,color:T1}}>{c.title}</div>
            </div>
            <div style={{fontSize:11,color:T2,lineHeight:1.6,fontWeight:500}}>{c.desc}</div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:9,color:T3,fontWeight:700}}>期待効果</div>
            <div style={{fontSize:16,fontWeight:900,color:c.color,fontFamily:"Inter,sans-serif"}}>+{c.impact.toLocaleString()}万</div>
          </div>
        </div>
      ))}
    </Card>
  </div>);
}

// ── 金融機関推薦タブ ──
function LenderTab({r}){
  const lenders=r.segment==="積極支援"?[
    {name:"メガバンク プロパー融資",rate:"0.8〜1.5%",limit:"〜1億円",speed:"3〜4週間",fit:"高",bg:GL2,c:GD,desc:"信用力の高い企業向け。担保不要のプロパー枠。"},
    {name:"地銀 プロパー融資",rate:"1.0〜2.0%",limit:"〜5,000万円",speed:"2〜3週間",fit:"高",bg:GL2,c:GD,desc:"地元密着型。長期安定取引が条件。"},
    {name:"日本政策金融公庫",rate:"1.2〜2.5%",limit:"〜7,200万円",speed:"3〜4週間",fit:"中",bg:BLUBG,c:BLUTC,desc:"設備資金は最大15年。創業・事業拡大に強い。"},
  ]:r.segment==="是々非々"?[
    {name:"信用保証協会付き融資",rate:"1.5〜2.5%",limit:"〜2,800万円",speed:"3〜5週間",fit:"高",bg:GL2,c:GD,desc:"保証協会の保証付き。中小企業の主力資金調達手段。"},
    {name:"日本政策金融公庫 中小企業事業",rate:"1.2〜2.5%",limit:"〜4,800万円",speed:"3〜4週間",fit:"高",bg:GL2,c:GD,desc:"政府系。長期返済・固定金利が魅力。"},
    {name:"地銀 保証付き融資",rate:"1.8〜3.0%",limit:"〜2,000万円",speed:"2〜3週間",fit:"中",bg:BLUBG,c:BLUTC,desc:"プロパーは難しいが、保証付きなら可能性あり。"},
  ]:[
    {name:"制度融資（自治体）",rate:"1.5〜2.5%",limit:"〜1,000万円",speed:"4〜6週間",fit:"中",bg:YLWBG,c:YLWTC,desc:"自治体・保証協会・銀行の三者協調型。再生支援メニューあり。"},
    {name:"日本政策金融公庫 セーフティネット",rate:"1.5〜2.5%",limit:"〜4,000万円",speed:"4〜6週間",fit:"中",bg:YLWBG,c:YLWTC,desc:"業況悪化時の救済資金。条件緩和あり。"},
    {name:"事業再生支援機構",rate:"応相談",limit:"応相談",speed:"2〜3ヶ月",fit:"低",bg:REDBG,c:REDTC,desc:"財務改善計画の策定が前提。長期戦になる。"},
  ];
  return(<div>
    <Card><SL>あなたの与信ランクに合った金融機関 — {r.creditRating}</SL>
      <div style={{fontSize:11,color:T2,lineHeight:1.7,marginBottom:12}}>セグメント判定「<strong>{r.segment}</strong>」に基づき、最適な3つの調達先を提案します。</div>
      {lenders.map((l,i)=>(
        <div key={i} style={{background:l.bg,borderRadius:12,padding:"14px 16px",marginBottom:10,border:`1px solid ${l.c}44`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
            <div style={{fontSize:14,fontWeight:800,color:T1}}>{l.name}</div>
            <div style={{fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:999,background:l.c,color:"#fff"}}>適合度:{l.fit}</div>
          </div>
          <div style={{fontSize:11,color:T2,lineHeight:1.6,marginBottom:8}}>{l.desc}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {[{l:"金利目安",v:l.rate},{l:"借入限度",v:l.limit},{l:"審査期間",v:l.speed}].map(m=>(
              <div key={m.l} style={{background:"rgba(255,255,255,0.7)",borderRadius:8,padding:"6px 8px",textAlign:"center"}}>
                <div style={{fontSize:9,color:T3,fontWeight:700}}>{m.l}</div>
                <div style={{fontSize:12,fontWeight:800,color:l.c}}>{m.v}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </Card>
  </div>);
}

// ── 補助金 vs 融資 比較タブ ──
function CompareTab(){
  const rows=[
    {label:"返済義務",sub:"◎",fin:"×",both:"○"},
    {label:"調達速度",sub:"△",fin:"○",both:"○"},
    {label:"上限額",sub:"○",fin:"◎",both:"◎"},
    {label:"書類負担",sub:"×",fin:"△",both:"△"},
    {label:"採択確率",sub:"△",fin:"○",both:"○"},
    {label:"使途の自由度",sub:"△",fin:"◎",both:"○"},
    {label:"自己資金要件",sub:"○",fin:"△",both:"△"},
  ];
  const cs=(v)=>v==="◎"?G:v==="○"?BLU:v==="△"?YLW:RED;
  return(<div>
    <Card><SL>補助金 vs 融資 vs 組合せ — メリット比較</SL>
      <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr 1fr 1fr",gap:8,fontSize:11,marginBottom:8}}>
        <div></div>
        {[{l:"補助金",c:G},{l:"融資",c:BLU},{l:"組合せ",c:PRP}].map(h=>(
          <div key={h.l} style={{textAlign:"center",fontWeight:800,padding:"8px 0",background:h.c,color:"#fff",borderRadius:8}}>{h.l}</div>
        ))}
      </div>
      {rows.map((r,i)=>(
        <div key={i} style={{display:"grid",gridTemplateColumns:"1.4fr 1fr 1fr 1fr",gap:8,padding:"10px 0",borderBottom:i<rows.length-1?`1px solid ${BD}`:"none",alignItems:"center"}}>
          <div style={{fontSize:12,fontWeight:700,color:T1}}>{r.label}</div>
          {[r.sub,r.fin,r.both].map((v,j)=>(
            <div key={j} style={{textAlign:"center",fontSize:22,fontWeight:900,color:cs(v)}}>{v}</div>
          ))}
        </div>
      ))}
      <div style={{marginTop:12,padding:"10px 14px",background:GL2,borderRadius:10,fontSize:11,color:GD,fontWeight:600,lineHeight:1.7}}>
        <strong>結論:</strong> 補助金は返済不要だが時間がかかり、融資は速いが返済義務あり。両方を組み合わせるのが最も効率的です。
      </div>
    </Card>
  </div>);
}

// ── 補助金+融資 組合せ提案タブ ──
function SchemeTab({r}){
  const [total,setTotal]=useState(3000);
  const subsidy=Math.min(total*0.5,1000);
  const debt=Math.min(total-subsidy-Math.min(total*0.2,500),r.final);
  const equity=Math.max(0,total-subsidy-debt);
  const segs=[
    {label:"自己資金",val:equity,c:GD,bg:GL2},
    {label:"補助金",val:subsidy,c:G,bg:GL},
    {label:"融資",val:debt,c:BLU,bg:BLUBG},
  ];
  return(<div>
    <Card><SL>設備投資 {total.toLocaleString()}万円の最適調達構成</SL>
      <div style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:11,color:T2,fontWeight:600}}>投資総額</span>
          <span style={{fontSize:18,fontWeight:900,color:T1}}>{total.toLocaleString()}万円</span>
        </div>
        <input type="range" min={500} max={10000} step={100} value={total} onChange={e=>setTotal(parseInt(e.target.value))} style={{width:"100%",accentColor:G}}/>
      </div>
      <div style={{display:"flex",height:36,borderRadius:10,overflow:"hidden",marginBottom:12,border:`1px solid ${BD}`}}>
        {segs.map(s=>(
          <div key={s.label} style={{width:`${s.val/total*100}%`,background:s.c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff"}}>
            {s.val>=total*0.1?`${Math.round(s.val/total*100)}%`:""}
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        {segs.map(s=>(
          <div key={s.label} style={{background:s.bg,borderRadius:10,padding:"10px 12px",border:`1px solid ${s.c}44`}}>
            <div style={{fontSize:9,color:T3,fontWeight:700,marginBottom:2}}>{s.label}</div>
            <div style={{fontSize:18,fontWeight:900,color:s.c,fontFamily:"Inter,sans-serif"}}>{Math.round(s.val).toLocaleString()}<span style={{fontSize:10}}>万円</span></div>
            <div style={{fontSize:9,color:T2,marginTop:3,fontWeight:600}}>{Math.round(s.val/total*100)}%</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:14,padding:"12px 14px",background:PRPBG,borderRadius:10,border:`1px solid ${PRPBR}`,fontSize:11,color:PRPTC,lineHeight:1.7,fontWeight:600}}>
        補助金で初期負担を {Math.round(subsidy/total*100)}% 削減し、残額を融資で調達することで、自己資金を {Math.round(equity).toLocaleString()}万円に抑えられます。
      </div>
    </Card>
  </div>);
}

// ── 担保評価タブ ──
function CollateralTab({inp,r}){
  const items=[
    {label:"不動産（事業用）",book:inp.fixedAssetsWithCollateral||0,rate:0.70,note:"事業用不動産は時価の70%評価"},
    {label:"売掛金",book:r.evalRec||0,rate:0.50,note:"優良取引先は50%まで評価"},
    {label:"在庫",book:r.evalInv||0,rate:0.30,note:"製品中心であれば30%評価"},
  ];
  const total=items.reduce((s,i)=>s+i.book*i.rate,0);
  return(<div>
    <Card><SL>担保評価額一覧</SL>
      {items.map((it,i)=>(
        <div key={i} style={{padding:"12px 0",borderBottom:i<items.length-1?`1px solid ${BD}`:"none"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <div style={{fontSize:13,fontWeight:700,color:T1}}>{it.label}</div>
            <div style={{fontSize:14,fontWeight:900,color:G,fontFamily:"Inter,sans-serif"}}>{Math.round(it.book*it.rate).toLocaleString()}万円</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <div style={{flex:1,height:6,background:BD,borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${it.rate*100}%`,background:G}}/>
            </div>
            <div style={{fontSize:10,fontWeight:700,color:GD,minWidth:36}}>{Math.round(it.rate*100)}%評価</div>
          </div>
          <div style={{fontSize:10,color:T3,fontWeight:500}}>帳簿価額 {Math.round(it.book).toLocaleString()}万円 — {it.note}</div>
        </div>
      ))}
      <div style={{marginTop:12,padding:"12px 14px",background:GL2,borderRadius:10,display:"flex",justifyContent:"space-between",alignItems:"center",border:`1.5px solid ${G}`}}>
        <div style={{fontSize:12,fontWeight:800,color:GD}}>担保評価合計</div>
        <div style={{fontSize:22,fontWeight:900,color:GD,fontFamily:"Inter,sans-serif"}}>{Math.round(total).toLocaleString()}万円</div>
      </div>
    </Card>
  </div>);
}

// ── 銀行面談チェックリストタブ ──
function ChecklistTab({r}){
  const [checked,setChecked]=useState({});
  const qs=[
    {q:"資金使途は何ですか？",a:`${r.fundPurpose==="working"?"運転資金として、季節要因による売掛金増加に対応します":"設備投資として、生産性向上のための機械導入を予定しています"}。具体的な見積書と投資計画書を提出済みです。`},
    {q:"返済原資は何ですか？",a:`3期平均EBITDA ${Math.round(r.ebitdaAvg).toLocaleString()}万円を返済原資とします。DSCR ${r.dscr?r.dscr.toFixed(2):"—"}を維持できる返済計画です。`},
    {q:"他行借入の状況は？",a:`現在の有利子負債は${Math.round(r.interestBearingDebt).toLocaleString()}万円。今回の借入でDCR ${r.dcr?r.dcr.toFixed(1):"—"}年となり、業界平均の範囲内です。`},
    {q:"なぜ当行を選んだのですか？",a:"地域での長年のお取引と、当行の事業性評価への取り組みに信頼を寄せているためです。長期パートナーシップを期待しています。"},
    {q:"事業計画の前提条件は？",a:"市場規模・競合分析・自社シェア推移の3軸で前提を置いています。保守的シナリオでも返済計画は成立します。"},
    {q:"取引先の集中リスクは？",a:"上位3社で約40%。新規開拓により分散を進めており、来期には30%以下を目指します。"},
    {q:"後継者・経営体制は？",a:"代表取締役のもと、財務・営業・製造の各責任者を配置。月次で経営会議を実施しています。"},
  ];
  const tg=(i)=>setChecked({...checked,[i]:!checked[i]});
  const done=Object.values(checked).filter(Boolean).length;
  return(<div>
    <Card>
      <SL>銀行面談 想定Q&A — {done}/{qs.length} 準備完了</SL>
      <div style={{height:6,background:BD,borderRadius:3,overflow:"hidden",marginBottom:14}}>
        <div style={{height:"100%",width:`${done/qs.length*100}%`,background:GRAD,transition:"width .3s"}}/>
      </div>
      {qs.map((item,i)=>(
        <div key={i} onClick={()=>tg(i)} style={{padding:"12px 14px",marginBottom:8,borderRadius:10,cursor:"pointer",background:checked[i]?GL2:SOFT,border:`1px solid ${checked[i]?GL:BD}`,transition:"all .15s"}}>
          <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:6}}>
            <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${checked[i]?G:T3}`,background:checked[i]?G:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
              {checked[i]&&<span style={{color:"#fff",fontSize:11,fontWeight:900}}>✓</span>}
            </div>
            <div style={{flex:1,fontSize:13,fontWeight:800,color:T1}}>Q. {item.q}</div>
          </div>
          <div style={{fontSize:11,color:T2,lineHeight:1.7,fontWeight:500,paddingLeft:28}}>A. {item.a}</div>
        </div>
      ))}
    </Card>
  </div>);
}

// ── リスケ提案タブ ──
function RescheduleTab({r}){
  const monthly=r.interestBearingDebt/7/12;
  const patterns=[
    {label:"元金据置（6ヶ月）",desc:"6ヶ月間は利息のみ支払い。元金返済を一時停止。",monthlyAfter:r.interestBearingDebt*0.018/12,saving:Math.round(monthly*0.7),risk:"低"},
    {label:"返済期間延長（7年→10年）",desc:"返済期間を3年延長。月次返済額を圧縮。",monthlyAfter:r.interestBearingDebt/10/12,saving:Math.round(monthly-r.interestBearingDebt/10/12),risk:"中"},
    {label:"金利引下げ交渉",desc:"プロパー金利から保証付き融資への切替。利息負担を軽減。",monthlyAfter:monthly*0.92,saving:Math.round(monthly*0.08),risk:"中"},
  ];
  return(<div>
    {r.dscr&&r.dscr<1.2?(
      <Card style={{background:YLWBG,border:`1.5px solid ${YLWBR}`}}>
        <SL color={YLWTC}>注意 — DSCR {r.dscr.toFixed(2)} — リスケ検討推奨</SL>
        <div style={{fontSize:11,color:YLWTC,lineHeight:1.7,fontWeight:600}}>
          現在の返済余力では新規借入が困難です。下記のリスケ案を検討し、返済負担を軽減することで信用回復が見込めます。
        </div>
      </Card>
    ):(
      <Card style={{background:GL2,border:`1.5px solid ${GL}`}}>
        <SL color={GD}>現状 — 返済余力は健全</SL>
        <div style={{fontSize:11,color:GD,lineHeight:1.7,fontWeight:600}}>
          DSCR {r.dscr?r.dscr.toFixed(2):"—"} は基準値を上回っています。リスケの必要はありませんが、参考までに3パターンを試算します。
        </div>
      </Card>
    )}
    <Card><SL>リスケ3パターン比較</SL>
      {patterns.map((p,i)=>(
        <div key={i} style={{padding:"14px 0",borderBottom:i<patterns.length-1?`1px solid ${BD}`:"none"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
            <div style={{fontSize:13,fontWeight:800,color:T1}}>{p.label}</div>
            <div style={{fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:999,background:p.risk==="低"?G:YLW,color:"#fff"}}>リスク:{p.risk}</div>
          </div>
          <div style={{fontSize:11,color:T2,lineHeight:1.6,marginBottom:8}}>{p.desc}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div style={{background:SOFT,borderRadius:8,padding:"8px 10px"}}>
              <div style={{fontSize:9,color:T3,fontWeight:700}}>変更後 月返済</div>
              <div style={{fontSize:14,fontWeight:900,color:T1}}>{Math.round(p.monthlyAfter).toLocaleString()}<span style={{fontSize:9}}>万円</span></div>
            </div>
            <div style={{background:GL2,borderRadius:8,padding:"8px 10px"}}>
              <div style={{fontSize:9,color:GD,fontWeight:700}}>月次キャッシュ改善</div>
              <div style={{fontSize:14,fontWeight:900,color:GD}}>+{p.saving.toLocaleString()}<span style={{fontSize:9}}>万円</span></div>
            </div>
          </div>
        </div>
      ))}
    </Card>
  </div>);
}

// ── BS/PL読解タブ ──
function ReadingTab(){
  const [v,setV]=useState({sales:30000,opProfit:1500,fixedAsset:5000,debt:4000,equity:2200});
  const upd=(k,val)=>setV({...v,[k]:parseFloat(val)||0});
  const equityRatio=v.equity/(v.equity+v.debt)*100;
  const roa=v.opProfit/(v.equity+v.debt)*100;
  const debtMult=v.debt/v.opProfit;
  const fields=[
    {k:"sales",l:"売上高",u:"万円"},
    {k:"opProfit",l:"営業利益",u:"万円"},
    {k:"fixedAsset",l:"固定資産",u:"万円"},
    {k:"debt",l:"有利子負債",u:"万円"},
    {k:"equity",l:"純資産",u:"万円"},
  ];
  const metrics=[
    {l:"自己資本比率",v:`${equityRatio.toFixed(1)}%`,note:equityRatio>=30?"健全":equityRatio>=20?"標準":"要改善",c:equityRatio>=30?G:equityRatio>=20?BLU:RED,desc:"純資産÷総資産。30%以上が理想。"},
    {l:"ROA",v:`${roa.toFixed(2)}%`,note:roa>=5?"優良":roa>=2?"標準":"要改善",c:roa>=5?G:roa>=2?BLU:RED,desc:"営業利益÷総資産。資産効率性の指標。"},
    {l:"有利子負債倍率",v:`${debtMult.toFixed(1)}倍`,note:debtMult<=5?"健全":debtMult<=10?"標準":"要改善",c:debtMult<=5?G:debtMult<=10?BLU:RED,desc:"借入÷営業利益。10倍以下が理想。"},
  ];
  return(<div>
    <Card><SL>財務数値を入力</SL>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {fields.map(f=>(
          <div key={f.k}>
            <div style={{fontSize:10,color:T3,fontWeight:700,marginBottom:4}}>{f.l}</div>
            <div style={{display:"flex",alignItems:"center",background:SOFT,borderRadius:8,padding:"8px 10px",border:`1px solid ${BD}`}}>
              <input type="number" value={v[f.k]} onChange={e=>upd(f.k,e.target.value)} style={{flex:1,border:"none",background:"transparent",outline:"none",fontSize:14,fontWeight:800,color:T1,fontFamily:"Inter,sans-serif"}}/>
              <span style={{fontSize:10,color:T3,fontWeight:600}}>{f.u}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
    <Card><SL>主要指標 — 自動計算</SL>
      {metrics.map((m,i)=>(
        <div key={i} style={{padding:"12px 14px",marginBottom:8,background:SOFT,borderRadius:10,border:`1px solid ${BD}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <div style={{fontSize:12,fontWeight:800,color:T1}}>{m.l}</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <div style={{fontSize:18,fontWeight:900,color:m.c,fontFamily:"Inter,sans-serif"}}>{m.v}</div>
              <div style={{fontSize:9,fontWeight:800,padding:"3px 8px",borderRadius:999,background:m.c,color:"#fff"}}>{m.note}</div>
            </div>
          </div>
          <div style={{fontSize:10,color:T2,fontWeight:500}}>{m.desc}</div>
        </div>
      ))}
    </Card>
  </div>);
}
