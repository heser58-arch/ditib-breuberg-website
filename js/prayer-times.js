/**
 * Prayer Times – Breuberg
 * Gebetszeiten werden aus der Datei /data/gebetszeiten.csv geladen.
 *
 * CSV-Format (erste Zeile = Kopfzeile):
 *   datum,imsak,gunes,ogle,ikindi,aksam,yatsi
 *   2026-01-01,06:23,08:15,12:32,14:20,16:40,18:18
 *
 * Um Zeiten zu ändern: einfach die Datei data/gebetszeiten.csv bearbeiten.
 */

const PRAYERS = [
  { key: 0, name: 'İmsak',   nameDE: 'Morgengebet',       icon: '🌙' },
  { key: 1, name: 'Güneş',   nameDE: 'Sonnenaufgang',     icon: '🌅' },
  { key: 2, name: 'Öğle',    nameDE: 'Mittagsgebet',      icon: '☀️' },
  { key: 3, name: 'İkindi',  nameDE: 'Nachmittagsgebet',  icon: '🌤️' },
  { key: 4, name: 'Akşam',   nameDE: 'Abendgebet',        icon: '🌇' },
  { key: 5, name: 'Yatsı',   nameDE: 'Nachtgebet',        icon: '🌃' },
];

/**
 * CSV-Datei laden und parsen
 */
async function loadPrayerTimesCSV() {
  // Pfad relativ zur aktuellen Seite berechnen
  const isInSubfolder = window.location.pathname.includes('/pages/');
  const csvPath = isInSubfolder ? '../data/gebetszeiten.csv' : 'data/gebetszeiten.csv';

  const response = await fetch(csvPath);
  if (!response.ok) throw new Error('CSV nicht gefunden: ' + csvPath);
  const text = await response.text();

  const lines = text.trim().split('\n');
  const data = {};

  // Erste Zeile überspringen (Kopfzeile)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const [datum, imsak, gunes, ogle, ikindi, aksam, yatsi] = line.split(',');
    if (datum && imsak) {
      data[datum.trim()] = [
        imsak.trim(), gunes.trim(), ogle.trim(),
        ikindi.trim(), aksam.trim(), yatsi.trim()
      ];
    }
  }

  return data;
}

/**
 * Datum als 'YYYY-MM-DD' formatieren (lokale Zeit, kein UTC-Versatz)
 */
function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Zeit-String "HH:MM" → Minuten seit Mitternacht
 */
function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Aktuelles und nächstes Gebet ermitteln
 * prayerData wird benötigt um nach Yatsı die morgigen Zeiten zu zeigen
 */
function getCurrentAndNextPrayer(times, prayerData) {
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  const prayers = PRAYERS.map((p, i) => ({
    ...p,
    time: times[i],
    mins: timeToMinutes(times[i]),
  }));

  let current = null;
  let next = null;

  for (const p of prayers) {
    if (p.mins <= currentMins) {
      current = p;
    } else if (!next) {
      next = p;
    }
  }

  // Nach dem letzten Gebet: morgigen Imsak laden
  let isTomorrow = false;
  if (!next) {
    isTomorrow = true;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTimes = prayerData ? prayerData[dateKey(tomorrow)] : null;

    if (tomorrowTimes) {
      next = {
        ...PRAYERS[0],
        time: tomorrowTimes[0],
        mins: timeToMinutes(tomorrowTimes[0]),
      };
    } else {
      next = { ...prayers[0] };
    }
  }

  return { current, next, prayers, isTomorrow };
}

/**
 * Countdown bis zum nächsten Gebet
 */
