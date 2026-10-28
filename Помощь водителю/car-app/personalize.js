/* === АвтоПомощник — персонализация, шторка-меню, геолокация, заправки === */

(function () {
    'use strict';

    const $ = (s, c) => (c || document).querySelector(s);
    const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    function toast(msg, type) {
        const t = document.querySelector('#toast');
        if (!t) return;
        t.textContent = msg;
        t.style.background = type === 'warn' ? '#dc2626' : '';
        t.hidden = false;
        clearTimeout(t._tid);
        t._tid = setTimeout(() => t.hidden = true, 2600);
    }

    /* =====================================================
       ГЕОЛОКАЦИЯ — единый модуль с fallback'ами
       ===================================================== */
    const GEO = {
        city: 'Челябинск',
        lat: 55.1644,
        lon: 61.4368,
        source: 'город по умолчанию',
        listeners: []
    };

    function onGeoChange(fn) { GEO.listeners.push(fn); }

    function emitGeo() { GEO.listeners.forEach(fn => { try { fn(GEO); } catch (e) { console.warn(e); } }); }

    function setCity(name) {
        const found = CAR_SPECS.cities.find(c => c.toLowerCase() === name.toLowerCase());
        if (!found) return false;
        GEO.city = found;
        GEO.source = 'выбранный город';
        // координаты через Open-Meteo
        fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(found)}&count=1&language=ru&format=json`)
            .then(r => r.json())
            .then(d => {
                if (d.results && d.results.length) {
                    GEO.lat = d.results[0].latitude;
                    GEO.lon = d.results[0].longitude;
                }
                emitGeo();
            })
            .catch(() => emitGeo());
        return true;
    }

    function detectGeo() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) return resolve(false);

            // 1) Точная геолокация браузера
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    GEO.lat = pos.coords.latitude;
                    GEO.lon = pos.coords.longitude;
                    GEO.source = 'по геолокации устройства';
                    // пытаемся понять город по координатам
                    await reverseGeocode(GEO.lat, GEO.lon);
                    emitGeo();
                    resolve(true);
                },
                async () => {
                    // 2) Fallback: определение по IP
                    const ip = await detectByIp();
                    if (ip) { emitGeo(); resolve(true); }
                    else { resolve(false); }
                },
                { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
            );
        });
    }

    async function reverseGeocode(lat, lon) {
        try {
            const ctrl = new AbortController();
            const t = setTimeout(() => ctrl.abort(), 7000);
            const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=ru`, { signal: ctrl.signal });
            clearTimeout(t);
            if (!r.ok) return false;
            const d = await r.json();
            const a = d.address || {};
            const city = a.city || a.town || a.village || a.municipality || a.county || a.state;
            if (city) {
                GEO.city = city;
                const known = CAR_SPECS.cities.find(c => c.toLowerCase() === String(city).toLowerCase());
                if (known) GEO.city = known;
                return true;
            }
        } catch (e) { /* не критично */ }
        return false;
    }

    async function detectByIp() {
        const services = [
            'https://ipwho.is/',
            'https://ipapi.co/json/',
            'https://ipinfo.io/json'
        ];
        for (const s of services) {
            try {
                const ctrl = new AbortController();
                const t = setTimeout(() => ctrl.abort(), 7000);
                const r = await fetch(s, { signal: ctrl.signal });
                clearTimeout(t);
                if (!r.ok) continue;
                const d = await r.json();
                const lat = parseFloat(d.latitude ?? d.lat);
                const lon = parseFloat(d.longitude ?? d.lon);
                if (isFinite(lat) && isFinite(lon)) {
                    GEO.lat = lat; GEO.lon = lon;
                    const ipCity = (d.city || d.city_name || '').trim();
                    if (ipCity) GEO.city = ipCity;
                    await reverseGeocode(lat, lon);
                    GEO.source = 'по IP-адресу';
                    return true;
                }
            } catch (e) { /* следующий */ }
        }
        return false;
    }

    /* =====================================================
       ШТОРКА-МЕНЮ
       ===================================================== */
    const MENU = [
        { group: 'Автомобиль', items: [
            { id: 'indicators', icon: '🔆', name: 'Индикаторы приборки' },
            { id: 'fluids', icon: '🛢️', name: 'Жидкости и масло' },
            { id: 'service', icon: '🔧', name: 'Сервис и ТО' },
            { id: 'manual', icon: '📖', name: 'Инструкция по эксплуатации' }
        ]},
        { group: 'В пути', items: [
            { id: 'weather', icon: '🌤', name: 'Погода и прогноз' },
            { id: 'advice', icon: '💡', name: 'Рекомендации (сезон + погода)' },
            { id: 'fuel', icon: '⛽', name: 'Заправки и сервисы рядом' },
            { id: 'jumpstart', icon: '🔋', name: 'Запуск от внешнего источника' },
            { id: 'tow', icon: '🚛', name: 'Буксировка' },
            { id: 'wipers', icon: '🧽', name: 'Замена щёток' }
        ]},
        { group: 'Документы и деньги', items: [
            { id: 'insurance', icon: '🛡️', name: 'Страхование: ОСАГО / КАСКО' },
            { id: 'fines', icon: '🚦', name: 'Штрафы ГИБДД' },
            { id: 'checklist', icon: '✅', name: 'Чек-лист перед поездкой' }
        ]},
        { group: 'Помощь', items: [
            { id: 'emergency', icon: '🆘', name: 'Экстренные службы', badge: 'SOS' },
            { id: 'memo', icon: '📋', name: 'Дорожная памятка' }
        ]}
    ];

    function buildDrawer() {
        const nav = $('#drawerNav');
        nav.innerHTML = MENU.map(g => `
            <div class="drawer-group">${esc(g.group)}</div>
            ${g.items.map(i => `
                <button class="drawer-link" data-target="${i.target || i.id}">
                    <span class="dl-ic">${i.icon}</span>
                    <span>${esc(i.name)}</span>
                    ${i.badge ? `<span class="dl-badge">${i.badge}</span>` : ''}
                </button>`).join('')}
        `).join('');

        $$('.drawer-link', nav).forEach(b => {
            b.addEventListener('click', () => {
                closeDrawer();
                const tab = document.querySelector(`.tab[data-target="${b.dataset.target}"]`);
                if (tab) { tab.click(); tab.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
            });
        });
    }

    function openDrawer() {
        $('#drawer').hidden = false;
        $('#drawerBackdrop').hidden = false;
        document.body.style.overflow = 'hidden';
    }
    function closeDrawer() {
        $('#drawer').hidden = true;
        $('#drawerBackdrop').hidden = true;
        document.body.style.overflow = '';
    }

    function updateDrawerCar() {
        const st = window.AppState || {};
        const state = st;
        const box = $('#drawerCar');
        if (!state.brand || !state.model) {
            box.innerHTML = '<b>Автомобиль не выбран</b><br>Выберите марку и модель — приложение подстроит рекомендации';
            return;
        }
        const spec = getSpec();
        box.innerHTML = `<b>${esc(state.brand.name)} ${esc(state.model)}</b><br>${esc(spec.fuelName)} · ${esc(spec.driveName)}${state.year ? ' · ' + state.year : ''}`;
    }

    /* =====================================================
       ПЕРСОНАЛИЗАЦИЯ
       ===================================================== */
    function getSpec() {
        const st = window.AppState || {};
        const brand = st.brand;
        const model = st.model;
        if (!brand || !model) return null;

        const def = CAR_SPECS.defaults[brand.id] || { fuel: 'petrol', drive: 'fwd', eps: true, oil: '5W-30', hp: 130 };
        const ov = CAR_SPECS.models[`${brand.id}:${model}`] || {};
        const s = { ...def, ...ov };

        const fh = CAR_SPECS.hints.fuel[s.fuel] || CAR_SPECS.hints.fuel.petrol;
        const dh = CAR_SPECS.hints.drive[s.drive] || CAR_SPECS.hints.drive.fwd;
        const eh = s.eps ? CAR_SPECS.hints.eps.true : CAR_SPECS.hints.eps.false;

        return {
            ...s,
            fuelName: fh.name,
            driveName: dh.name,
            fuelIcon: fh.icon,
            driveIcon: dh.icon,
            fuelText: fh.text,
            driveText: dh.text,
            epsText: eh.text,
            epsName: eh.name
        };
    }

    function renderMyCar() {
        const st = window.AppState || {};
        const state = st;
        const box = $('#myCar');
        const spec = getSpec();
        if (!spec) { box.hidden = true; return; }
        box.hidden = false;

        const ev = spec.fuel === 'ev';
        const year = state.year ? ` · ${state.year} г.в.` : '';

        box.innerHTML = `
            <div class="mc-title">${esc(state.brand.name)} ${esc(state.model)}</div>
            <div class="mc-sub">${esc(state.brand.country)}${year}</div>

            <div class="mc-specs">
                <div class="mc-spec">
                    <div class="ms-ic">${spec.fuelIcon}</div>
                    <div class="ms-name">${esc(spec.fuelName)}</div>
                    <div class="ms-val">${ev ? 'электротяга' : 'топливо: ' + (spec.fuel === 'diesel' ? 'дизельное' : spec.fuel === 'hybrid' ? 'бензин + гибрид' : 'бензин')}</div>
                </div>
                <div class="mc-spec">
                    <div class="ms-ic">${spec.driveIcon}</div>
                    <div class="ms-name">${esc(spec.driveName)}</div>
                    <div class="ms-val">${spec.drive === 'awd' ? 'только эвакуатор' : 'буксировка возможна'}</div>
                </div>
                <div class="mc-spec">
                    <div class="ms-ic">🛢️</div>
                    <div class="ms-name">Масло ${esc(spec.oil)}</div>
                    <div class="ms-val">вязкость по руководству</div>
                </div>
                <div class="mc-spec">
                    <div class="ms-ic">🧭</div>
                    <div class="ms-name">${esc(spec.epsName)}</div>
                    <div class="ms-val">${spec.eps ? 'жидкость ГУР не нужна' : 'проверять жидкость ГУР'}</div>
                </div>
            </div>

            <div class="mc-note">${spec.fuelIcon} ${esc(spec.fuelText)}</div>
            <div class="mc-note">${spec.driveIcon} ${esc(spec.driveText)}</div>

            <div class="mc-actions">
                <button class="mc-btn accent" data-go="manual">📖 Инструкция</button>
                <button class="mc-btn" data-go="fluids">🛢️ Мой масло: ${esc(spec.oil)}</button>
                <button class="mc-btn" data-go="jumpstart">🔋 Запуск${ev ? ' (нельзя!)' : ''}</button>
                <button class="mc-btn" data-go="tow">🚛 Буксировка</button>
                <button class="mc-btn" data-go="insurance">🛡️ ОСАГО</button>
            </div>
        `;

        $$('[data-go]', box).forEach(b => {
            b.addEventListener('click', () => {
                const tab = document.querySelector(`.tab[data-target="${b.dataset.go}"]`);
                if (tab) { tab.click(); tab.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
            });
        });
    }

    /* ---------- Релевантность индикаторов для выбранного авто ---------- */
    const DIESEL_INDICATORS = ['топливного фильтра', 'свечей накаливания', 'выхлопной системы (DPF)'];
    const AWD_INDICATORS = ['полного привода'];
    const EV_INDICATORS = ['заряда']; // лампа зарядки

    // Возвращает: 'hide' | 'mark' | null
    function indicatorFit(ind, spec) {
        if (!spec) return null;
        const t = ind.title.toLowerCase();
        if (DIESEL_INDICATORS.some(k => t.includes(k.toLowerCase())))
            return spec.fuel === 'diesel' ? 'mark' : 'hide';
        if (AWD_INDICATORS.some(k => t.includes(k.toLowerCase())))
            return spec.drive === 'awd' ? 'mark' : 'hide';
        if (t.includes('электроусилителем (eps)'))
            return spec.eps === true ? 'mark' : 'hide';
        if (t.includes('системы зарядки'))
            return spec.fuel !== 'ev' ? 'mark' : 'hide';
        return null;
    }

    function markIndicators() {
        const spec = getSpec();
        $$('.indicator-item').forEach(el => {
            el.classList.remove('relevant', 'hidden-for-car');
            el.querySelector('.rel-badge')?.remove();
            if (!spec) return;
            const ind = APP_DATA.indicators.find(x => x.id === el.dataset.id);
            if (!ind) return;
            const fit = indicatorFit(ind, spec);
            if (fit === 'hide') {
                el.classList.add('hidden-for-car');
            } else if (fit === 'mark') {
                el.classList.add('relevant');
                const b = document.createElement('span');
                b.className = 'rel-badge';
                b.textContent = 'ваш авто';
                el.appendChild(b);
            }
        });
    }

    /* ---------- Автоматический переход на первый релевантный раздел ---------- */
    function focusCarContent() {
        // прокручиваем к блоку «Мой автомобиль» и подсвечиваем вкладку «Индикаторы»
        const box = $('#myCar');
        if (box && !box.hidden) {
            setTimeout(() => box.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
        }
        markIndicators();
    }

    /* =====================================================
       ЗАПРАВКИ — Яндекс.Карты
       ===================================================== */
    const FUEL_QUERIES = [
        { id: 'АЗС', icon: '⛽', name: 'АЗС', sub: 'бензин, дизель, все сети' },
        { id: 'АГНПС', icon: '🔥', name: 'АЗС с газом', sub: 'метан, пропан (АГНПС)' },
        { id: 'зарядная станция', icon: '⚡', name: 'Зарядные станции', sub: 'для электромобилей' },
        { id: 'шиномонтаж', icon: '🛞', name: 'Шиномонтаж', sub: 'смена шин, ремонт дисков' },
        { id: 'магазин автозапчастей', icon: '🔧', name: 'Автозапчасти', sub: 'магазины рядом' },
        { id: 'автомойка', icon: '🚿', name: 'Автомойки', sub: 'мойка и химчистка' },
        { id: 'технический осмотр', icon: '📋', name: 'Техосмотр', sub: 'пункты ТО' },
        { id: 'эвакуатор', icon: '🚛', name: 'Эвакуатор', sub: 'круглосуточно' }
    ];

    function ymapsUrl(text, ll, z) {
        const l = ll ? `ll=${ll.lon.toFixed(6)},${ll.lat.toFixed(6)}&z=${z || 14}` : '';
        return `https://yandex.ru/maps/?${l ? l + '&' : ''}text=${encodeURIComponent(text)}`;
    }

    function renderFuelCards() {
        const q = $('#fuelTypes .ft-chip.active')?.dataset.type || 'АЗС';
        const ll = { lat: GEO.lat, lon: GEO.lon };
        const cur = FUEL_QUERIES.find(f => f.id === q) || FUEL_QUERIES[0];

        // Главная кнопка — открыть выбранное на карте
        const main = $('#fuelMain');
        if (main) {
            main.href = ymapsUrl(cur.id, ll);
            $('#fuelMainIcon').textContent = cur.icon;
            $('#fuelMainName').textContent = cur.name + ' рядом';
            $('#fuelMainSub').textContent = `Яндекс.Карты · ${GEO.city} · построить маршрут`;
        }

        // Остальные варианты
        const others = FUEL_QUERIES.filter(f => f.id !== q);
        $('#fuelCards').innerHTML = others.map(f => `
            <a class="fuel-card" href="${ymapsUrl(f.id, ll)}" target="_blank" rel="noopener">
                <div class="fc-logo">${f.icon}</div>
                <div>
                    <div class="fc-name">${esc(f.name)}</div>
                    <div class="fc-sub">${esc(f.sub)}</div>
                </div>
                <div class="fc-arrow">›</div>
            </a>`).join('');
    }

    function updateFuelHint() {
        $('#fuelHint').innerHTML =
            `Ищем рядом с городом <b>${esc(GEO.city)}</b> (${esc(GEO.source)}). Нажмите на карточку ниже — откроются Яндекс.Карты с этим объектом и маршрутом.`;
    }

    /* =====================================================
       ИНСТРУКЦИЯ — GOOGLE DRIVE
       ===================================================== */
    function updateDriveModel() {
        const st = window.AppState || {};
        const state = st;
        const box = $('#driveModel');
        if (!state.brand || !state.model) {
            box.innerHTML = 'Выберите автомобиль — подскажем, какое руководство искать в папке.';
            return;
        }
        const spec = getSpec();
        const b = state.brand;
        box.innerHTML = `
            <b>Ищите в папке руководство для ${esc(b.name)} ${esc(state.model)}</b><br>
            ${esc(spec.fuelName)} · ${esc(spec.driveName)} · масло ${esc(spec.oil)}<br>
            <a href="${b.manuals || b.site}" target="_blank" rel="noopener">→ Раздел руководств на сайте ${esc(b.name)}</a>
        `;
    }

    /* =====================================================
     ИНТЕГРАЦИЯ С app.js (состояние выбора авто)
     ===================================================== */
    function hookCarSelection() {
        // Основной источник — хук из app.js
        window.onCarChange = function (st) {
            window.__pendingSync = true;
            setTimeout(syncCar, 0);
        };
        window.onIndicatorsRendered = function () {
            markIndicators();
        };
    }

    function syncCar() {
        const st = window.AppState || {};
        const brand = st.brand;
        const model = st.model;
        const year = st.year;

        renderMyCar();
        updateDrawerCar();
        updateDriveModel();
        markIndicators();

        if (brand && model) {
            const spec = getSpec();
            const kmSel = document.querySelector('#osagoKM');
            if (kmSel && spec) {
                const hp = spec.hp || 130;
                let best = 0;
                for (let i = 0; i < INSURANCE.km.length; i++) {
                    const lim = parseFloat(INSURANCE.km[i].label.replace(/[^\d.]/g, '')) || 0;
                    if (hp > lim) best = i;
                }
                kmSel.value = String(INSURANCE.km[best].v);
                kmSel.dispatchEvent(new Event('change'));
            }
            updateFluidHint(spec);
        } else {
            updateFluidHint(null);
        }
    }

    function updateFluidHint(spec) {
        const box = document.querySelector('#psCardNote');
        if (!box) return;
        if (!spec) {
            box.innerHTML = '<b>Где:</b> бачок с маркировкой «Power Steering». У большинства современных моделей электроусилитель.';
            return;
        }
        box.innerHTML = spec.eps
            ? '<b>У вашего автомобиля электроусилитель (EPS)</b> — жидкость гидроусилителя не нужна, доливать нечего.'
            : '<b>У вашего автомобиля гидроусилитель</b> — проверяйте уровень в бачке «Power Steering».';
    }

    /* =====================================================
       INIT
       ===================================================== */
    document.addEventListener('DOMContentLoaded', () => {
        // Зеркалим состояние выбора авто из app.js
        const origRender = window.renderIndicators;

        buildDrawer();

        $('#menuToggle').addEventListener('click', openDrawer);
        $('#drawerClose').addEventListener('click', closeDrawer);
        $('#drawerBackdrop').addEventListener('click', closeDrawer);
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && !$('#drawer').hidden) closeDrawer();
        });

        hookCarSelection();

        // Города
        const citySel = $('#fuelCity');
        CAR_SPECS.cities.forEach(c => {
            const o = document.createElement('option');
            o.value = c;
            o.textContent = c;
            citySel.appendChild(o);
        });
        citySel.value = 'Челябинск';
        citySel.addEventListener('change', e => {
            setCity(e.target.value);
            updateFuelHint();
            renderFuelCards();
        });

        // Фильтр типов объектов
        $$('#fuelTypes .ft-chip').forEach(c => {
            c.addEventListener('click', () => {
                $$('#fuelTypes .ft-chip').forEach(x => x.classList.remove('active'));
                c.classList.add('active');
                renderFuelCards();
            });
        });

        // Кнопка геолокации
        $('#fuelGeo').addEventListener('click', async () => {
            const btn = $('#fuelGeo');
            const old = btn.textContent;
            btn.textContent = '⏳ Определяю...';
            btn.disabled = true;
            const ok = await detectGeo();
            btn.textContent = ok ? '📍 Обновить местоположение' : '⚠️ Не удалось определить';
            btn.disabled = false;
            if (ok) {
                citySel.value = CAR_SPECS.cities.includes(GEO.city) ? GEO.city : 'Челябинск';
                updateFuelHint();
                renderFuelCards();
                toast(`Местоположение определено: ${GEO.city}`);
            } else {
                toast('Не удалось определить геолокацию — выберите город вручную', 'warn');
            }
        });

        updateFuelHint();
        renderFuelCards();
        updateDriveModel();
        updateDrawerCar();
    });
})();
