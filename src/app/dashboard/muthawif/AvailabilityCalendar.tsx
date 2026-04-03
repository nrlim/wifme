"use client";

import { useState, useTransition, useCallback } from "react";
import { setDaySchedule, applyScheduleTemplate, type SchedulePattern } from "./actions";

type AvailabilityRecord = {
  date: Date | string;
  status: "AVAILABLE" | "BOOKED" | "OFF";
  timeSlots: string[];
};

type Props = {
  availability: AvailabilityRecord[];
};

type RightPanel = "none" | "day" | "template";

const MONTH_NAMES = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];
const DAY_SHORT  = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
const DAY_LONG   = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];

const TIME_SLOTS = [
  "07:00","07:30","08:00","08:30","09:00","09:30",
  "10:00","10:30","11:00","11:30","12:00","12:30",
  "13:00","13:30","14:00","14:30","15:00","15:30",
  "16:00","16:30","17:00","17:30","18:00","18:30",
  "19:00","19:30","20:00",
];

const PRESETS = [
  { label:"Pagi",     desc:"07:00–12:00", slots:["07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00"] },
  { label:"Siang",    desc:"12:00–17:00", slots:["12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"] },
  { label:"Sore",     desc:"17:00–20:00", slots:["17:00","17:30","18:00","18:30","19:00","19:30","20:00"] },
  { label:"Full Day", desc:"07:00–20:00", slots:TIME_SLOTS },
];

const PATTERNS: { id: SchedulePattern; emoji: string; label: string; sub: string }[] = [
  { id:"ALL_DAYS",    emoji:"☀️", label:"Setiap Hari",    sub:"Senin – Minggu" },
  { id:"WEEKDAYS",   emoji:"💼", label:"Hari Kerja",     sub:"Senin – Jumat"  },
  { id:"WEEKENDS",   emoji:"🌴", label:"Akhir Pekan",   sub:"Sabtu & Minggu" },
  { id:"CUSTOM_DAYS",emoji:"✏️", label:"Pilih Sendiri", sub:"Kustom"          },
];

function getKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function isPast(d: Date) {
  const t = new Date(); t.setHours(0,0,0,0);
  const c = new Date(d); c.setHours(0,0,0,0);
  return c < t;
}

