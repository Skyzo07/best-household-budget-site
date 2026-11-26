// Hearth & Home Budget — charts: hand-drawn canvas donut, bars and trend.
// No chart library, no network. All drawing is plain Canvas 2D.
export function drawDonut(canvas, slices, centerLabel, centerValue) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 320;
  const h = canvas.clientHeight || 260;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);
  const total = slices.reduce((s, x) => s + x.value, 0);
  const cx = w / 2, cy = h / 2;
  const r = Math.min(w, h) / 2 - 14;
  const inner = r * 0.62;
  if (total <= 0) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#e8ede8'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.fillStyle = '#5d6d64'; ctx.font = '600 13px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.fillText('No spending yet', cx, cy + 5);
    return;
  }
  let a = -Math.PI / 2;
  for (const s of slices) {
    const span = (s.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, a, a + span);
    ctx.closePath();
    ctx.fillStyle = s.color;
    ctx.fill();
    a += span;
  }
  ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fillStyle = '#fff'; ctx.fill();
  ctx.fillStyle = '#1e2a24'; ctx.textAlign = 'center';
  ctx.font = '800 19px system-ui, sans-serif';
  ctx.fillText(centerValue, cx, cy - 2);
  ctx.fillStyle = '#5d6d64'; ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillText(centerLabel, cx, cy + 17);
}

export function drawBars(canvas, bars, opts) {
  const o = Object.assign({ valueLabel: (v) => '$' + Math.round(v).toLocaleString('en-US'), color: '#1d6b4f', max: 0 }, opts || {});
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 600;
  const h = canvas.clientHeight || 260;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);
  const max = o.max || Math.max.apply(null, bars.map((b) => b.value).concat([1]));
  const padL = 8, padR = 8, padT = 24, padB = 30;
  const plotW = w - padL - padR, plotH = h - padT - padB;
  const bw = Math.min(52, (plotW / Math.max(bars.length, 1)) * 0.55);
  const step = plotW / Math.max(bars.length, 1);
  ctx.font = '600 11px system-ui, sans-serif';
  bars.forEach((b, i) => {
    const bh = Math.max(2, (b.value / max) * plotH);
    const x = padL + i * step + (step - bw) / 2;
    const y = padT + (plotH - bh);
    ctx.fillStyle = b.color || o.color;
    ctx.beginPath();
    ctx.roundRect(x, y, bw, bh, [5, 5, 0, 0]);
    ctx.fill();
    ctx.fillStyle = '#1e2a24'; ctx.textAlign = 'center';
    ctx.fillText(o.valueLabel(b.value), x + bw / 2, y - 6);
    ctx.fillStyle = '#5d6d64';
    ctx.fillText(b.label, x + bw / 2, h - 10);
    if (b.sub) { ctx.fillStyle = '#8a9a8e'; ctx.font = '11px system-ui, sans-serif'; ctx.fillText(b.sub, x + bw / 2, h - 24 + 14); ctx.font = '600 11px system-ui, sans-serif'; }
  });
  ctx.strokeStyle = '#dde5de'; ctx.beginPath();
  ctx.moveTo(padL, padT + plotH); ctx.lineTo(w - padR, padT + plotH); ctx.stroke();
}

export function drawTrend(canvas, points) {
  // points: [{label, income, expense}] — grouped bars + a savings line.
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 600;
  const h = canvas.clientHeight || 280;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);
  const max = Math.max.apply(null, points.map((p) => Math.max(p.income, p.expense)).concat([1]));
  const padL = 10, padR = 10, padT = 26, padB = 30;
  const plotW = w - padL - padR, plotH = h - padT - padB;
  const step = plotW / points.length;
  const bw = Math.min(26, step * 0.28);
  ctx.font = '600 11px system-ui, sans-serif';
  const linePts = [];
  points.forEach((p, i) => {
    const cx = padL + i * step + step / 2;
    const ih = (p.income / max) * plotH;
    const eh = (p.expense / max) * plotH;
    ctx.fillStyle = '#1d6b4f';
    ctx.beginPath(); ctx.roundRect(cx - bw - 3, padT + plotH - ih, bw, Math.max(2, ih), [4, 4, 0, 0]); ctx.fill();
    ctx.fillStyle = '#d9a441';
    ctx.beginPath(); ctx.roundRect(cx + 3, padT + plotH - eh, bw, Math.max(2, eh), [4, 4, 0, 0]); ctx.fill();
    ctx.fillStyle = '#5d6d64'; ctx.textAlign = 'center';
    ctx.fillText(p.label, cx, h - 10);
    const saved = p.income - p.expense;
    linePts.push({ x: cx, y: padT + plotH - (saved / max) * plotH, saved });
  });
  ctx.strokeStyle = '#b3382e'; ctx.lineWidth = 2.5; ctx.beginPath();
  linePts.forEach((pt, i) => { if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y); });
  ctx.stroke();
  ctx.lineWidth = 1;
  linePts.forEach((pt) => {
    ctx.beginPath(); ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#b3382e'; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1;
    if (w >= 500) { ctx.fillStyle = '#7c241d'; ctx.textAlign = 'center'; ctx.fillText('+' + Math.round(pt.saved), pt.x, pt.y - 9); }
  });
  ctx.strokeStyle = '#dde5de'; ctx.beginPath();
  ctx.moveTo(padL, padT + plotH); ctx.lineTo(w - padR, padT + plotH); ctx.stroke();
  // legend
  ctx.textAlign = 'left'; ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillStyle = '#1d6b4f'; ctx.fillRect(padL, 8, 12, 12); ctx.fillStyle = '#1e2a24'; ctx.fillText('Income', padL + 17, 18);
  ctx.fillStyle = '#d9a441'; ctx.fillRect(padL + 82, 8, 12, 12); ctx.fillStyle = '#1e2a24'; ctx.fillText('Spending', padL + 99, 18);
  ctx.strokeStyle = '#b3382e'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(padL + 182, 14); ctx.lineTo(padL + 200, 14); ctx.stroke();
  ctx.fillStyle = '#1e2a24'; ctx.fillText('Saved', padL + 205, 18);
}

export function ringSVG(pct, color) {
  const p = Math.max(0, Math.min(100, pct));
  const r = 54, c = 2 * Math.PI * r;
  const off = c * (1 - p / 100);
  return '<svg width="132" height="132" viewBox="0 0 132 132" role="img" aria-label="' + Math.round(p) + ' percent saved">'
    + '<circle cx="66" cy="66" r="' + r + '" fill="none" stroke="#e8ede8" stroke-width="12"/>'
    + '<circle cx="66" cy="66" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 66 66)"/>'
    + '</svg>';
}
