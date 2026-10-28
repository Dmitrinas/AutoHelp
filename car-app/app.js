/* === АвтоПомощник — основной клиентский код === */

(function () {
    'use strict';

    // ===== STATE =====
    const state = {
        brand: null,
        model: null,
        year: null,
        currentTab: 'indicators',
        indicatorFilter: 'all'
    };
    // Доступ из других модулей (personalize.js)
    window.AppState = state;

    // ===== DOM =====
    const $ = (sel, ctx) => (ctx || document).querySelector(sel);
    const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

    // ===== INIT =====
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        populateBrands();
        bindEvents();
        renderIndicators();
        renderBrandLinks();
        renderBrandGuide();
        // Try to auto-load manuals from default folder
        tryLoadManuals();
    }

    // ===== BRANDS & MODELS =====
    function populateBrands() {
        const brandSel = $('#brandSelect');
        APP_DATA.brands.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.id;
            opt.textContent = b.name;
            opt.dataset.site = b.site;
            brandSel.appendChild(opt);
        });

        const yearSel = $('#yearSelect');
        APP_DATA.years.forEach(y => {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            yearSel.appendChild(opt);
        });
    }

    function onBrandChange(e) {
        const brandId = e.target.value;
        const modelSel = $('#modelSelect');
        const yearSel = $('#yearSelect');
        state.brand = APP_DATA.brands.find(b => b.id === brandId) || null;

        modelSel.innerHTML = '';
        if (!state.brand) {
            modelSel.disabled = true;
            modelSel.innerHTML = '<option value="">— Сначала выберите марку —</option>';
            yearSel.disabled = true;
            return;
        }

        modelSel.disabled = false;
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = `— Выберите модель (${state.brand.models.length}) —`;
        modelSel.appendChild(placeholder);

        state.brand.models.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m;
            modelSel.appendChild(opt);
        });

        yearSel.disabled = false;
    }

    function onModelChange(e) {
        state.model = e.target.value;
        updateCarCard();
    }

    function onYearChange(e) {
        state.year = e.target.value;
        updateCarCard();
    }

    function updateCarCard() {
        const card = $('#carCard');
        if (!state.brand || !state.model) {
            card.hidden = true;
            renderBrandGuide();
            return;
        }
        card.hidden = false;
        $('#carName').textContent = `${state.brand.name} ${state.model}`;
        $('#carMeta').textContent = state.year
            ? `${state.brand.name} · ${state.brand.country} · ${state.year} г.в.`
            : `${state.brand.name} · ${state.brand.country}`;
        renderBrandGuide();
        notifyCarChange();
    }

    function resetCar() {
        state.brand = null;
        state.model = null;
        state.year = null;
        $('#brandSelect').value = '';
        $('#modelSelect').disabled = true;
        $('#modelSelect').innerHTML = '<option value="">— Сначала выберите марку —</option>';
        $('#yearSelect').value = '';
        $('#carCard').hidden = true;
        renderBrandGuide();
        notifyCarChange();
    }

    // Уведомляем модуль персонализации
    function notifyCarChange() {
        if (typeof window.onCarChange === 'function') {
            try { window.onCarChange(state); } catch (e) { console.warn(e); }
        }
    }

    // ===== TABS =====
    function bindEvents() {
        $('#brandSelect').addEventListener('change', onBrandChange);
        $('#modelSelect').addEventListener('change', onModelChange);
        $('#yearSelect').addEventListener('change', onYearChange);
        $('#changeCar').addEventListener('click', resetCar);

        $$('.tab').forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.target));
        });

        $$('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                $$('.chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                state.indicatorFilter = chip.dataset.color;
                renderIndicators();
            });
        });

        const manualSearch = $('#manualSearch');
        if (manualSearch) manualSearch.addEventListener('input', debounce(filterManuals, 200));

        $$('#indicatorModal [data-close]').forEach(el => {
            el.addEventListener('click', closeModal);
        });

        // ESC closes modal
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeModal();
        });
    }

    function switchTab(target) {
        state.currentTab = target;
        $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.target === target));
        $$('.panel').forEach(p => {
            const id = 'panel-' + target;
            p.classList.toggle('hidden', p.id !== id);
        });
        // Scroll to top of panel
        const panel = $('#panel-' + target);
        if (panel) {
            panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // ===== INDICATORS =====
    function renderIndicators() {
        const list = $('#indicatorList');
        const filter = state.indicatorFilter;
        const items = APP_DATA.indicators.filter(i => filter === 'all' || i.color === filter);

        if (items.length === 0) {
            list.innerHTML = '<p class="alert alert-info">Нет индикаторов в этой категории.</p>';
            return;
        }

        list.innerHTML = items.map((ind, i) => `
            <button class="indicator-item ${ind.color}" data-id="${ind.id}" style="animation: pop 0.3s ease ${i * 0.02}s backwards">
                <div class="icon-wrap">${ind.svg}</div>
                <div class="title">${escapeHtml(ind.title)}</div>
            </button>
        `).join('');

        $$('.indicator-item', list).forEach(el => {
            el.addEventListener('click', () => {
                const ind = APP_DATA.indicators.find(x => x.id === el.dataset.id);
                if (ind) openModal(ind);
            });
        });

        if (typeof window.onIndicatorsRendered === 'function') {
            try { window.onIndicatorsRendered(); } catch (e) { console.warn(e); }
        }
    }

    function openModal(ind) {
        const colorMap = {
            red: 'Критическая неисправность',
            yellow: 'Предупреждение',
            green: 'Информация',
            blue: 'Информация',
            gray: 'Система не активна'
        };
        const bgMap = {
            red: '#ffebee', yellow: '#fffde7', green: '#e8f5e9', blue: '#e3f2fd', gray: '#f5f5f5'
        };
        const txtMap = {
            red: '#e53935', yellow: '#fbc02d', green: '#43a047', blue: '#1e88e5', gray: '#757575'
        };

        $('#modalBody').innerHTML = `
            <div class="modal-icon" style="background:${bgMap[ind.color]}; color:${txtMap[ind.color]}">
                ${ind.svg}
            </div>
            <h3>${escapeHtml(ind.title)}</h3>
            <div style="display:inline-block; padding:4px 12px; border-radius:999px; background:${bgMap[ind.color]}; color:${txtMap[ind.color]}; font-size:12px; font-weight:600; margin-bottom:12px;">
                ${colorMap[ind.color]}
            </div>
            <div class="modal-text">${ind.body}</div>
        `;
        $('#indicatorModal').hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        $('#indicatorModal').hidden = true;
        document.body.style.overflow = '';
    }

    // ===== BRAND LINKS =====
    function renderBrandLinks() {
        const wrap = $('#brandLinks');
        wrap.innerHTML = APP_DATA.brands.map(b => `
            <a class="brand-link" href="${b.site}" target="_blank" rel="noopener" title="${escapeHtml(b.note || '')}">
                <span>🏭</span>
                <span style="flex:1">${escapeHtml(b.name)}</span>
                ${b.note ? '<span title="Ссылка заменена">⚠️</span>' : ''}
            </a>
        `).join('');
    }

    // ===== BRAND GUIDE (для выбранного авто) =====
    function renderBrandGuide() {
        const wrap = $('#brandGuide');
        if (!state.brand) {
            wrap.innerHTML = '<p class="alert alert-info">Выберите марку автомобиля — здесь появятся прямые ссылки на сайт производителя и раздел с руководством по эксплуатации.</p>';
            return;
        }
        const b = state.brand;
        const man = b.manuals || b.site;
        wrap.innerHTML = `
            <div class="advice-item">
                <div class="ai-icon">🏭</div>
                <div style="flex:1">
                    <h4>${escapeHtml(b.name)}${state.model ? ' ' + escapeHtml(state.model) : ''}</h4>
                    ${b.note ? `<p style="color:#b45309">${escapeHtml(b.note)}</p>` : '<p>Официальный сайт производителя на русском языке.</p>'}
                    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
                        <a class="btn btn-secondary" href="${b.site}" target="_blank" rel="noopener">🌐 Сайт ${escapeHtml(b.name)}</a>
                        <a class="btn btn-primary" href="${man}" target="_blank" rel="noopener">📖 Руководство по эксплуатации</a>
                    </div>
                </div>
            </div>
        `;
    }

    // ===== MANUALS =====
    async function tryLoadManuals() {
        // Try to load a manifest.json from a few likely folders
        const candidates = ['manuals'];
        for (const folder of candidates) {
            try {
                const r = await fetch(`${folder}/manifest.json`);
                if (r.ok) {
                    $('#manualFolder').value = folder;
                    const data = await r.json();
                    renderManuals(data);
                    showToast(`Загружено ${data.length} инструкций из ${folder}/`);
                    return;
                }
            } catch (e) {
                // ignore
            }
        }
    }

    async function loadManuals() {
        const folderEl = $('#manualFolder');
        const folder = folderEl ? (folderEl.value.trim() || 'manuals') : 'manuals';
        const results = $('#manualResults');
        results.innerHTML = '<p class="alert alert-info">🔄 Загружаю…</p>';

        // 1) Try manifest
        try {
            const r = await fetch(`${folder}/manifest.json`);
            if (r.ok) {
                const data = await r.json();
                if (Array.isArray(data) && data.length) {
                    renderManuals(data);
                    showToast(`Найдено ${data.length} инструкций в ${folder}/`);
                    return;
                }
            }
        } catch (e) { /* fallthrough */ }

        // 2) Try directory listing (some servers return JSON)
        try {
            const r = await fetch(`${folder}/`);
            const ct = r.headers.get('content-type') || '';
            if (ct.includes('json')) {
                const data = await r.json();
                const pdfs = (Array.isArray(data) ? data : [])
                    .filter(f => /\.pdf$/i.test(f.name || f))
                    .map(f => ({ name: f.name || f, url: `${folder}/${f.name || f}` }));
                if (pdfs.length) {
                    renderManuals(pdfs);
                    showToast(`Найдено ${pdfs.length} PDF в ${folder}/`);
                    return;
                }
            }
        } catch (e) { /* fallthrough */ }

        // 3) Fallback: tell user no PDF found, show link to manufacturer site
        results.innerHTML = `
            <div class="alert alert-warn">
                <strong>📁 Папка «${escapeHtml(folder)}» не найдена или пуста.</strong><br>
                Положите PDF-файлы инструкций в папку <code>${escapeHtml(folder)}</code> на сервере
                и создайте в ней файл <code>manifest.json</code> со списком:
                <pre style="background:#1e293b; color:#e2e8f0; padding:10px; border-radius:8px; overflow:auto; font-size:12px; margin-top:8px;">[
  { "name": "Kia Rio 2020.pdf", "url": "manuals/kia-rio-2020.pdf" },
  { "name": "Hyundai Solaris.pdf", "url": "manuals/hyundai-solaris.pdf" }
]</pre>
                Пока — открываем сайт производителя:
            </div>
        `;
        showToast('Инструкции в PDF не найдены', 'warn');
    }

    function renderManuals(items) {
        const results = $('#manualResults');
        if (!results) return;
        if (!items.length) {
            results.innerHTML = '<p class="alert alert-info">Файлы не найдены.</p>';
            return;
        }
        results.innerHTML = items.map(it => `
            <a class="manual-item" href="${it.url}" target="_blank" rel="noopener">
                <div class="pdf-icon">📄</div>
                <div class="pdf-name">${escapeHtml(it.name)}</div>
            </a>
        `).join('');
    }

    function filterManuals() {
        const input = $('#manualSearch');
        if (!input) return;
        const q = input.value.trim().toLowerCase();
        $$('#manualResults .manual-item').forEach(el => {
            const txt = el.textContent.toLowerCase();
            el.style.display = !q || txt.includes(q) ? '' : 'none';
        });
    }

    // ===== YANDEX ROUTE =====
    function openYandexRoute() {
        // yandex maps builds a route from current location to "Челябинск, ул. Братская, 2А"
        const url = 'https://yandex.ru/maps/?rtext=~' + encodeURIComponent('Челябинск, ул. Братская, 2А');
        window.open(url, '_blank', 'noopener');
    }

    // ===== HELPERS =====
    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function debounce(fn, ms) {
        let t;
        return function (...args) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), ms);
        };
    }

    function showToast(msg, type) {
        const t = $('#toast');
        t.textContent = msg;
        t.style.background = type === 'warn' ? '#dc2626' : '';
        t.hidden = false;
        clearTimeout(t._tid);
        t._tid = setTimeout(() => t.hidden = true, 2400);
    }
})();