/* ─────────────────────────── COMPONENT ─────────────────────────────────── */
export function AvailabilityCalendar({ availability }: Props) {
  const today = new Date();

  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear,  setViewYear]  = useState(today.getFullYear());

  const [panel, setPanel]         = useState<RightPanel>("none");
  const [selDate, setSelDate]     = useState<Date|null>(null);

  const [dayStatus, setDayStatus] = useState<"AVAILABLE"|"OFF">("AVAILABLE");
  const [daySlots,  setDaySlots]  = useState<string[]>([]);

  const [tplStep,    setTplStep]    = useState(1);
  const [tplPat,     setTplPat]     = useState<SchedulePattern>("WEEKDAYS");
  const [tplDays,    setTplDays]    = useState<number[]>([1,2,3,4,5]);
  const [tplSlots,   setTplSlots]   = useState<string[]>(["08:00","09:00","10:00","11:00","13:00","14:00","15:00","16:00"]);
  const [tplMonths,  setTplMonths]  = useState(1);
  const [tplConfirm, setTplConfirm] = useState(false);

  const [isPending, startTrans] = useTransition();
  const [toast, setToast]       = useState<{ok:boolean;msg:string}|null>(null);

  const showToast = (ok:boolean, msg:string) => {
    setToast({ok,msg});
    setTimeout(()=>setToast(null), 3200);
  };

  const availMap = new Map<string, AvailabilityRecord>();
  for (const rec of availability) {
    availMap.set(getKey(new Date(rec.date)), rec);
  }

  // Month stats for right panel header
  const daysInMo  = new Date(viewYear, viewMonth+1, 0).getDate();
  const moKeys    = Array.from({length:daysInMo},(_,i)=>getKey(new Date(viewYear,viewMonth,i+1)));
  const cntSched  = moKeys.filter(k=>{ const r=availMap.get(k); return r&&r.status==="AVAILABLE"&&r.timeSlots.length>0; }).length;
  const cntBooked = moKeys.filter(k=>availMap.get(k)?.status==="BOOKED").length;
  const cntOff    = moKeys.filter(k=>availMap.get(k)?.status==="OFF").length;

  const todayKey = getKey(today);
  const selKey   = selDate ? getKey(selDate) : null;

  const firstDay  = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number|null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({length:daysInMo},(_,i)=>i+1),
  ];
  while (cells.length % 7) cells.push(null);

  /* ── Navigation ─────────────────────────────────────────────────────── */
  const navPrev = () => {
    if (viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}
    else setViewMonth(m=>m-1);
    setPanel("none"); setSelDate(null);
  };
  const navNext = () => {
    if (viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}
    else setViewMonth(m=>m+1);
    setPanel("none"); setSelDate(null);
  };

  /* ── Handlers ────────────────────────────────────────────────────────── */
  const openDay = useCallback((dayNum:number) => {
    const d = new Date(viewYear, viewMonth, dayNum);
    if (isPast(d)) return;
    setSelDate(d);
    const rec = availMap.get(getKey(d));
    setDayStatus(rec?.status==="OFF" ? "OFF" : "AVAILABLE");
    setDaySlots(rec?.timeSlots ?? []);
    setPanel("day");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMonth, viewYear, availMap]);

  const closePanel  = () => { setPanel("none"); setSelDate(null); };
  const openTemplate = () => { setTplStep(1); setTplConfirm(false); setPanel("template"); };

  const saveDay = () => {
    if (!selDate) return;
    startTrans(async () => {
      const res = await setDaySchedule(getKey(selDate), dayStatus, daySlots);
      showToast(res.success, res.message);
    });
  };

  const applyTemplate = () => {
    startTrans(async () => {
      const res = await applyScheduleTemplate(tplPat, tplDays, tplSlots, tplMonths);
      showToast(res.success, res.message);
      if (res.success) { setPanel("none"); setTplConfirm(false); }
    });
  };

  /* ── Cell style ──────────────────────────────────────────────────────── */
  const cellBg = (dayNum:number) => {
    const k   = getKey(new Date(viewYear,viewMonth,dayNum));
    const rec = availMap.get(k);
    const past = isPast(new Date(viewYear,viewMonth,dayNum));
    if (k===selKey)             return {bg:"#1B6B4A",color:"white",border:"#1B6B4A",shadow:"0 3px 10px rgba(27,107,74,0.4)",fw:800};
    if (rec?.status==="OFF")    return {bg:"#FEF2F2",color:"#C0392B",border:"#FCA5A5",shadow:"none",fw:600};
    if (rec?.status==="BOOKED") return {bg:"rgba(196,151,59,0.1)",color:"#B7881C",border:"#C4973B44",shadow:"none",fw:600};
    if (rec?.timeSlots?.length) return {bg:"#EBF5EF",color:"#1B6B4A",border:"#A7D8BF",shadow:"none",fw:600};
    if (k===todayKey)           return {bg:"var(--emerald-pale)",color:"var(--emerald)",border:"var(--emerald)",shadow:"none",fw:800};
    if (past)                   return {bg:"transparent",color:"#C9CDD4",border:"transparent",shadow:"none",fw:400};
    return {bg:"white",color:"var(--charcoal)",border:"var(--border)",shadow:"none",fw:500};
  };

  const btnStyle = (active:boolean, accent="#1B6B4A") => ({
    border:`2px solid ${active?accent:"var(--border)"}`,
    background:active?`${accent}18`:"white",
    color:active?accent:"var(--charcoal)",
  } as React.CSSProperties);

  /* ──────────────────────────── RENDER ────────────────────────────────── */
  return (
    <div className="avail-cal-root">

      {/* ─── LEFT: CALENDAR ─── */}
      <div className="avail-cal-left" style={{background:"white",borderRadius:"18px",border:"1px solid var(--border)",overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.05)"}}>

        {/* Month nav */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1rem 1.25rem",
          background:"linear-gradient(135deg,#1B6B4A,#27AE60)"}}>
          <button onClick={navPrev} style={{width:34,height:34,borderRadius:"50%",border:"none",
            background:"rgba(255,255,255,0.18)",color:"white",cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span style={{fontWeight:800,fontSize:"1rem",color:"white",letterSpacing:"0.01em"}}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button onClick={navNext} style={{width:34,height:34,borderRadius:"50%",border:"none",
            background:"rgba(255,255,255,0.18)",color:"white",cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        {/* Day headers */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"0.75rem 0.875rem 0.25rem",gap:3}}>
          {DAY_SHORT.map(d=>(
            <div key={d} style={{textAlign:"center",fontSize:"0.6875rem",fontWeight:700,
              color:"var(--text-muted)",letterSpacing:"0.03em",padding:"0.25rem 0"}}>
              {d}
            </div>
          ))}
        </div>

        {/* Date grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"0.25rem 0.875rem 0.875rem",gap:3}}>
          {cells.map((day,i)=>{
            if(!day) return <div key={i}/>;
            const past = isPast(new Date(viewYear,viewMonth,day));
            const c    = cellBg(day);
            const k    = getKey(new Date(viewYear,viewMonth,day));
            const rec  = availMap.get(k);
            return (
              <button key={i} onClick={()=>openDay(day)} disabled={past}
                style={{aspectRatio:"1",borderRadius:"9px",
                  border:`1.5px solid ${c.border}`,
                  background:c.bg,color:c.color,
                  fontSize:"0.8125rem",fontWeight:c.fw,
                  cursor:past?"not-allowed":"pointer",
                  opacity:past?0.35:1,
                  display:"flex",flexDirection:"column",
                  alignItems:"center",justifyContent:"center",gap:"2px",
                  transition:"all 0.15s",fontFamily:"inherit",
                  boxShadow:c.shadow,
                }}>
                {day}
                {rec && rec.timeSlots.length>0 && rec.status!=="OFF" && k!==selKey && (
                  <span style={{width:4,height:4,borderRadius:"50%",background:"currentColor",opacity:0.7,display:"block"}}/>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{borderTop:"1px solid var(--border)",padding:"0.625rem 0.875rem",
          display:"flex",gap:"0.875rem",flexWrap:"wrap"}}>
          {[
            {bg:"#EBF5EF",br:"#A7D8BF",label:"Ada jadwal"},
            {bg:"#FEF2F2",br:"#FCA5A5",label:"Off"},
            {bg:"rgba(196,151,59,0.1)",br:"#C4973B55",label:"Terpesan"},
          ].map(l=>(
            <div key={l.label} style={{display:"flex",alignItems:"center",gap:"0.35rem"}}>
              <span style={{width:11,height:11,borderRadius:"3px",background:l.bg,
                border:`1.5px solid ${l.br}`,display:"inline-block",flexShrink:0}}/>
              <span style={{fontSize:"0.6875rem",color:"var(--text-muted)",fontWeight:500}}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── RIGHT: PANEL ─── */}
      <div className="avail-cal-right" style={{display:"flex",flexDirection:"column",borderRadius:"18px",
        border:"1px solid var(--border)",overflow:"hidden",
        boxShadow:"0 2px 12px rgba(0,0,0,0.05)"}}>

        {/* ── Stats bar — always at top of right card ── */}
        <div style={{background:"var(--ivory-dark)",borderBottom:"1px solid var(--border)",
          padding:"0.75rem 1.125rem",display:"flex",alignItems:"center"}}>
          {[
            {dot:"#1B6B4A", value:cntSched,  label:"Terjadwal"},
            {dot:"#B7881C", value:cntBooked, label:"Terpesan"},
            {dot:"#B91C1C", value:cntOff,    label:"Hari Off"},
          ].map((s,i)=>(
            <div key={s.label} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
              borderRight:i<2?"1px solid var(--border)":"none",padding:"0 0.5rem"}}>
              <div style={{display:"flex",alignItems:"center",gap:"0.3rem"}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:s.dot,display:"inline-block",flexShrink:0}}/>
                <span style={{fontSize:"1.0625rem",fontWeight:800,color:s.dot,lineHeight:1}}>{s.value}</span>
              </div>
              <div style={{fontSize:"0.625rem",fontWeight:500,color:"var(--text-muted)",marginTop:"0.15rem"}}>
                {s.label}
              </div>
            </div>
          ))}
          <div style={{borderLeft:"1px solid var(--border)",paddingLeft:"0.75rem",marginLeft:"0.25rem",textAlign:"center"}}>
            <div style={{fontSize:"0.625rem",color:"var(--text-muted)",fontWeight:500}}>
              {MONTH_NAMES[viewMonth]}
            </div>
            <div style={{fontSize:"0.875rem",color:"var(--charcoal)",fontWeight:800}}>{viewYear}</div>
          </div>
        </div>

        {/* ── Panel body ── */}
        <div style={{background:"white",flex:1}}>

          {/* ══ NONE: Welcome ══ */}
          {panel==="none" && (
            <div style={{padding:"2rem 1.5rem",display:"flex",flexDirection:"column",
              alignItems:"center",gap:"1.5rem",textAlign:"center"}}>

              <div style={{width:56,height:56,borderRadius:"50%",
                background:"linear-gradient(135deg,#EBF5EF,#D1FAE5)",
                display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1B6B4A" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                  <line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/>
                </svg>
              </div>

              <div>
                <div style={{fontWeight:800,fontSize:"1rem",color:"var(--charcoal)",marginBottom:"0.3rem"}}>
                  Mulai Atur Jadwal
                </div>
                <div style={{fontSize:"0.8125rem",color:"var(--text-muted)",lineHeight:1.6}}>
                  Pilih cara yang paling mudah untuk Anda.
                </div>
              </div>

              <div style={{width:"100%",display:"flex",flexDirection:"column",gap:"0.625rem"}}>
                <button onClick={openTemplate}
                  style={{width:"100%",padding:"0.9rem 1.125rem",borderRadius:"13px",
                    border:"2px solid #1B6B4A",background:"#1B6B4A",
                    color:"white",cursor:"pointer",fontFamily:"inherit",
                    display:"flex",alignItems:"center",gap:"0.75rem",textAlign:"left",
                    boxShadow:"0 4px 14px rgba(27,107,74,0.3)"}}>
                  <span style={{fontSize:"1.375rem",flexShrink:0}}>⚡</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:"0.9rem"}}>Setup Cepat — Template</div>
                    <div style={{fontSize:"0.72rem",opacity:0.85,marginTop:"0.1rem"}}>
                      Atur banyak hari sekaligus dalam 3 langkah
                    </div>
                  </div>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginLeft:"auto",flexShrink:0}}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>

                <div style={{padding:"0.875rem 1rem",borderRadius:"12px",border:"1.5px solid var(--border)",
                  background:"var(--ivory)",display:"flex",alignItems:"center",gap:"0.75rem",textAlign:"left"}}>
                  <span style={{fontSize:"1.375rem",flexShrink:0}}>📅</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:"0.9rem",color:"var(--charcoal)"}}>Atur per Hari</div>
                    <div style={{fontSize:"0.72rem",color:"var(--text-muted)",marginTop:"0.1rem"}}>
                      Klik tanggal di kalender untuk atur jam & status
                    </div>
                  </div>
                </div>
              </div>

              <div style={{fontSize:"0.75rem",color:"var(--text-muted)",lineHeight:1.65,
                padding:"0.75rem",background:"var(--ivory-dark)",borderRadius:"10px",
                width:"100%",textAlign:"left",border:"1px solid var(--border)"}}>
                💡 <strong>Tips:</strong> Gunakan Template untuk mengisi bulan ini sekaligus, lalu edit tanggal tertentu secara manual jika perlu.
              </div>
            </div>
          )}

          {/* ══ DAY EDITOR ══ */}
          {panel==="day" && selDate && (
            <div>
              {/* Day header */}
              <div style={{padding:"0.875rem 1.125rem",borderBottom:"1px solid var(--border)",
                display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:"0.6875rem",fontWeight:700,color:"var(--text-muted)",
                    textTransform:"uppercase",letterSpacing:"0.05em"}}>
                    {DAY_LONG[selDate.getDay()]}
                  </div>
                  <div style={{fontWeight:800,fontSize:"1rem",color:"var(--charcoal)",marginTop:"0.1rem"}}>
                    {selDate.getDate()} {MONTH_NAMES[selDate.getMonth()]} {selDate.getFullYear()}
                  </div>
                </div>
                <button onClick={closePanel}
                  style={{width:28,height:28,borderRadius:"7px",border:"1px solid var(--border)",
                    background:"var(--ivory)",cursor:"pointer",display:"flex",alignItems:"center",
                    justifyContent:"center",color:"var(--text-muted)"}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div style={{padding:"1.125rem",display:"flex",flexDirection:"column",gap:"1rem"}}>
                {/* Status */}
                <div>
                  <div style={{fontSize:"0.6875rem",fontWeight:700,textTransform:"uppercase",
                    letterSpacing:"0.05em",color:"var(--text-muted)",marginBottom:"0.5rem"}}>Status</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
                    {(["AVAILABLE","OFF"] as const).map(s=>(
                      <button key={s} onClick={()=>setDayStatus(s)}
                        style={{padding:"0.7rem",borderRadius:"10px",cursor:"pointer",
                          fontFamily:"inherit",fontSize:"0.875rem",fontWeight:700,
                          transition:"all 0.18s",display:"flex",alignItems:"center",
                          justifyContent:"center",gap:"0.5rem",
                          ...btnStyle(dayStatus===s, s==="OFF"?"#B91C1C":"#1B6B4A")}}>
                        {s==="AVAILABLE"
                          ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Tersedia</>
                          : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>Off</>
                        }
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time slots */}
                {dayStatus==="AVAILABLE" && (
                  <div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.5rem"}}>
                      <div style={{fontSize:"0.6875rem",fontWeight:700,textTransform:"uppercase",
                        letterSpacing:"0.05em",color:"var(--text-muted)"}}>
                        Jam Layanan
                        {daySlots.length>0&&<span style={{marginLeft:"0.4rem",background:"#1B6B4A",color:"white",
                          borderRadius:"99px",padding:"0.1rem 0.45rem",fontSize:"0.6rem",fontWeight:800}}>
                          {daySlots.length}
                        </span>}
                      </div>
                      <div style={{display:"flex",gap:"0.3rem"}}>
                        {PRESETS.map(p=>(
                          <button key={p.label} onClick={()=>setDaySlots(p.slots)} title={p.desc}
                            style={{fontSize:"0.6875rem",fontWeight:600,padding:"0.25rem 0.5rem",
                              borderRadius:"99px",border:"1px solid var(--border)",
                              background:"var(--ivory)",color:"var(--charcoal)",
                              cursor:"pointer",fontFamily:"inherit"}}>
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"4px",maxHeight:180,overflowY:"auto"}}>
                      {TIME_SLOTS.map(slot=>{
                        const on = daySlots.includes(slot);
                        return (
                          <button key={slot}
                            onClick={()=>setDaySlots(p=>on?p.filter((s:string)=>s!==slot):[...p,slot].sort())}
                            style={{padding:"0.45rem 0.2rem",borderRadius:"7px",fontFamily:"inherit",
                              border:`1.5px solid ${on?"#1B6B4A":"var(--border)"}`,
                              background:on?"#1B6B4A":"white",color:on?"white":"var(--charcoal)",
                              fontSize:"0.6875rem",fontWeight:600,cursor:"pointer",transition:"all 0.12s"}}>
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                    {daySlots.length===0&&(
                      <p style={{fontSize:"0.75rem",color:"var(--text-muted)",margin:"0.4rem 0 0",fontStyle:"italic"}}>
                        Belum ada jam — gunakan preset di atas.
                      </p>
                    )}
                  </div>
                )}

                <button onClick={saveDay} disabled={isPending}
                  style={{width:"100%",padding:"0.75rem",borderRadius:"10px",border:"none",
                    background:isPending?"#9CA3AF":"linear-gradient(135deg,#1B6B4A,#27AE60)",
                    color:"white",fontWeight:800,fontSize:"0.9rem",cursor:isPending?"not-allowed":"pointer",
                    fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",
                    boxShadow:isPending?"none":"0 4px 12px rgba(27,107,74,0.3)"}}>
                  {isPending
                    ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        style={{animation:"spin 1s linear infinite"}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Menyimpan...</>
                    : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Simpan Jadwal</>
                  }
                </button>

                <button onClick={openTemplate}
                  style={{background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:"inherit",
                    fontSize:"0.75rem",color:"var(--text-muted)",textAlign:"center",textDecoration:"underline"}}>
                  Mau atur banyak hari sekaligus? → Template
                </button>
              </div>
            </div>
          )}

          {/* ══ TEMPLATE WIZARD ══ */}
          {panel==="template" && (
            <div>
              {/* Wizard header */}
              <div style={{padding:"0.875rem 1.125rem",borderBottom:"1px solid var(--border)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.625rem"}}>
                  <div style={{fontWeight:800,fontSize:"0.9375rem",color:"var(--charcoal)"}}>⚡ Setup Cepat</div>
                  <button onClick={closePanel}
                    style={{width:26,height:26,borderRadius:"7px",border:"1px solid var(--border)",
                      background:"var(--ivory)",cursor:"pointer",display:"flex",alignItems:"center",
                      justifyContent:"center",color:"var(--text-muted)"}}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                {/* Step indicators */}
                <div style={{display:"flex",gap:"0.375rem",alignItems:"center"}}>
                  {[1,2,3].map(n=>(
                    <div key={n} style={{flex:1,display:"flex",alignItems:"center",gap:"0.3rem"}}>
                      <div style={{width:20,height:20,borderRadius:"50%",flexShrink:0,fontSize:"0.625rem",fontWeight:800,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        background:tplStep>=n?"#1B6B4A":"#E5E7EB",color:tplStep>=n?"white":"#9CA3AF"}}>
                        {tplStep>n
                          ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          : n}
                      </div>
                      <div style={{fontSize:"0.6875rem",fontWeight:tplStep===n?700:400,
                        color:tplStep>=n?"#1B6B4A":"#9CA3AF"}}>
                        {["Pola","Jam","Rentang"][n-1]}
                      </div>
                      {n<3&&<div style={{flex:1,height:2,borderRadius:99,background:tplStep>n?"#1B6B4A":"#E5E7EB"}}/>}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{padding:"1.125rem",display:"flex",flexDirection:"column",gap:"1rem"}}>

                {/* STEP 1 */}
                {tplStep===1 && (
                  <>
                    <div style={{fontSize:"0.8125rem",color:"var(--text-muted)"}}>
                      Pilih pola hari yang ingin ditandai <strong>tersedia</strong>:
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
                      {PATTERNS.map(opt=>{
                        const on = tplPat===opt.id;
                        return (
                          <button key={opt.id} onClick={()=>setTplPat(opt.id)}
                            style={{padding:"0.8rem 0.625rem",borderRadius:"11px",fontFamily:"inherit",
                              border:`2px solid ${on?"#1B6B4A":"var(--border)"}`,
                              background:on?"#EBF5EF":"var(--ivory)",cursor:"pointer",textAlign:"center",
                              transition:"all 0.18s"}}>
                            <div style={{fontSize:"1.25rem",marginBottom:"0.25rem"}}>{opt.emoji}</div>
                            <div style={{fontWeight:700,fontSize:"0.8125rem",color:on?"#1B6B4A":"var(--charcoal)"}}>{opt.label}</div>
                            <div style={{fontSize:"0.625rem",color:"var(--text-muted)",marginTop:"0.1rem"}}>{opt.sub}</div>
                          </button>
                        );
                      })}
                    </div>
                    {tplPat==="CUSTOM_DAYS"&&(
                      <div style={{display:"flex",gap:"0.375rem",justifyContent:"center",flexWrap:"wrap"}}>
                        {DAY_SHORT.map((d,i)=>{
                          const on=tplDays.includes(i);
                          return (
                            <button key={i}
                              onClick={()=>setTplDays(prev=>on?prev.filter((x:number)=>x!==i):[...prev,i].sort())}
                              style={{width:40,height:40,borderRadius:"9px",fontFamily:"inherit",
                                border:`2px solid ${on?"#1B6B4A":"var(--border)"}`,
                                background:on?"#1B6B4A":"white",color:on?"white":"var(--charcoal)",
                                fontWeight:700,fontSize:"0.8125rem",cursor:"pointer",transition:"all 0.15s"}}>
                              {d}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* STEP 2 */}
                {tplStep===2 && (
                  <>
                    <div style={{fontSize:"0.8125rem",color:"var(--text-muted)"}}>
                      Pilih jam layanan atau gunakan preset:
                    </div>
                    <div style={{display:"flex",gap:"0.375rem",flexWrap:"wrap"}}>
                      {PRESETS.map(p=>(
                        <button key={p.label} onClick={()=>setTplSlots(p.slots)} title={p.desc}
                          style={{fontSize:"0.75rem",fontWeight:600,padding:"0.3rem 0.625rem",
                            borderRadius:"99px",border:"1.5px solid var(--border)",
                            background:"var(--ivory)",color:"var(--charcoal)",
                            cursor:"pointer",fontFamily:"inherit"}}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor="#1B6B4A";e.currentTarget.style.color="#1B6B4A";}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--charcoal)";}}>
                          ⚡ {p.label}
                        </button>
                      ))}
                      {tplSlots.length>0&&<button onClick={()=>setTplSlots([])}
                        style={{fontSize:"0.75rem",fontWeight:600,padding:"0.3rem 0.625rem",
                          borderRadius:"99px",border:"1px solid #FCA5A5",background:"#FEF2F2",
                          color:"#B91C1C",cursor:"pointer",fontFamily:"inherit"}}>
                        Hapus
                      </button>}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"4px"}}>
                      {TIME_SLOTS.map(slot=>{
                        const on=tplSlots.includes(slot);
                        return (
                          <button key={slot}
                            onClick={()=>setTplSlots(p=>on?p.filter((s:string)=>s!==slot):[...p,slot].sort())}
                            style={{padding:"0.4rem 0.15rem",borderRadius:"7px",fontFamily:"inherit",
                              border:`1.5px solid ${on?"#1B6B4A":"var(--border)"}`,
                              background:on?"#1B6B4A":"white",color:on?"white":"var(--charcoal)",
                              fontSize:"0.6875rem",fontWeight:600,cursor:"pointer",transition:"all 0.12s"}}>
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                    {tplSlots.length>0&&(
                      <div style={{padding:"0.5rem 0.75rem",background:"#EBF5EF",borderRadius:"8px",
                        fontSize:"0.75rem",color:"#1B6B4A",fontWeight:600}}>
                        ✓ {tplSlots.length} slot: {tplSlots[0]} – {tplSlots[tplSlots.length-1]}
                      </div>
                    )}
                  </>
                )}

                {/* STEP 3 */}
                {tplStep===3 && (
                  <>
                    <div style={{fontSize:"0.8125rem",color:"var(--text-muted)"}}>
                      Berlaku untuk berapa lama ke depan?
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                      {([1,3,6] as const).map(m=>(
                        <button key={m} onClick={()=>setTplMonths(m)}
                          style={{padding:"0.75rem 1rem",borderRadius:"10px",fontFamily:"inherit",
                            border:`2px solid ${tplMonths===m?"#1B6B4A":"var(--border)"}`,
                            background:tplMonths===m?"#EBF5EF":"var(--ivory)",
                            cursor:"pointer",display:"flex",alignItems:"center",gap:"0.75rem",
                            textAlign:"left",transition:"all 0.18s"}}>
                          <div style={{width:34,height:34,borderRadius:"8px",flexShrink:0,
                            background:tplMonths===m?"#1B6B4A":"#E5E7EB",
                            display:"flex",alignItems:"center",justifyContent:"center",
                            fontSize:"0.625rem",fontWeight:800,color:tplMonths===m?"white":"#6B7280"}}>
                            {m===1?"1M":m===3?"3M":"6M"}
                          </div>
                          <div>
                            <div style={{fontWeight:700,fontSize:"0.875rem",color:tplMonths===m?"#1B6B4A":"var(--charcoal)"}}>
                              {m===1?"Bulan Ini":`${m} Bulan ke Depan`}
                            </div>
                            <div style={{fontSize:"0.6875rem",color:"var(--text-muted)",marginTop:"0.1rem"}}>
                              {m===1?"≈ 30 hari":m===3?"≈ 90 hari":"≈ 180 hari"}
                            </div>
                          </div>
                          {tplMonths===m&&<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1B6B4A" strokeWidth="2.5" style={{marginLeft:"auto"}}><polyline points="20 6 9 17 4 12"/></svg>}
                        </button>
                      ))}
                    </div>

                    <div style={{padding:"0.75rem",background:"var(--ivory-dark)",borderRadius:"9px",
                      border:"1px solid var(--border)",fontSize:"0.8rem",color:"var(--charcoal)",lineHeight:1.7}}>
                      <div style={{fontWeight:700,marginBottom:"0.2rem"}}>Ringkasan:</div>
                      <div>📌 {PATTERNS.find(p=>p.id===tplPat)?.label}</div>
                      <div>🕐 {tplSlots.length} slot ({tplSlots[0]} – {tplSlots[tplSlots.length-1]})</div>
                      <div>📆 {tplMonths===1?"Bulan ini":`${tplMonths} bulan ke depan`}</div>
                    </div>

                    {!tplConfirm ? (
                      <button onClick={()=>setTplConfirm(true)}
                        style={{width:"100%",padding:"0.8rem",borderRadius:"10px",border:"none",
                          background:"linear-gradient(135deg,#1B6B4A,#27AE60)",color:"white",
                          fontWeight:800,fontSize:"0.9rem",cursor:"pointer",fontFamily:"inherit",
                          boxShadow:"0 4px 12px rgba(27,107,74,0.3)"}}>
                        Terapkan Template →
                      </button>
                    ) : (
                      <div style={{background:"#FFF7ED",border:"1.5px solid #F59E0B",borderRadius:"10px",
                        padding:"0.875rem",display:"flex",flexDirection:"column",gap:"0.625rem"}}>
                        <div style={{fontSize:"0.8rem",color:"#92400E",fontWeight:600,lineHeight:1.6}}>
                          ⚠️ Akan <strong>menimpa jadwal yang ada</strong> pada hari yang cocok. Lanjutkan?
                        </div>
                        <div style={{display:"flex",gap:"0.5rem"}}>
                          <button onClick={()=>setTplConfirm(false)}
                            style={{flex:1,padding:"0.6rem",borderRadius:"8px",fontFamily:"inherit",
                              border:"1.5px solid var(--border)",background:"white",
                              color:"var(--charcoal)",fontWeight:600,fontSize:"0.875rem",cursor:"pointer"}}>
                            Batal
                          </button>
                          <button onClick={applyTemplate} disabled={isPending}
                            style={{flex:2,padding:"0.6rem",borderRadius:"8px",fontFamily:"inherit",
                              border:"none",background:isPending?"#9CA3AF":"#D97706",
                              color:"white",fontWeight:800,fontSize:"0.875rem",
                              cursor:isPending?"not-allowed":"pointer",
                              display:"flex",alignItems:"center",justifyContent:"center",gap:"0.375rem"}}>
                            {isPending
                              ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{animation:"spin 1s linear infinite"}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Menerapkan...</>
                              : "Ya, Terapkan"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Nav buttons */}
                <div style={{display:"flex",gap:"0.5rem",borderTop:"1px solid var(--border)",paddingTop:"0.875rem"}}>
                  {tplStep>1&&(
                    <button onClick={()=>{setTplStep(s=>s-1);setTplConfirm(false);}}
                      style={{flex:1,padding:"0.6rem",borderRadius:"9px",fontFamily:"inherit",
                        border:"1.5px solid var(--border)",background:"white",
                        color:"var(--charcoal)",fontWeight:600,fontSize:"0.875rem",cursor:"pointer"}}>
                      ← Kembali
                    </button>
                  )}
                  {tplStep<3&&(
                    <button onClick={()=>setTplStep(s=>s+1)}
                      disabled={(tplPat==="CUSTOM_DAYS"&&tplDays.length===0)||(tplStep===2&&tplSlots.length===0)}
                      style={{flex:2,padding:"0.6rem",borderRadius:"9px",fontFamily:"inherit",
                        border:"none",
                        background:((tplPat==="CUSTOM_DAYS"&&tplDays.length===0)||(tplStep===2&&tplSlots.length===0))?"#D1D5DB":"#1B6B4A",
                        color:"white",fontWeight:700,fontSize:"0.875rem",cursor:"pointer"}}>
                      Lanjut →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>{/* end panel body */}
      </div>{/* end right card */}

      {/* Toast */}
      {toast&&(
        <div style={{position:"fixed",bottom:"2rem",left:"50%",transform:"translateX(-50%)",
          zIndex:999,padding:"0.75rem 1.375rem",borderRadius:"11px",
          background:toast.ok?"#1B6B4A":"#B91C1C",color:"white",fontWeight:700,
          fontSize:"0.875rem",boxShadow:"0 8px 24px rgba(0,0,0,0.18)",
          display:"flex",alignItems:"center",gap:"0.5rem",whiteSpace:"nowrap",
          animation:"slideUp 0.28s cubic-bezier(0.4,0,0.2,1)"}}>
          {toast.ok
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateX(-50%) translateY(16px); opacity:0; } to { transform: translateX(-50%) translateY(0); opacity:1; } }
        
        /* ── Desktop: side-by-side ── */
        .avail-cal-root {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 1.25rem;
          align-items: start;
        }
        .avail-cal-left { order: 1; }
        .avail-cal-right { order: 2; }

        /* ── Mobile: stacked ── */
        @media (max-width: 640px) {
          .avail-cal-root {
            grid-template-columns: 1fr;
            gap: 0.875rem;
          }
          .avail-cal-left { order: 2; }
          .avail-cal-right { order: 1; }
        }
      `}</style>
    </div>
  );
}
