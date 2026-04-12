"use client";
import { useState } from "react";

const G="#10B981",GD="#059669",GL="#D1FAE5",GL2="#ECFDF5";
const GRAD="linear-gradient(90deg,#10B981,#22C55E)";
const BG="#EEF2EF",SOFT="#F7FAF8";
const SH="0 4px 20px rgba(15,23,42,0.06)";
const SHG="0 8px 24px rgba(16,185,129,0.22)";
const BD="#E2E8F0",T1="#0A0F0A",T2="#334155",T3="#94A3B8";
const PRP="#7C3AED",PRPBG="#F5F3FF";
const BLU="#1D4ED8",BLUBG="#EFF6FF",BLUBR="#BFDBFE",BLUTC="#1E3A8A";
const ORG="#F97316";

const MODES=[
  {
    id:"subsidy" as const,
    dot:G,
    label:"補助金・助成金を探したい",
    tag:"返済不要",
    tagBg:GL2,tagTc:GD,
    desc:"国・都道府県・市区町村・商工会議所の補助金をAIが横断検索。申請書の作成まで対応します。",
    bg:GL2,border:GL,tc:GD,hdr:G,
    recommended:false,
  },
  {
    id:"finance" as const,
    dot:BLU,
    label:"融資・借入を検討したい",
    tag:"確実に調達",
    tagBg:BLUBG,tagTc:BLUTC,
    desc:"借入可能額の診断、財務改善アドバイス、銀行面談の想定Q&A生成まで対応します。",
    bg:BLUBG,border:BLUBR,tc:BLUTC,hdr:BLU,
    recommended:false,
  },
  {
    id:"both" as const,
    dot:PRP,
    label:"両方組み合わせたい",
    tag:"おすすめ",
    tagBg:"linear-gradient(90deg,#10B981,#7C3AED)",tagTc:"#fff",
    desc:"補助金＋融資の最適な組み合わせを提案。設備投資額に対して最大限の資金調達を実現します。",
    bg:`linear-gradient(135deg,${GL2},${PRPBG})`,border:G,tc:T1,hdr:GRAD,
    recommended:true,
  },
];

export type Mode = "subsidy" | "finance" | "both";

interface Props {
  onSelect: (mode: Mode) => void;
  onSample?: (mode: Mode) => void;
}

export default function ModeSelect({onSelect,onSample}: Props){
  const [hov,setHov]=useState<string|null>(null);
  return(
    <div style={{minHeight:"100vh",background:BG,fontFamily:"Noto Sans JP,Inter,sans-serif",display:"flex",flexDirection:"column"}}>
      <div style={{background:BG,borderBottom:`1px solid ${BD}`,padding:"0 48px",height:68,display:"flex",alignItems:"center",flexShrink:0}}>
        <div style={{display:"flex",flexDirection:"column",lineHeight:1}}>
          <div style={{fontSize:9,fontWeight:700,color:"rgb(18,130,55)",letterSpacing:".12em",fontFamily:"Arial,sans-serif",marginBottom:1}}>補助金AI</div>
          <div style={{fontSize:28,fontWeight:900,color:"rgb(34,177,76)",fontFamily:"sans-serif",letterSpacing:"-.05em"}}>トルモ</div>
        </div>
        <div style={{marginLeft:"auto",fontSize:11,color:T3,fontWeight:600,padding:"5px 12px",background:SOFT,borderRadius:8,border:`1px solid ${BD}`}}>無料で使えます</div>
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px"}}>
        <div style={{textAlign:"center",marginBottom:36,maxWidth:540}}>
          <div style={{display:"inline-block",background:GL2,border:`1px solid ${GL}`,borderRadius:999,padding:"4px 14px",fontSize:10,fontWeight:700,color:GD,letterSpacing:".08em",marginBottom:14}}>補助金 × 融資 × AI</div>
          <div style={{fontSize:26,fontWeight:900,color:T1,letterSpacing:"-.03em",marginBottom:10,lineHeight:1.3,fontFamily:"Noto Sans JP,sans-serif"}}>今日はどのようなご相談ですか？</div>
          <div style={{fontSize:13,color:T2,fontWeight:500,lineHeight:1.7}}>選択した内容に合わせて、最適な資金調達の方法をAIが提案します。</div>
        </div>

        <div style={{width:"100%",maxWidth:640,display:"flex",flexDirection:"column",gap:12}}>
          {MODES.map(m=>(
            <div key={m.id}
              style={{background:m.bg,border:`2px solid ${hov===m.id?m.tc:m.border}`,borderRadius:20,overflow:"hidden",
                transition:"all .18s",boxShadow:hov===m.id?SHG:SH,transform:hov===m.id?"translateY(-1px)":"none",position:"relative"}}
              onMouseEnter={()=>setHov(m.id)} onMouseLeave={()=>setHov(null)}>
              {m.recommended&&(
                <div style={{position:"absolute",top:0,right:0,background:"linear-gradient(90deg,#10B981,#7C3AED)",color:"#fff",
                  fontSize:9,fontWeight:800,padding:"4px 14px",borderBottomLeftRadius:10,letterSpacing:".08em"}}>おすすめ</div>
              )}
              <div onClick={()=>onSelect(m.id)} style={{padding:"20px 22px 14px",cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:m.dot,flexShrink:0,marginTop:5}}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap"}}>
                      <div style={{fontSize:16,fontWeight:900,color:T1,letterSpacing:"-.02em"}}>{m.label}</div>
                      <div style={{fontSize:10,fontWeight:800,padding:"2px 10px",borderRadius:999,
                        background:m.tagBg,color:m.tagTc,flexShrink:0}}>{m.tag}</div>
                    </div>
                    <div style={{fontSize:13,color:T2,lineHeight:1.7,fontWeight:500}}>{m.desc}</div>
                  </div>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={m.tc} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:4}}>
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </div>
              <div style={{borderTop:"1px solid rgba(0,0,0,0.06)",padding:"10px 22px",display:"flex",gap:8}}>
                <button onClick={()=>onSelect(m.id)}
                  style={{flex:1,background:m.hdr,color:"#fff",border:"none",borderRadius:10,padding:"8px 0",
                    fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 8px rgba(0,0,0,0.12)"}}>
                  インテークから始める
                </button>
                {onSample&&(
                  <button onClick={()=>onSample(m.id)}
                    style={{flex:1,background:"rgba(255,255,255,0.8)",color:m.tc,border:`1.5px solid ${m.border}`,
                      borderRadius:10,padding:"8px 0",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .12s"}}>
                    サンプルを見る
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {onSample&&(
          <div style={{marginTop:20,fontSize:11,color:T3,fontWeight:500,textAlign:"center"}}>
            「サンプルを見る」では製造業・愛知県の企業（山田製作所）のデモデータで結果を確認できます
          </div>
        )}
      </div>
    </div>
  );
}