function getTimeUntil(prayer) {
  if (!prayer || prayer.mins < 0) return '--:--';
  const now = new Date();
  const totalSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  let diffSecs = prayer.mins * 60 - totalSecs;
  if (diffSecs < 0) diffSecs += 24 * 3600;
  const h = Math.floor(diffSecs / 3600);
  const m = Math.floor((diffSecs % 3600) / 60);
  const s = diffSecs % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2,'0')}min ${String(s).padStart(2,'0')}s`;
  return `${String(m).padStart(2,'0')}min ${String(s).padStart(2,'0')}s`;
}

/**
 * Datum sprachabhängig formatieren
 */
function formatDate(date) {
  const lang = (typeof I18N !== 'undefined' ? I18N.currentLang : null) || 'de';
  const locale = lang === 'tr' ? 'tr-TR' : 'de-DE';
  return date.toLocaleDateString(locale, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

/**
 * Gebetsname sprachabhängig
 */
function prayerName(p) {
  const lang = (typeof I18N !== 'undefined' ? I18N.currentLang : null) || 'de';
  return lang === 'tr' ? p.name : p.nameDE;
}

/**
 * i18n-Hilfsfunktion (auch nutzbar bevor I18N initialisiert ist)
 */
function pt(key) {
  return (typeof I18N !== 'undefined') ? I18N.t(key) : key;
}

// Gespeicherte Renderdaten für Rerender bei Sprachwechsel
let _lastRenderData = null;

/**
 * Gebetskarte im Hero-Bereich rendern
 */
function renderHeroPrayerCard(times, date, prayerData) {
  const container = document.getElementById('prayer-card-content');
  if (!container) return;

  const { current, next, prayers } = getCurrentAndNextPrayer(times, prayerData);
  const dateStr = formatDate(date);

  container.innerHTML = `
    <div class="prayer-card__header">
      <div class="prayer-card__title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        ${pt('prayer.card.title')}
      </div>
      <div class="prayer-card__date">
        <div>${dateStr}</div>
      </div>
    </div>

    ${next ? `
    <div class="prayer-card__next">
      <div>
        <div class="prayer-card__next-label">${pt('prayer.card.next')}</div>
        <div class="prayer-card__next-name">${next.icon} ${prayerName(next)}</div>
        <div style="font-size:.8125rem;opacity:.8;margin-top:2px" id="hero-countdown"></div>
      </div>
      <div class="prayer-card__next-time">${next.time}</div>
    </div>` : ''}

    <div class="prayer-list">
      ${prayers.map(p => `
        <div class="prayer-item ${current && current.key === p.key ? 'current' : ''}">
          <div class="prayer-item__name">
            <div class="prayer-item__icon">${p.icon}</div>
            <span>${prayerName(p)}</span>
          </div>
          <div class="prayer-item__time">${p.time}</div>
        </div>
      `).join('')}
    </div>
  `;

  if (next) {
    const prefix = pt('prayer.card.in');
    function updateCountdown() {
      const el = document.getElementById('hero-countdown');
      if (el) el.textContent = prefix ? `${prefix} ${getTimeUntil(next)}` : getTimeUntil(next);
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }
}

/**
 * Vollständige Gebetszeiten-Seite rendern
 */
function renderFullPrayerTimes(times, prayerData) {
  const container = document.getElementById('prayer-times-full');
  if (!container) return;

  const { current, next, prayers, isTomorrow } = getCurrentAndNextPrayer(times, prayerData);

  const bannerEl = document.getElementById('next-prayer-banner');
  if (bannerEl && next) {
    bannerEl.innerHTML = `
      <div class="next-prayer-banner__info">
        <div class="next-prayer-banner__icon">${next.icon}</div>
        <div class="next-prayer-banner__text">
          <strong>${pt('prayer.card.next')}</strong>
          <h3>${prayerName(next)} · ${next.time}</h3>
        </div>
      </div>
      <div class="next-prayer-banner__countdown">
        <div class="label">${pt('prayer.card.remaining')}</div>
        <div class="time" id="full-countdown">${getTimeUntil(next)}</div>
      </div>
    `;
    setInterval(() => {
      const el = document.getElementById('full-countdown');
      if (el) el.textContent = getTimeUntil(next);
    }, 1000);
  }

  container.innerHTML = `
    <div class="prayer-times-grid">
      ${prayers.map(p => `
        <div class="prayer-times-card ${current && current.key === p.key ? 'current' : ''}">
          <div class="prayer-times-card__icon">${p.icon}</div>
          <div class="prayer-times-card__name">${prayerName(p)}</div>
          <div class="prayer-times-card__time">${p.time}</div>
          <div style="font-size:.75rem;color:var(--gray-500);margin-top:4px">${p.name}</div>
          ${current && current.key === p.key ? `<div style="margin-top:8px"><span class="badge">${pt('prayer.card.current')}</span></div>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Initialisierung
 */
async function initPrayerTimes() {
  const heroCard = document.getElementById('prayer-card-content');
  const fullPage = document.getElementById('prayer-times-full');

  let prayerData;
  try {
    prayerData = await loadPrayerTimesCSV();
  } catch (e) {
    const errorHtml = `<div style="text-align:center;padding:32px;color:var(--gray-500)">Gebetszeiten konnten nicht geladen werden.</div>`;
    if (heroCard) heroCard.innerHTML = errorHtml;
    if (fullPage) fullPage.innerHTML = errorHtml;
    console.error('Fehler beim Laden der Gebetszeiten:', e);
    return;
  }

  const today = new Date();
  const key = dateKey(today);
  const times = prayerData[key];

  if (!times) {
    const errorHtml = `<div style="text-align:center;padding:32px;color:var(--gray-500)">Für das aktuelle Datum sind keine Gebetszeiten verfügbar.</div>`;
    if (heroCard) heroCard.innerHTML = errorHtml;
    if (fullPage) fullPage.innerHTML = errorHtml;
    return;
  }

  const { isTomorrow } = getCurrentAndNextPrayer(times, prayerData);
  let displayDate = today;
  let displayTimes = times;
  if (isTomorrow) {
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const tomorrowTimes = prayerData[dateKey(tomorrow)];
    if (tomorrowTimes) {
      displayDate = tomorrow;
      displayTimes = tomorrowTimes;
    }
  }

  // Renderdaten speichern für Sprachwechsel-Rerender
  _lastRenderData = { displayTimes, displayDate, prayerData };

  if (heroCard) renderHeroPrayerCard(displayTimes, displayDate, prayerData);
  if (fullPage) renderFullPrayerTimes(displayTimes, prayerData);
}

window.PrayerTimes = {
  init: initPrayerTimes,
  rerender() {
    if (!_lastRenderData) return;
    const { displayTimes, displayDate, prayerData } = _lastRenderData;
    const heroCard = document.getElementById('prayer-card-content');
    const fullPage = document.getElementById('prayer-times-full');
    if (heroCard) renderHeroPrayerCard(displayTimes, displayDate, prayerData);
    if (fullPage) renderFullPrayerTimes(displayTimes, prayerData);
  }
};
