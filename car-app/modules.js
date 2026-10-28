/* === АвтоПомощник — новые модули: погода, рекомендации, штрафы, заправки, экстренные службы, чек-лист, ТО, памятка === */

(function () {
    'use strict';

    const $ = (s, c) => (c || document).querySelector(s);
    const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const CHELYABINSK = { name: 'Челябинск', lat: 55.1644, lon: 61.4368 };
    let currentCity = { ...CHELYABINSK };
    let geoCache = null;

    // ================== WEATHER ==================
    async function loadWeather(city) {
        const block = $('#weatherBlock');
        block.innerHTML = '<p class="alert alert-info">Загружаю прогноз…</p>';
        try {
            const geo = await geocode(city);
            const url = 'https://api.open-meteo.com/v1/forecast'
                + `?latitude=${geo.lat}&longitude=${geo.lon}`
                + '&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day'
                + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max,wind_speed_10m_max'
                + '&timezone=auto&forecast_days=7';
            const r = await fetch(url);
            if (!r.ok) throw new Error('HTTP ' + r.status);
            const d = await r.json();
            currentCity = { name: geo.name, lat: geo.lat, lon: geo.lon };
            renderWeather(d, geo.name);
        } catch (e) {
            block.innerHTML = `<div class="alert alert-danger"><strong>Не удалось загрузить прогноз.</strong><br>${esc(e.message)}. Проверьте интернет или введите другой город.</div>`;
        }
    }

    async function geocode(name) {
        const q = encodeURIComponent(name);
        const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=1&language=ru&format=json`);
        const d = await r.json();
        if (d.results && d.results.length) {
            return { name: d.results[0].name, lat: d.results[0].latitude, lon: d.results[0].longitude };
        }
        throw new Error('Город не найден');
    }

    function renderWeather(d, cityName) {
        const c = d.current;
        const w = EXTRAS.weatherCodes[c.weather_code] || { desc: '—', icon: '🌡️', road: '', risk: 'ok' };
        const days = d.daily;
        const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

        // Сохраняем состояние для модуля рекомендаций
        weatherState = {
            temperature: c.temperature_2m,
            apparent: c.apparent_temperature,
            precipitation: c.precipitation,
            wind: c.wind_speed_10m,
            code: c.weather_code,
            uv: days.uv_index_max ? Math.max(...days.uv_index_max) : 0
        };

        let forecast = '';
        for (let i = 0; i < days.time.length; i++) {
            const dt = new Date(days.time[i] + 'T12:00');
            const dw = EXTRAS.weatherCodes[days.weather_code[i]] || { icon: '🌡️' };
            const nm = i === 0 ? 'Сегодня' : weekdays[dt.getDay()];
            forecast += `
                <div class="fc-day">
                    <div class="fc-name">${nm}</div>
                    <div class="fc-icon">${dw.icon}</div>
                    <div class="fc-temp">${Math.round(days.temperature_2m_max[i])}°</div>
                    <div class="fc-temp" style="color:#64748b;font-weight:600">${Math.round(days.temperature_2m_min[i])}°</div>
                    ${days.precipitation_probability_max[i] > 0 ? `<div class="fc-rain">💧 ${days.precipitation_probability_max[i]}%</div>` : ''}
                </div>`;
        }

        const dir = windDir(c.wind_direction_10m);
        const uv = days.uv_index_max ? Math.max(...days.uv_index_max) : 0;

        $('#weatherBlock').innerHTML = `
            <div class="weather-current">
                <div class="wc-icon">${w.icon}</div>
                <div>
                    <div class="wc-temp">${Math.round(c.temperature_2m)}°C</div>
                    <div class="wc-desc">${esc(w.desc)} · ощущается как ${Math.round(c.apparent_temperature)}°C</div>
                    <div class="wc-city">📍 ${esc(cityName)}</div>
                </div>
            </div>

            <div class="wc-metrics">
                <div class="metric"><div class="m-val">${Math.round(c.relative_humidity_2m)}%</div><div class="m-label">влажность</div></div>
                <div class="metric"><div class="m-val">${Math.round(c.wind_speed_10m)}</div><div class="m-label">км/ч, ${dir}</div></div>
                <div class="metric"><div class="m-val">${c.precipitation.toFixed(1)}</div><div class="m-label">мм осадков</div></div>
                <div class="metric"><div class="m-val">${uv.toFixed(0)}</div><div class="m-label">УФ-индекс</div></div>
            </div>

            <div class="road-advice ${w.risk}">
                <strong>${w.icon} ${esc(w.desc)}</strong><br>${esc(w.road)}
            </div>

            <h3 class="sub">Прогноз на 7 дней</h3>
            <div class="forecast">${forecast}</div>
        `;
    }

    function windDir(deg) {
        const dirs = ['С', 'ССВ', 'СВ', 'ВСВ', 'В', 'ВЮВ', 'ЮВ', 'ЮЮВ', 'Ю', 'ЮЮЗ', 'ЮЗ', 'ЗЮЗ', 'З', 'ЗСЗ', 'СЗ', 'ССЗ'];
        return dirs[Math.round(deg / 22.5) % 16];
    }

    // ================== SEASONAL ADVICE ==================
    function renderAdvice() {
        const now = new Date();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const year = now.getFullYear();
        const dateStr = now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

        let season = null;
        for (const key of Object.keys(EXTRAS.seasons)) {
            if (EXTRAS.seasons[key].months.includes(month)) { season = EXTRAS.seasons[key]; break; }
        }

        const tips = [];
        const cur = stateWeather();
        if (cur) {
            if (cur.temperature <= -15) tips.push(EXTRAS.weatherTips.ice);
            else if (cur.temperature <= 2) tips.push(EXTRAS.weatherTips.frost);
            if (cur.precip > 0 && cur.temp > 2) tips.push(EXTRAS.weatherTips.rain);
            if (cur.temp <= 2 && cur.precip > 0) tips.push(EXTRAS.weatherTips.snow);
            if (cur.wind > 50) tips.push(EXTRAS.weatherTips.wind);
            if (cur.code === 45 || cur.code === 48) tips.push(EXTRAS.weatherTips.fog);
            if (cur.temp >= 30) tips.push(EXTRAS.weatherTips.heat);
            if (cur.uv >= 6) tips.push(EXTRAS.weatherTips.uv);
            if (!tips.length) tips.push(EXTRAS.weatherTips.good);
        }

        $('#adviceDate').innerHTML = `Актуально на <b>${esc(dateStr)}</b>${cur ? ` · сейчас ${Math.round(cur.temperature)}°C, ${esc(EXTRAS.weatherCodes[cur.code]?.desc || '')}` : ''}`;

        let html = `
            <div class="season-banner">
                <div class="sb-icon">${season.icon}</div>
                <div>
                    <div class="sb-name">Сезон: ${esc(season.name)}</div>
                    <div class="sb-date">${esc(dateStr)} · ${month} месяц</div>
                </div>
            </div>

            <div class="advice-block-title">${season.icon} Рекомендации на ${esc(season.name.toLowerCase())}</div>
        `;

        season.items.forEach(it => {
            html += `
                <div class="advice-item">
                    <div class="ai-icon">${it.icon}</div>
                    <div>
                        <h4>${esc(it.title)}</h4>
                        <p>${esc(it.text)}</p>
                    </div>
                </div>`;
        });

        if (tips.length) {
            html += `<div class="advice-block-title">🌡️ Учитывая погоду сейчас</div>`;
            tips.forEach(t => {
                html += `
                    <div class="advice-item">
                        <div class="ai-icon">${t.icon}</div>
                        <div>
                            <h4>${esc(t.title)}</h4>
                            <p>${esc(t.text)}</p>
                        </div>
                    </div>`;
            });
        }

        // Проверка ТО
        html += `<div class="advice-block-title">🔧 Ближайшее ТО</div>`;
        html += renderServiceRows();

        $('#adviceBlock').innerHTML = html;
    }

    // ================== FINES ==================
    function renderFines() {
        $('#finesTable').innerHTML = EXTRAS.fines.map(f => `
            <div class="fine-row">
                <div>
                    <div class="fr-title">${esc(f.title)}</div>
                    <div class="fr-note">${esc(f.note)}</div>
                </div>
                <div class="fr-amount">${esc(f.amount)}</div>
            </div>
        `).join('');
    }

    function checkFines() {
        const plate = $('#plateInput').value.trim().toUpperCase();
        const sts = $('#stsInput').value.trim();
        const region = $('#regionInput').value.trim() || '74';

        if (!plate) {
            toast('Введите государственный номер', 'warn');
            $('#plateInput').focus();
            return;
        }
        const cleanPlate = plate.replace(/\s/g, '');
        const params = new URLSearchParams({ plate: cleanPlate, region: region });
        if (sts) params.set('date', sts);

        const url = 'https://www.gibdd.ru/check/fines?' + params.toString();
        window.open(url, '_blank', 'noopener');
        toast('Открываю официальную проверку ГИБДД');
    }

    // ================== FUEL (сети — статичный список) ==================
    function renderFuel() {
        const grid = document.querySelector('#fuelBrands');
        if (!grid) return;
        grid.innerHTML = EXTRAS.fuelBrands.map(b => `
            <a class="fuel-card" href="${b.site}" target="_blank" rel="noopener">
                <div class="fc-logo" style="color:${b.color}">${b.icon}</div>
                <div>
                    <div class="fc-name">${esc(b.name)}</div>
                    <div class="fc-sub">Сайт и карты лояльности</div>
                </div>
            </a>
        `).join('');
    }

    // ================== EMERGENCY ==================
    function renderEmergency() {
        $('#emergencyFederal').innerHTML = EXTRAS.emergency.federal.map(e => `
            <a class="em-item" href="tel:${e.num}">
                <div class="em-icon">${e.icon}</div>
                <div class="em-body">
                    <div class="em-name">${esc(e.name)}</div>
                    <div class="em-desc">${esc(e.desc)}</div>
                </div>
                <div class="em-num">${esc(e.num)}</div>
            </a>
        `).join('');

        $('#emergencyChelyabinsk').innerHTML = EXTRAS.emergency.chelyabinsk.map(e => `
            <a class="em-item" href="tel:${e.num.replace(/[^\d+]/g, '')}">
                <div class="em-icon">${e.icon}</div>
                <div class="em-body">
                    <div class="em-name">${esc(e.name)}</div>
                    <div class="em-desc">${esc(e.desc)}</div>
                </div>
                <div class="em-num">${esc(e.num)}</div>
            </a>
        `).join('');
    }

    // ================== CHECKLIST ==================
    const CHECK_KEY = 'autohelp_checklist_v1';

    function renderChecklist() {
        const done = JSON.parse(localStorage.getItem(CHECK_KEY) || '{}');
        $('#checklist').innerHTML = EXTRAS.tripChecklist.map(item => `
            <div class="check-item ${done[item.id] ? 'checked' : ''}" data-id="${item.id}">
                <div class="check-box">✓</div>
                <div class="ci-icon">${item.icon}</div>
                <div class="ci-body">
                    <div class="ci-title">${esc(item.title)}</div>
                    <div class="ci-text">${esc(item.text)}</div>
                </div>
            </div>
        `).join('');

        $$('#checklist .check-item').forEach(el => {
            el.addEventListener('click', () => {
                el.classList.toggle('checked');
                const d = JSON.parse(localStorage.getItem(CHECK_KEY) || '{}');
                d[el.dataset.id] = el.classList.contains('checked');
                localStorage.setItem(CHECK_KEY, JSON.stringify(d));
                updateCheckProgress();
            });
        });

        updateCheckProgress();
    }

    function updateCheckProgress() {
        const total = EXTRAS.tripChecklist.length;
        const done = $$('#checklist .check-item.checked').length;
        $('#checkProgress').style.width = (total ? (done / total * 100) : 0) + '%';
        $('#checkProgressText').textContent = `${done} / ${total}`;
    }

    function resetChecklist() {
        localStorage.removeItem(CHECK_KEY);
        renderChecklist();
        toast('Чек-лист сброшен');
    }

    // ================== SERVICE / MAINTENANCE ==================
    function renderMaintTable() {
        $('#maintTable').innerHTML = EXTRAS.maintenance.map(m => `
            <div class="maint-row">
                <div>
                    <div>${esc(m.item)}</div>
                    <div class="mr-note">${esc(m.note)}</div>
                </div>
                <div class="mr-val">${m.km ? m.km.toLocaleString('ru-RU') + ' км' : ''}${m.km && m.months ? ' / ' : ''}${m.months} мес.</div>
            </div>
        `).join('');
    }

    function calcService() {
        const odo = parseInt($('#odoInput').value) || 0;
        const lastOdo = parseInt($('#lastServiceOdo').value) || 0;
        const dateVal = $('#lastServiceDate').value;
        const lastDate = dateVal ? new Date(dateVal) : null;
        const kmSince = Math.max(0, odo - lastOdo);
        const monthsSince = lastDate
            ? Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
            : 0;

        const rows = EXTRAS.maintenance.map(m => {
            const byKm = m.km ? (kmSince / m.km) : 0;
            const byTime = m.months ? (monthsSince / m.months) : 0;
            const ratio = Math.max(byKm, byTime);
            let cls = 'ok', when = 'в норме';
            if (ratio >= 1) { cls = 'due'; when = 'пора менять'; }
            else if (ratio >= 0.85) { cls = 'soon'; when = 'скоро'; }
            return { ...m, ratio, cls, when, kmSince, monthsSince };
        });

        rows.sort((a, b) => b.ratio - a.ratio);
        $('#serviceResult').innerHTML = `
            <div class="alert alert-info">
                <strong>С последнего ТО:</strong> ${kmSince.toLocaleString('ru-RU')} км и ${monthsSince} мес.
                ${rows.filter(r => r.cls === 'due').length ? ` · <b style="color:#dc2626">${rows.filter(r => r.cls === 'due').length} пунктов пора менять</b>` : ''}
            </div>
            ${rows.map(r => `
                <div class="svc-item ${r.cls}">
                    <div>
                        <div class="sv-name">${esc(r.item)}</div>
                        <div class="sv-note">${esc(r.note)}${r.km ? ' · ' + r.km.toLocaleString('ru-RU') + ' км' : ''}${r.months ? ' · ' + r.months + ' мес.' : ''}</div>
                    </div>
                    <div class="sv-when">${r.when}</div>
                </div>`).join('')}
        `;
    }

    function renderServiceRows() {
        const odo = parseInt($('#odoInput').value) || 0;
        const lastOdo = parseInt($('#lastServiceOdo').value) || 0;
        const dateVal = $('#lastServiceDate').value;
        const lastDate = dateVal ? new Date(dateVal) : null;
        const kmSince = Math.max(0, odo - lastOdo);
        const monthsSince = lastDate ? Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)) : 0;

        const due = EXTRAS.maintenance
            .map(m => {
                const ratio = Math.max(m.km ? kmSince / m.km : 0, m.months ? monthsSince / m.months : 0);
                return { ...m, ratio };
            })
            .filter(m => m.ratio >= 0.85)
            .sort((a, b) => b.ratio - a.ratio)
            .slice(0, 4);

        if (!due.length) return `<div class="alert alert-info">✅ По регламенту всё в норме. Следующее ТО — через <b>${(10000 - kmSince).toLocaleString('ru-RU')} км</b> или 12 месяцев.</div>`;

        return due.map(r => `
            <div class="advice-item">
                <div class="ai-icon">${r.ratio >= 1 ? '🔴' : '🟡'}</div>
                <div>
                    <h4>${esc(r.item)} ${r.ratio >= 1 ? '— пора менять' : '— скоро'}</h4>
                    <p>${esc(r.note)} · ${r.km ? r.km.toLocaleString('ru-RU') + ' км / ' : ''}${r.months} мес.</p>
                </div>
            </div>`).join('');
    }

    // ================== ROAD MEMO ==================
    let memoIndex = 0;

    function renderMemo() {
        $('#memoNav').innerHTML = EXTRAS.roadMemo.map((m, i) =>
            `<button class="memo-tab ${i === memoIndex ? 'active' : ''}" data-i="${i}">${m.icon} ${esc(m.title)}</button>`
        ).join('');

        $$('#memoNav .memo-tab').forEach(b => {
            b.addEventListener('click', () => { memoIndex = parseInt(b.dataset.i); renderMemo(); });
        });

        const m = EXTRAS.roadMemo[memoIndex];
        $('#memoBlock').innerHTML = `
            <div class="advice-block-title">${m.icon} ${esc(m.title)}</div>
            <ol class="steps">
                ${m.steps.map(s => `<li>${esc(s)}</li>`).join('')}
            </ol>
        `;

        $('#docsGrid').innerHTML = EXTRAS.docs.map(d => `
            <a class="doc-item" href="${d.url}" target="_blank" rel="noopener">
                <div class="doc-icon">${d.icon}</div>
                <div>
                    <div class="doc-name">${esc(d.name)}</div>
                    <div class="doc-desc">${esc(d.desc)}</div>
                </div>
            </a>
        `).join('');
    }

    // ================== WEATHER STATE ==================
    let weatherState = null;

    function stateWeather() {
        return weatherState;
    }

    // ================== TOAST ==================
    function toast(msg, type) {
        const t = $('#toast');
        t.textContent = msg;
        t.style.background = type === 'warn' ? '#dc2626' : '';
        t.hidden = false;
        clearTimeout(t._tid);
        t._tid = setTimeout(() => t.hidden = true, 2600);
    }

    // ================== INIT ==================
    document.addEventListener('DOMContentLoaded', () => {
        // Статические блоки
        renderFines();
        renderFuel();
        renderEmergency();
        renderChecklist();
        renderMaintTable();
        renderMemo();

        // Погода
        loadWeather('Челябинск').then(() => renderAdvice());

        // События
        $('#weatherSearch').addEventListener('click', () => {
            const v = $('#weatherCity').value.trim();
            if (v) loadWeather(v);
        });
        $('#weatherCity').addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); $('#weatherSearch').click(); }
        });
        $('#weatherGeo').addEventListener('click', () => {
            requestGeo(c => {
                $('#weatherCity').value = `${c.lat.toFixed(3)}, ${c.lon.toFixed(3)}`;
                loadWeather(`${c.lat},${c.lon}`);
            });
        });
        $('#checkFines').addEventListener('click', checkFines);
        $('#plateInput').addEventListener('keydown', e => { if (e.key === 'Enter') checkFines(); });
        $('#stsInput').addEventListener('keydown', e => { if (e.key === 'Enter') checkFines(); });
        $('#checkReset').addEventListener('click', resetChecklist);
        $('#calcService').addEventListener('click', calcService);
        const mSearch = $('#manualSearch');
        if (mSearch) mSearch.addEventListener('input', () => {
            const q = mSearch.value.trim().toLowerCase();
            $$('#manualResults .manual-item').forEach(el => {
                el.style.display = !q || el.textContent.toLowerCase().includes(q) ? '' : 'none';
            });
        });
    });
})();
