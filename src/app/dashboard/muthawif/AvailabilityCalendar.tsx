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

type Sheet = "none" | "day" | "template";

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
  { label:"Siang",   desc:"12:00–17:00", slots:["12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"] },
  { label:"Sore",    desc:"17:00–20:00", slots:["17:00","17:30","18:00","18:30","19:00","19:30","20:00"] },
  { label:"Full Day",desc:"07:00–20:00", slots:TIME_SLOTS },
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

  const [sheet, setSheet]       = useState<Sheet>("none");
  const [selDate, setSelDate]   = useState<Date|null>(null);

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

  // Month stats
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

  /* ── Navigation ── */
  const navPrev = () => {
    if (viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}
    else setViewMonth(m=>m-1);
    setSheet("none"); setSelDate(null);
  };
  const navNext = () => {
    if (viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}
    else setViewMonth(m=>m+1);
    setSheet("none"); setSelDate(null);
  };

  /* ── Handlers ── */
  const openDay = useCallback((dayNum:number) => {
    const d = new Date(viewYear, viewMonth, dayNum);
    if (isPast(d)) return;
    setSelDate(d);
    const rec = availMap.get(getKey(d));
    setDayStatus(rec?.status==="OFF" ? "OFF" : "AVAILABLE");
    setDaySlots(rec?.timeSlots ?? []);
    setSheet("day");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMonth, viewYear, availMap]);

  const closeSheet   = () => { setSheet("none"); setSelDate(null); };
  const openTemplate = () => { setTplStep(1); setTplConfirm(false); setSheet("template"); };

  const saveDay = () => {
    if (!selDate) return;
    startTrans(async () => {
      const res = await setDaySchedule(getKey(selDate), dayStatus, daySlots);
      showToast(res.success, res.message);
      if (res.success) closeSheet();
    });
  };

  const applyTemplate = () => {
    startTrans(async () => {
      const res = await applyScheduleTemplate(tplPat, tplDays, tplSlots, tplMonths);
      showToast(res.success, res.message);
      if (res.success) { closeSheet(); setTplConfirm(false); }
    });
  };

  /* ── Cell style ── */
  const cellStyle = (dayNum:number) => {
    const k   = getKey(new Date(viewYear,viewMonth,dayNum));
    const rec = availMap.get(k);
    const past = isPast(new Date(viewYear,viewMonth,dayNum));
    const isToday = k === todayKey;
    const isSel   = k === selKey;

    if (isSel)                return { dot: "#fff",        circleBg: "#1B6B4A", textColor: "#fff",      fw: 800, dotColor: "#fff",     ringColor: "#1B6B4A" };
    if (rec?.status==="OFF")  return { dot: "#C0392B",     circleBg: "#FEF2F2", textColor: "#C0392B",   fw: 600, dotColor: "#C0392B",  ringColor: "#FCA5A5" };
    if (rec?.status==="BOOKED")return { dot: "#B7881C",    circleBg: "rgba(196,151,59,0.12)", textColor: "#B7881C", fw: 600, dotColor: "#B7881C", ringColor: "#C4973B66" };
    if (rec?.timeSlots?.length)return { dot: "#1B6B4A",    circleBg: "#EBF5EF", textColor: "#1B6B4A",   fw: 700, dotColor: "#1B6B4A",  ringColor: "#A7D8BF" };
    if (isToday)               return { dot: "#1B6B4A",    circleBg: "#E8F5EE", textColor: "#1B6B4A",   fw: 800, dotColor: "#1B6B4A",  ringColor: "#1B6B4A" };
    if (past)                  return { dot: "transparent",circleBg: "transparent", textColor: "#C9CDD4", fw: 400, dotColor: "transparent", ringColor: "transparent" };
    return                            { dot: "transparent",circleBg: "transparent", textColor: "var(--charcoal)", fw: 500, dotColor: "transparent", ringColor: "transparent" };
  };

  const sheetOpen = sheet !== "none";

  /* ──────────────────────────── RENDER ─────────────────────────────────── */
  return (
    <div className="avail-root">

      {/* ══════════════ CALENDAR CARD ══════════════ */}
      <div className="avail-card">

        {/* Month header */}
        <div className="avail-month-bar">
          <button id="avail-prev-month" className="avail-nav-btn" onClick={navPrev} aria-label="Bulan sebelumnya">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div className="avail-month-title">
            <span className="avail-month-name">{MONTH_NAMES[viewMonth]}</span>
            <span className="avail-month-year">{viewYear}</span>
          </div>
          <button id="avail-next-month" className="avail-nav-btn" onClick={navNext} aria-label="Bulan berikutnya">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        {/* Stats pills */}
        <div className="avail-stats-row">
          <span className="avail-stat avail-stat-green">
            <span className="avail-stat-dot" style={{background:"#1B6B4A"}}/>
            <strong>{cntSched}</strong> Terjadwal
          </span>
          <span className="avail-stat avail-stat-gold">
            <span className="avail-stat-dot" style={{background:"#C4973B"}}/>
            <strong>{cntBooked}</strong> Terpesan
          </span>
          <span className="avail-stat avail-stat-red">
            <span className="avail-stat-dot" style={{background:"#C0392B"}}/>
            <strong>{cntOff}</strong> Off
          </span>
        </div>

        {/* Day headers */}
        <div className="avail-day-headers">
          {DAY_SHORT.map((d,i) => (
            <div key={d} className={`avail-day-label${i===0||i===6?" avail-day-label-weekend":""}`}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="avail-grid">
          {cells.map((day,i) => {
            if (!day) return <div key={i} />;
            const past = isPast(new Date(viewYear,viewMonth,day));
            const c    = cellStyle(day);
            const rec  = availMap.get(getKey(new Date(viewYear,viewMonth,day)));
            const hasSlots = rec && rec.timeSlots.length > 0 && rec.status !== "OFF";
            const isSel = getKey(new Date(viewYear,viewMonth,day)) === selKey;
            return (
              <button
                key={i}
                id={`avail-day-${day}`}
                onClick={() => openDay(day)}
                disabled={past}
                className={`avail-cell${isSel ? " avail-cell-selected" : ""}`}
                style={{
                  background: c.circleBg,
                  color: c.textColor,
                  fontWeight: c.fw,
                  outline: getKey(new Date(viewYear,viewMonth,day)) === todayKey && !isSel ? "2px solid #1B6B4A" : "none",
                  outlineOffset: -2,
                  opacity: past ? 0.3 : 1,
                  cursor: past ? "default" : "pointer",
                }}
              >
                <span className="avail-cell-num">{day}</span>
                {hasSlots && <span className="avail-cell-dot" style={{background: c.dotColor}} />}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="avail-legend">
          {[
            {bg:"#EBF5EF",  br:"#A7D8BF",  label:"Tersedia"},
            {bg:"rgba(196,151,59,0.12)", br:"#C4973B66", label:"Terpesan"},
            {bg:"#FEF2F2",  br:"#FCA5A5",  label:"Off"},
          ].map(l=>(
            <div key={l.label} className="avail-legend-item">
              <span className="avail-legend-dot" style={{background:l.bg,border:`1.5px solid ${l.br}`}}/>
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Setup Cepat button — visible on desktop (col 2 row 1) and mobile (below calendar) */}
      <button id="avail-setup-cepat" className="avail-template-btn" onClick={openTemplate}>
        <span className="avail-template-btn-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        </span>
        <div className="avail-template-btn-text">
          <strong>Setup Cepat</strong>
          <span>Isi jadwal bulan ini sekaligus</span>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
      </button>

      {/* ══════════════ DESKTOP INLINE PANEL ══════════════ */}
      {/* Shown only on ≥641px when a date or template is open */}
      <div className={`avail-desktop-panel${sheetOpen ? " is-open" : ""}`}>
        {sheet === "day" && selDate && (
          <div className="avail-desktop-panel-inner">
            {/* Header */}
            <div className="avail-desktop-ph">
              <div>
                <div className="avail-sheet-header-sub">{DAY_LONG[selDate.getDay()]}</div>
                <div className="avail-sheet-header-title">{selDate.getDate()} {MONTH_NAMES[selDate.getMonth()]} {selDate.getFullYear()}</div>
              </div>
              <button id="avail-desktop-day-close" className="avail-sheet-close" onClick={closeSheet}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="avail-desktop-pb">
              <div className="avail-section-label">Status Hari</div>
              <div className="avail-status-row">
                {(["AVAILABLE","OFF"] as const).map(s => (
                  <button key={s} onClick={() => setDayStatus(s)} className={`avail-status-btn${dayStatus===s ? " is-active-"+(s==="OFF"?"red":"green") : ""}`}>
                    {s==="AVAILABLE" ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Tersedia</> : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>Hari Off</>}
                  </button>
                ))}
              </div>
              {dayStatus === "AVAILABLE" && (
                <>
                  <div className="avail-section-label" style={{marginTop:"1rem"}}>
                    Jam Layanan{daySlots.length > 0 && <span className="avail-badge">{daySlots.length} slot</span>}
                  </div>
                  <div className="avail-preset-row">
                    {PRESETS.map(p => <button key={p.label} className="avail-preset-chip" onClick={() => setDaySlots(p.slots)} title={p.desc}>{p.label}</button>)}
                    {daySlots.length > 0 && <button className="avail-preset-chip avail-preset-clear" onClick={() => setDaySlots([])}>Hapus</button>}
                  </div>
                  <div className="avail-time-grid">
                    {TIME_SLOTS.map(slot => {
                      const on = daySlots.includes(slot);
                      return <button key={slot} onClick={() => setDaySlots(p => on ? p.filter((s:string)=>s!==slot) : [...p,slot].sort())} className={`avail-time-slot${on?" is-active":""}`}>{slot}</button>;
                    })}
                  </div>
                  {daySlots.length > 0 && <div className="avail-slots-summary"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>{daySlots.length} slot &bull; {daySlots[0]} – {daySlots[daySlots.length-1]}</div>}
                </>
              )}
            </div>
            <div className="avail-desktop-pf">
              <button className="avail-btn-primary" onClick={saveDay} disabled={isPending||(dayStatus==="AVAILABLE"&&daySlots.length===0)}>
                {isPending ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Menyimpan...</> : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Simpan Jadwal</>}
              </button>
              <button className="avail-btn-ghost" onClick={openTemplate}>Atur banyak hari sekaligus →</button>
            </div>
          </div>
        )}

        {sheet === "template" && (
          <div className="avail-desktop-panel-inner">
            <div className="avail-desktop-ph">
              <div>
                <div className="avail-sheet-header-sub">Setup Jadwal</div>
                <div className="avail-sheet-header-title">Setup Cepat</div>
              </div>
              <button id="avail-desktop-tpl-close" className="avail-sheet-close" onClick={closeSheet}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="avail-step-bar">
              {[{n:1,label:"Pola"},{n:2,label:"Jam"},{n:3,label:"Rentang"}].map(({n,label},i) => (
                <div key={n} className="avail-step-item">
                  <div className={`avail-step-circle${tplStep>=n?" is-done":""}`}>{tplStep>n?<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>:n}</div>
                  <span className={`avail-step-label${tplStep>=n?" is-active":""}`}>{label}</span>
                  {i<2&&<div className={`avail-step-line${tplStep>n?" is-done":""}`}/>}
                </div>
              ))}
            </div>
            <div className="avail-desktop-pb">
              {tplStep===1&&(<>
                <div className="avail-section-label">Pilih pola hari</div>
                <div className="avail-pattern-grid">{PATTERNS.map(opt=>{const on=tplPat===opt.id;return(<button key={opt.id} onClick={()=>setTplPat(opt.id)} className={`avail-pattern-card${on?" is-active":""}`}><span className="avail-pattern-emoji">{opt.emoji}</span><strong>{opt.label}</strong><span className="avail-pattern-sub">{opt.sub}</span></button>);})}</div>
                {tplPat==="CUSTOM_DAYS"&&(<><div className="avail-section-label" style={{marginTop:"0.75rem"}}>Pilih hari</div><div className="avail-day-picker">{DAY_SHORT.map((d,i)=>{const on=tplDays.includes(i);return(<button key={i} onClick={()=>setTplDays(prev=>on?prev.filter((x:number)=>x!==i):[...prev,i].sort())} className={`avail-day-pill${on?" is-active":""}`}>{d}</button>);})}</div></>)}
              </>)}
              {tplStep===2&&(<>
                <div className="avail-section-label">Jam layanan{tplSlots.length>0&&<span className="avail-badge">{tplSlots.length}</span>}</div>
                <div className="avail-preset-row">{PRESETS.map(p=><button key={p.label} className="avail-preset-chip" onClick={()=>setTplSlots(p.slots)}>{p.label}</button>)}{tplSlots.length>0&&<button className="avail-preset-chip avail-preset-clear" onClick={()=>setTplSlots([])}>Hapus</button>}</div>
                <div className="avail-time-grid">{TIME_SLOTS.map(slot=>{const on=tplSlots.includes(slot);return<button key={slot} onClick={()=>setTplSlots(p=>on?p.filter((s:string)=>s!==slot):[...p,slot].sort())} className={`avail-time-slot${on?" is-active":""}`}>{slot}</button>;})}</div>
                {tplSlots.length>0&&<div className="avail-slots-summary"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>{tplSlots.length} slot &bull; {tplSlots[0]} – {tplSlots[tplSlots.length-1]}</div>}
              </>)}
              {tplStep===3&&(<>
                <div className="avail-section-label">Durasi</div>
                <div className="avail-duration-grid">{[1,2,3,6].map(m=><button key={m} onClick={()=>setTplMonths(m)} className={`avail-duration-card${tplMonths===m?" is-active":""}`}><strong>{m}</strong><span>bulan</span></button>)}</div>
                {!tplConfirm&&<div className="avail-summary-box"><div className="avail-summary-title">Ringkasan</div><div className="avail-summary-row"><span>Pola</span><strong>{PATTERNS.find(p=>p.id===tplPat)?.label}</strong></div><div className="avail-summary-row"><span>Slot</span><strong>{tplSlots.length} jam</strong></div><div className="avail-summary-row"><span>Durasi</span><strong>{tplMonths} bulan</strong></div></div>}
                {tplConfirm&&<div className="avail-confirm-box"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><div><strong>Ini akan menimpa jadwal yang sudah ada.</strong><p>Booking aktif tidak terpengaruh.</p></div></div>}
              </>)}
            </div>
            <div className="avail-desktop-pf">
              <div className="avail-footer-row">
                {tplStep>1&&<button className="avail-btn-secondary" onClick={()=>{setTplStep(s=>s-1);setTplConfirm(false);}}>← Kembali</button>}
                {tplStep<3&&<button className="avail-btn-primary" disabled={(tplPat==="CUSTOM_DAYS"&&tplDays.length===0)||(tplStep===2&&tplSlots.length===0)} onClick={()=>setTplStep(s=>s+1)}>Lanjut →</button>}
                {tplStep===3&&!tplConfirm&&<button className="avail-btn-primary" onClick={()=>setTplConfirm(true)}>Tinjau & Terapkan</button>}
                {tplStep===3&&tplConfirm&&<><button className="avail-btn-secondary" onClick={()=>setTplConfirm(false)}>Batal</button><button className="avail-btn-primary avail-btn-gold" onClick={applyTemplate} disabled={isPending}>{isPending?"Menerapkan...":"Ya, Terapkan"}</button></>}
              </div>
            </div>
          </div>
        )}

        {sheet === "none" && (
          <div className="avail-desktop-empty">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1B6B4A" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>
            <strong>Pilih tanggal</strong>
            <span>Ketuk tanggal di kalender untuk mengatur jam & status ketersediaan</span>
          </div>
        )}
      </div>

      {/* ══════════════ BOTTOM SHEET BACKDROP ══════════════ */}
      <div
        className={`avail-backdrop${sheetOpen ? " is-open" : ""}`}
        onClick={closeSheet}
        aria-hidden="true"
      />

      {/* ══════════════ DAY EDITOR SHEET ══════════════ */}
      <div
        className={`avail-sheet${sheet === "day" ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Atur hari"
      >
        <div className="avail-sheet-handle" />

        {/* Header */}
        <div className="avail-sheet-header">
          <div>
            {selDate && (
              <>
                <div className="avail-sheet-header-sub">{DAY_LONG[selDate.getDay()]}</div>
                <div className="avail-sheet-header-title">
                  {selDate.getDate()} {MONTH_NAMES[selDate.getMonth()]} {selDate.getFullYear()}
                </div>
              </>
            )}
          </div>
          <button id="avail-day-sheet-close" className="avail-sheet-close" onClick={closeSheet} aria-label="Tutup">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="avail-sheet-body">
          {/* Status toggle */}
          <div className="avail-section-label">Status Hari</div>
          <div className="avail-status-row">
            {(["AVAILABLE","OFF"] as const).map(s => {
              const isActive = dayStatus === s;
              return (
                <button
                  key={s}
                  id={`avail-status-${s.toLowerCase()}`}
                  onClick={() => setDayStatus(s)}
                  className={`avail-status-btn${isActive ? " is-active-" + (s === "OFF" ? "red" : "green") : ""}`}
                >
                  {s === "AVAILABLE"
                    ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Tersedia</>
                    : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>Hari Off</>
                  }
                </button>
              );
            })}
          </div>

          {/* Time slots — only when Available */}
          {dayStatus === "AVAILABLE" && (
            <>
              <div className="avail-section-label" style={{marginTop:"1rem"}}>
                Jam Layanan
                {daySlots.length > 0 && (
                  <span className="avail-badge">{daySlots.length} slot</span>
                )}
              </div>

              {/* Preset chips */}
              <div className="avail-preset-row">
                {PRESETS.map(p => (
                  <button
                    key={p.label}
                    id={`avail-preset-${p.label.toLowerCase()}`}
                    className="avail-preset-chip"
                    onClick={() => setDaySlots(p.slots)}
                    title={p.desc}
                  >
                    {p.label}
                  </button>
                ))}
                {daySlots.length > 0 && (
                  <button className="avail-preset-chip avail-preset-clear" onClick={() => setDaySlots([])}>
                    Hapus
                  </button>
                )}
              </div>

              {/* Time grid */}
              <div className="avail-time-grid">
                {TIME_SLOTS.map(slot => {
                  const on = daySlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      id={`avail-slot-${slot.replace(":","-")}`}
                      onClick={() => setDaySlots(p => on ? p.filter((s:string) => s!==slot) : [...p,slot].sort())}
                      className={`avail-time-slot${on ? " is-active" : ""}`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>

              {daySlots.length === 0 && (
                <p className="avail-hint">Pilih preset atau ketuk jam di atas untuk menambah slot.</p>
              )}

              {daySlots.length > 0 && (
                <div className="avail-slots-summary">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {daySlots.length} slot dipilih &bull; {daySlots[0]} – {daySlots[daySlots.length-1]}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="avail-sheet-footer">
          <button
            id="avail-day-save"
            className="avail-btn-primary"
            onClick={saveDay}
            disabled={isPending || (dayStatus === "AVAILABLE" && daySlots.length === 0)}
          >
            {isPending
              ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Menyimpan...</>
              : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Simpan Jadwal</>
            }
          </button>
          <button className="avail-btn-ghost" onClick={openTemplate}>
            Atur banyak hari sekaligus →
          </button>
        </div>
      </div>

      {/* ══════════════ TEMPLATE WIZARD SHEET ══════════════ */}
      <div
        className={`avail-sheet avail-sheet-tall${sheet === "template" ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Setup cepat jadwal"
      >
        <div className="avail-sheet-handle" />

        {/* Wizard Header */}
        <div className="avail-sheet-header">
          <div>
            <div className="avail-sheet-header-sub">Setup Jadwal</div>
            <div className="avail-sheet-header-title">Setup Cepat</div>
          </div>
          <button id="avail-template-close" className="avail-sheet-close" onClick={closeSheet} aria-label="Tutup">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Step bar */}
        <div className="avail-step-bar">
          {[{n:1,label:"Pola"},{n:2,label:"Jam"},{n:3,label:"Rentang"}].map(({n,label},i) => (
            <div key={n} className="avail-step-item">
              <div className={`avail-step-circle${tplStep >= n ? " is-done" : ""}`}>
                {tplStep > n
                  ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  : n
                }
              </div>
              <span className={`avail-step-label${tplStep >= n ? " is-active" : ""}`}>{label}</span>
              {i < 2 && <div className={`avail-step-line${tplStep > n ? " is-done" : ""}`} />}
            </div>
          ))}
        </div>

        <div className="avail-sheet-body">

          {/* STEP 1: Pattern */}
          {tplStep === 1 && (
            <>
              <div className="avail-section-label">Pilih pola hari yang ingin ditandai <strong>tersedia</strong></div>
              <div className="avail-pattern-grid">
                {PATTERNS.map(opt => {
                  const on = tplPat === opt.id;
                  return (
                    <button
                      key={opt.id}
                      id={`avail-pattern-${opt.id.toLowerCase()}`}
                      onClick={() => setTplPat(opt.id)}
                      className={`avail-pattern-card${on ? " is-active" : ""}`}
                    >
                      <span className="avail-pattern-emoji">{opt.emoji}</span>
                      <strong>{opt.label}</strong>
                      <span className="avail-pattern-sub">{opt.sub}</span>
                    </button>
                  );
                })}
              </div>

              {tplPat === "CUSTOM_DAYS" && (
                <>
                  <div className="avail-section-label" style={{marginTop:"1rem"}}>Pilih hari</div>
                  <div className="avail-day-picker">
                    {DAY_SHORT.map((d,i) => {
                      const on = tplDays.includes(i);
                      return (
                        <button
                          key={i}
                          id={`avail-custom-day-${i}`}
                          onClick={() => setTplDays(prev => on ? prev.filter((x:number) => x!==i) : [...prev,i].sort())}
                          className={`avail-day-pill${on ? " is-active" : ""}`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {/* STEP 2: Time slots */}
          {tplStep === 2 && (
            <>
              <div className="avail-section-label">
                Pilih jam layanan
                {tplSlots.length > 0 && <span className="avail-badge">{tplSlots.length} slot</span>}
              </div>
              <div className="avail-preset-row">
                {PRESETS.map(p => (
                  <button key={p.label} className="avail-preset-chip" onClick={() => setTplSlots(p.slots)} title={p.desc}>
                    {p.label}
                  </button>
                ))}
                {tplSlots.length > 0 && (
                  <button className="avail-preset-chip avail-preset-clear" onClick={() => setTplSlots([])}>Hapus</button>
                )}
              </div>
              <div className="avail-time-grid">
                {TIME_SLOTS.map(slot => {
                  const on = tplSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      onClick={() => setTplSlots(p => on ? p.filter((s:string) => s!==slot) : [...p,slot].sort())}
                      className={`avail-time-slot${on ? " is-active" : ""}`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
              {tplSlots.length > 0 && (
                <div className="avail-slots-summary">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {tplSlots.length} slot &bull; {tplSlots[0]} – {tplSlots[tplSlots.length-1]}
                </div>
              )}
            </>
          )}

          {/* STEP 3: Duration */}
          {tplStep === 3 && (
            <>
              <div className="avail-section-label">Berlaku berapa bulan ke depan?</div>
              <div className="avail-duration-grid">
                {[1,2,3,6].map(m => (
                  <button
                    key={m}
                    id={`avail-duration-${m}`}
                    onClick={() => setTplMonths(m)}
                    className={`avail-duration-card${tplMonths === m ? " is-active" : ""}`}
                  >
                    <strong>{m}</strong>
                    <span>bulan</span>
                  </button>
                ))}
              </div>

              {/* Summary */}
              {!tplConfirm && (
                <div className="avail-summary-box">
                  <div className="avail-summary-title">Ringkasan</div>
                  <div className="avail-summary-row">
                    <span>Pola</span>
                    <strong>{PATTERNS.find(p=>p.id===tplPat)?.label}</strong>
                  </div>
                  {tplPat === "CUSTOM_DAYS" && (
                    <div className="avail-summary-row">
                      <span>Hari</span>
                      <strong>{tplDays.map(i=>DAY_SHORT[i]).join(", ")}</strong>
                    </div>
                  )}
                  <div className="avail-summary-row">
                    <span>Slot jam</span>
                    <strong>{tplSlots.length} slot ({tplSlots[0] ?? "-"} – {tplSlots[tplSlots.length-1] ?? "-"})</strong>
                  </div>
                  <div className="avail-summary-row">
                    <span>Durasi</span>
                    <strong>{tplMonths} bulan ke depan</strong>
                  </div>
                </div>
              )}

              {tplConfirm && (
                <div className="avail-confirm-box">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <div>
                    <strong>Ini akan menimpa jadwal yang sudah ada.</strong>
                    <p>Jadwal yang sudah terpesan (BOOKED) tidak akan berubah.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="avail-sheet-footer">
          <div className="avail-footer-row">
            {tplStep > 1 && (
              <button
                id="avail-tpl-back"
                className="avail-btn-secondary"
                onClick={() => { setTplStep(s => s-1); setTplConfirm(false); }}
              >
                ← Kembali
              </button>
            )}
            {tplStep < 3 && (
              <button
                id="avail-tpl-next"
                className="avail-btn-primary"
                disabled={(tplPat==="CUSTOM_DAYS"&&tplDays.length===0)||(tplStep===2&&tplSlots.length===0)}
                onClick={() => setTplStep(s => s+1)}
              >
                Lanjut →
              </button>
            )}
            {tplStep === 3 && !tplConfirm && (
              <button
                id="avail-tpl-confirm"
                className="avail-btn-primary"
                onClick={() => setTplConfirm(true)}
              >
                Tinjau & Terapkan
              </button>
            )}
            {tplStep === 3 && tplConfirm && (
              <>
                <button className="avail-btn-secondary" onClick={() => setTplConfirm(false)}>Batal</button>
                <button
                  id="avail-tpl-apply"
                  className="avail-btn-primary avail-btn-gold"
                  onClick={applyTemplate}
                  disabled={isPending}
                >
                  {isPending
                    ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Menerapkan...</>
                    : "Ya, Terapkan Sekarang"
                  }
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`avail-toast${toast.ok ? " ok" : " err"}`}>
          {toast.ok
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          }
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(24px); opacity:0; } to { transform: translateY(0); opacity:1; } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes sheetIn { from { transform: translateY(100%); } to { transform: translateY(0); } }

        .spin { animation: spin 1s linear infinite; }

        /* ─── ROOT ─── */
        .avail-root {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 1.25rem;
          align-items: start;
        }

        /* ─── CARD ─── */
        .avail-card {
          background: white;
          border-radius: 20px;
          border: 1px solid var(--border);
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(0,0,0,0.06);
        }

        /* ─── Month Bar ─── */
        .avail-month-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.125rem 0.875rem;
          background: linear-gradient(135deg, #1B6B4A, #27956A);
        }
        .avail-nav-btn {
          width: 36px; height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.18);
          color: white;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
          touch-action: manipulation;
        }
        .avail-nav-btn:hover { background: rgba(255,255,255,0.28); }
        .avail-month-title { text-align: center; }
        .avail-month-name { display: block; font-size: 1.0625rem; font-weight: 800; color: white; letter-spacing: -0.01em; line-height: 1.2; }
        .avail-month-year { display: block; font-size: 0.75rem; color: rgba(255,255,255,0.65); font-weight: 600; }

        /* ─── Stats Row ─── */
        .avail-stats-row {
          display: flex;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          background: rgba(27,107,74,0.04);
          border-bottom: 1px solid var(--border);
          flex-wrap: wrap;
        }
        .avail-stat {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.6rem;
          border-radius: 99px;
        }
        .avail-stat-green { background: #EBF5EF; color: #1B6B4A; }
        .avail-stat-gold  { background: rgba(196,151,59,0.1); color: #B7881C; }
        .avail-stat-red   { background: #FEF2F2; color: #C0392B; }
        .avail-stat-dot   { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        /* ─── Day Headers ─── */
        .avail-day-headers {
          display: grid;
          grid-template-columns: repeat(7,1fr);
          padding: 0.625rem 0.75rem 0.25rem;
          gap: 2px;
        }
        .avail-day-label {
          text-align: center;
          font-size: 0.6875rem;
          font-weight: 700;
          color: var(--text-muted);
          padding: 0.2rem 0;
        }
        .avail-day-label-weekend { color: #C0392B; opacity: 0.7; }

        /* ─── Grid ─── */
        .avail-grid {
          display: grid;
          grid-template-columns: repeat(7,1fr);
          padding: 0.25rem 0.75rem 0.75rem;
          gap: 4px;
        }
        .avail-cell {
          aspect-ratio: 1;
          border-radius: 50%;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          font-family: inherit;
          transition: transform 0.12s, opacity 0.12s;
        }
        .avail-cell:not(:disabled):hover { transform: scale(1.12); }
        .avail-cell:not(:disabled):active { transform: scale(0.96); }
        .avail-cell-selected {
          box-shadow: 0 3px 12px rgba(27,107,74,0.35);
        }
        .avail-cell-num { font-size: 0.8125rem; line-height: 1; }
        .avail-cell-dot { width: 4px; height: 4px; border-radius: 50%; }

        /* ─── Legend ─── */
        .avail-legend {
          border-top: 1px solid var(--border);
          padding: 0.5rem 1rem;
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .avail-legend-item {
          display: flex; align-items: center; gap: 0.35rem;
          font-size: 0.6875rem; color: var(--text-muted); font-weight: 500;
        }
        .avail-legend-dot {
          width: 10px; height: 10px; border-radius: 3px;
          display: inline-block; flex-shrink: 0;
        }

        /* ─── Template button (desktop right panel) ─── */
        .avail-template-btn {
          display: none;
        }

        /* ─── Backdrop ─── */
        .avail-backdrop {
          display: none;
          position: fixed; inset: 0;
          background: rgba(5,15,10,0.5);
          z-index: 280;
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
        }
        .avail-backdrop.is-open {
          display: block;
          animation: fadeIn 0.22s ease;
        }

        /* ─── Bottom Sheet (base — hidden on desktop) ─── */
        .avail-sheet {
          display: none;
        }

        /* ─── Section label ─── */
        .avail-section-label {
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          margin-bottom: 0.625rem;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .avail-badge {
          background: #1B6B4A; color: white;
          font-size: 0.6rem; font-weight: 800;
          border-radius: 99px; padding: 0.1rem 0.45rem;
          text-transform: none; letter-spacing: 0;
        }

        /* ─── Status row ─── */
        .avail-status-row {
          display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;
        }
        .avail-status-btn {
          padding: 0.75rem; border-radius: 12px;
          border: 2px solid var(--border); background: white;
          color: var(--charcoal); font-family: inherit;
          font-size: 0.9rem; font-weight: 700;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; gap: 0.5rem;
          transition: all 0.18s; touch-action: manipulation;
        }
        .avail-status-btn.is-active-green { border-color: #1B6B4A; background: #EBF5EF; color: #1B6B4A; }
        .avail-status-btn.is-active-red   { border-color: #C0392B; background: #FEF2F2; color: #C0392B; }

        /* ─── Preset chips ─── */
        .avail-preset-row {
          display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.625rem;
        }
        .avail-preset-chip {
          font-size: 0.75rem; font-weight: 600;
          padding: 0.3rem 0.75rem; border-radius: 99px;
          border: 1.5px solid var(--border); background: var(--ivory);
          color: var(--charcoal); cursor: pointer; font-family: inherit;
          transition: all 0.15s; touch-action: manipulation;
        }
        .avail-preset-chip:hover { border-color: #1B6B4A; color: #1B6B4A; }
        .avail-preset-clear { border-color: #FCA5A5; background: #FEF2F2; color: #C0392B; }

        /* ─── Time grid ─── */
        .avail-time-grid {
          display: grid; grid-template-columns: repeat(5,1fr); gap: 5px;
          margin-bottom: 0.75rem;
        }
        .avail-time-slot {
          padding: 0.45rem 0.2rem; border-radius: 8px;
          border: 1.5px solid var(--border); background: white;
          color: var(--charcoal); font-size: 0.6875rem;
          font-weight: 600; cursor: pointer; font-family: inherit;
          transition: all 0.12s; touch-action: manipulation;
          text-align: center;
        }
        .avail-time-slot.is-active { border-color: #1B6B4A; background: #1B6B4A; color: white; }

        /* ─── Misc ─── */
        .avail-hint { font-size: 0.75rem; color: var(--text-muted); font-style: italic; margin: 0; }
        .avail-slots-summary {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.5rem 0.75rem; background: #EBF5EF;
          border-radius: 9px; font-size: 0.75rem; color: #1B6B4A; font-weight: 600;
        }

        /* ─── Pattern Grid ─── */
        .avail-pattern-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;
          margin-bottom: 0.25rem;
        }
        .avail-pattern-card {
          padding: 0.875rem 0.625rem; border-radius: 12px;
          border: 2px solid var(--border); background: var(--ivory);
          cursor: pointer; text-align: center; font-family: inherit;
          transition: all 0.18s; display: flex; flex-direction: column;
          align-items: center; gap: 0.2rem; touch-action: manipulation;
        }
        .avail-pattern-card.is-active { border-color: #1B6B4A; background: #EBF5EF; }
        .avail-pattern-emoji { font-size: 1.375rem; }
        .avail-pattern-card strong { font-size: 0.875rem; color: var(--charcoal); }
        .avail-pattern-card.is-active strong { color: #1B6B4A; }
        .avail-pattern-sub { font-size: 0.625rem; color: var(--text-muted); }

        /* ─── Day picker ─── */
        .avail-day-picker { display: flex; gap: 0.375rem; flex-wrap: wrap; }
        .avail-day-pill {
          width: 42px; height: 42px; border-radius: 10px;
          border: 2px solid var(--border); background: white;
          color: var(--charcoal); font-weight: 700; font-size: 0.8125rem;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
          touch-action: manipulation;
        }
        .avail-day-pill.is-active { border-color: #1B6B4A; background: #1B6B4A; color: white; }

        /* ─── Duration grid ─── */
        .avail-duration-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 0.5rem; margin-bottom: 1rem; }
        .avail-duration-card {
          padding: 0.875rem 0.25rem; border-radius: 12px;
          border: 2px solid var(--border); background: var(--ivory);
          cursor: pointer; font-family: inherit; text-align: center;
          display: flex; flex-direction: column; gap: 0.1rem;
          transition: all 0.18s; touch-action: manipulation;
        }
        .avail-duration-card strong { font-size: 1.375rem; font-weight: 900; color: var(--charcoal); }
        .avail-duration-card span { font-size: 0.625rem; font-weight: 600; color: var(--text-muted); }
        .avail-duration-card.is-active { border-color: #1B6B4A; background: #EBF5EF; }
        .avail-duration-card.is-active strong { color: #1B6B4A; }

        /* ─── Summary / Confirm ─── */
        .avail-summary-box {
          background: var(--ivory); border: 1px solid var(--border);
          border-radius: 12px; padding: 0.875rem 1rem;
          display: flex; flex-direction: column; gap: 0.5rem;
        }
        .avail-summary-title { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
        .avail-summary-row { display: flex; justify-content: space-between; font-size: 0.8125rem; }
        .avail-summary-row span { color: var(--text-muted); }
        .avail-summary-row strong { color: var(--charcoal); }
        .avail-confirm-box {
          display: flex; gap: 0.75rem; padding: 0.875rem;
          background: #FFFBEB; border: 1px solid #FDE68A;
          border-radius: 12px; font-size: 0.8125rem;
          align-items: flex-start;
        }
        .avail-confirm-box strong { display: block; color: #92400E; font-size: 0.875rem; margin-bottom: 0.2rem; }
        .avail-confirm-box p { margin: 0; color: #B45309; }

        /* ─── Step bar ─── */
        .avail-step-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 1.25rem 0.875rem; gap: 0.25rem;
        }
        .avail-step-item {
          display: flex; align-items: center; gap: 0.375rem;
        }
        .avail-step-item:not(:last-child) {
          flex: 1;
        }
        .avail-step-circle {
          width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: #E5E7EB; color: #9CA3AF;
          font-size: 0.625rem; font-weight: 800;
        }
        .avail-step-circle.is-done { background: #1B6B4A; color: white; }
        .avail-step-label { font-size: 0.6875rem; font-weight: 600; color: #9CA3AF; }
        .avail-step-label.is-active { color: #1B6B4A; font-weight: 700; }
        .avail-step-line { flex: 1; height: 2px; border-radius: 99px; background: #E5E7EB; }
        .avail-step-line.is-done { background: #1B6B4A; }

        /* ─── Buttons ─── */
        .avail-btn-primary {
          flex: 1; padding: 0.8rem; border-radius: 12px; border: none;
          background: linear-gradient(135deg, #1B6B4A, #27956A);
          color: white; font-weight: 800; font-size: 0.9375rem;
          cursor: pointer; font-family: inherit;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          box-shadow: 0 4px 14px rgba(27,107,74,0.3);
          transition: opacity 0.2s; touch-action: manipulation;
        }
        .avail-btn-primary:disabled { background: #D1D5DB; box-shadow: none; cursor: not-allowed; }
        .avail-btn-gold { background: linear-gradient(135deg, #C4973B, #D97706) !important; box-shadow: 0 4px 14px rgba(196,151,59,0.3) !important; }
        .avail-btn-secondary {
          flex: 1; padding: 0.8rem; border-radius: 12px;
          border: 1.5px solid var(--border); background: white;
          color: var(--charcoal); font-weight: 700; font-size: 0.9rem;
          cursor: pointer; font-family: inherit; touch-action: manipulation;
        }
        .avail-btn-ghost {
          background: none; border: none; cursor: pointer; font-family: inherit;
          font-size: 0.8125rem; color: var(--text-muted);
          text-align: center; width: 100%; padding: 0.25rem 0;
          touch-action: manipulation;
        }
        .avail-footer-row { display: flex; gap: 0.5rem; }

        /* ─── Toast ─── */
        .avail-toast {
          position: fixed; bottom: 5.5rem; left: 50%; transform: translateX(-50%);
          z-index: 9999; padding: 0.75rem 1.375rem;
          border-radius: 12px; color: white; font-weight: 700;
          font-size: 0.875rem; box-shadow: 0 8px 24px rgba(0,0,0,0.18);
          display: flex; align-items: center; gap: 0.5rem;
          white-space: nowrap; animation: slideUp 0.28s cubic-bezier(0.4,0,0.2,1);
        }
        .avail-toast.ok { background: #1B6B4A; }
        .avail-toast.err { background: #B91C1C; }

        /* ─── Desktop Base Hides ─── */
        .avail-desktop-panel { display: none; }

        /* ══════════════════════════════════════════════
           DESKTOP SIDE PANEL (inside avail-root grid)
           ══════════════════════════════════════════════ */
        @media (min-width: 641px) {
          .avail-template-btn {
            display: flex; grid-column: 2; grid-row: 1;
            align-items: center; gap: 0.75rem;
            padding: 0.875rem 1rem;
            border-radius: 14px; border: 2px solid #1B6B4A;
            background: #1B6B4A; color: white;
            cursor: pointer; font-family: inherit; text-align: left;
            box-shadow: 0 4px 14px rgba(27,107,74,0.3);
            transition: background 0.2s;
          }
          .avail-template-btn:hover { background: #165a3e; }
          .avail-template-btn-icon {
            width: 38px; height: 38px; border-radius: 9px;
            background: rgba(255,255,255,0.2);
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          }
          .avail-template-btn-text { flex: 1; }
          .avail-template-btn-text strong { display: block; font-size: 0.9rem; margin-bottom: 0.1rem; }
          .avail-template-btn-text span { font-size: 0.75rem; opacity: 0.8; }

          /* Desktop panel — col 2, spanning rows 2+ */
          .avail-desktop-panel {
            display: flex;
            flex-direction: column;
            grid-column: 2;
            grid-row: 2;
            background: white;
            border-radius: 18px;
            border: 1px solid var(--border);
            overflow: hidden;
            box-shadow: 0 2px 12px rgba(0,0,0,0.05);
            min-height: 200px;
          }
          .avail-desktop-panel-inner {
            display: flex; flex-direction: column; height: 100%;
          }
          .avail-desktop-ph {
            display: flex; justify-content: space-between; align-items: flex-start;
            padding: 1rem 1.125rem 0.875rem;
            border-bottom: 1px solid var(--border);
            flex-shrink: 0;
          }
          .avail-sheet-header-sub {
            font-size: 0.6875rem; font-weight: 700; color: var(--text-muted);
            text-transform: uppercase; letter-spacing: 0.05em;
          }
          .avail-sheet-header-title {
            font-size: 1.0625rem; font-weight: 900; color: var(--charcoal);
            margin-top: 0.1rem;
          }
          .avail-sheet-close {
            width: 30px; height: 30px; border-radius: 8px;
            border: 1px solid var(--border); background: var(--ivory);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; color: var(--text-muted); flex-shrink: 0;
          }
          .avail-desktop-pb {
            padding: 1rem 1.125rem;
            overflow-y: auto; flex: 1; min-height: 0;
          }
          .avail-desktop-pf {
            padding: 0.875rem 1.125rem;
            border-top: 1px solid var(--border);
            background: white; flex-shrink: 0;
            display: flex; flex-direction: column; gap: 0.5rem;
          }
          .avail-desktop-empty {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; text-align: center;
            gap: 0.75rem; padding: 2rem 1.5rem; flex: 1;
          }
          .avail-desktop-empty strong { font-size: 1rem; color: var(--charcoal); display: block; }
          .avail-desktop-empty span { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.5; }
        }

        /* ══════════════════════════════════════════════
           MOBILE ≤ 640px: Bottom Sheets
           ══════════════════════════════════════════════ */
        @media (max-width: 640px) {
          .avail-root {
            grid-template-columns: 1fr;
            gap: 0.75rem;
            padding-bottom: 5.5rem; /* space for bottom nav */
          }

          /* Show template button below calendar on mobile */
          .avail-template-btn {
            display: flex;
            align-items: center; gap: 0.75rem;
            padding: 0.875rem 1rem;
            border-radius: 14px; border: 2px solid #1B6B4A;
            background: #1B6B4A; color: white;
            cursor: pointer; font-family: inherit; text-align: left;
            box-shadow: 0 4px 14px rgba(27,107,74,0.28);
            touch-action: manipulation; width: 100%;
          }
          .avail-template-btn-icon {
            width: 36px; height: 36px; border-radius: 9px;
            background: rgba(255,255,255,0.2);
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          }
          .avail-template-btn-text { flex: 1; }
          .avail-template-btn-text strong { display: block; font-size: 0.9rem; margin-bottom: 0.1rem; }
          .avail-template-btn-text span { font-size: 0.75rem; opacity: 0.8; }

          /* Bottom Sheet base */
          .avail-sheet {
            display: block;
            position: fixed;
            left: 0; right: 0; bottom: 0;
            z-index: 290;
            background: white;
            border-radius: 24px 24px 0 0;
            max-height: 88dvh;
            overflow: hidden;
            display: flex; flex-direction: column;
            box-shadow: 0 -12px 40px rgba(0,0,0,0.18);
            transform: translateY(105%);
            transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1);
          }
          .avail-sheet.is-open {
            transform: translateY(0);
          }
          .avail-sheet-tall {
            max-height: 92dvh;
          }

          .avail-sheet-handle {
            width: 40px; height: 4px; border-radius: 99px;
            background: #D7D1C7; margin: 0.625rem auto 0;
            flex-shrink: 0;
          }
          .avail-sheet-header {
            display: flex; justify-content: space-between; align-items: flex-start;
            padding: 0.875rem 1.25rem 0.75rem;
            border-bottom: 1px solid var(--border);
            flex-shrink: 0;
          }
          .avail-sheet-header-sub {
            font-size: 0.6875rem; font-weight: 700; color: var(--text-muted);
            text-transform: uppercase; letter-spacing: 0.05em;
          }
          .avail-sheet-header-title {
            font-size: 1.125rem; font-weight: 900; color: var(--charcoal);
            margin-top: 0.1rem;
          }
          .avail-sheet-close {
            width: 32px; height: 32px; border-radius: 10px;
            border: 1px solid var(--border); background: var(--ivory);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; color: var(--text-muted); flex-shrink: 0;
            touch-action: manipulation;
          }

          .avail-sheet-body {
            padding: 1rem 1.25rem;
            overflow-y: auto;
            flex: 1; min-height: 0;
            -webkit-overflow-scrolling: touch;
          }

          .avail-sheet-footer {
            padding: 0.875rem 1.25rem calc(0.875rem + env(safe-area-inset-bottom));
            border-top: 1px solid var(--border);
            background: white;
            flex-shrink: 0;
            display: flex; flex-direction: column; gap: 0.5rem;
          }

          /* Step bar for template on mobile */
          .avail-step-bar {
            padding: 0.75rem 1.25rem 0.625rem;
            border-bottom: 1px solid var(--border);
            flex-shrink: 0;
          }

          /* Slightly larger tap targets on mobile */
          .avail-cell { border-radius: 50%; }
          .avail-time-slot { padding: 0.55rem 0.2rem; }
          .avail-day-pill { width: 44px; height: 44px; }
          .avail-toast { bottom: calc(4.5rem + env(safe-area-inset-bottom)); }
        }
      `}</style>
    </div>
  );
}
