/* === АвтоПомощник — модуль страхования (ОСАГО/КАСКО) и поиск АЗС/зарядок === */

(function () {
    'use strict';

    const $ = (s, c) => (c || document).querySelector(s);
    const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const CHELYABINSK = { name: 'Челябинск', lat: 55.1644, lon: 61.4368 };
    let geo = { ...CHELYABINSK };

    /* =====================================================
       ОСАГО
       ===================================================== */
    function kvsValue(ageIdx, stazhIdx) {
        const row = INSURANCE.kvs[ageIdx];
        if (!row) return 1;
        return row.v[Math.min(stazhIdx, row.v.length - 1)];
    }

    function initOsago() {
        const kt = $('#osagoKT');
        INSURANCE.kt.forEach((r, i) => {
            const o = document.createElement('option');
            o.value = i;
            o.textContent = `${r.region} — ${r.kt.toFixed(2).replace('.', ',')}`;
            kt.appendChild(o);
        });
        // По умолчанию — Челябинск
        const chiIdx = INSURANCE.kt.findIndex(r => r.region === 'Челябинск');
        kt.value = chiIdx >= 0 ? chiIdx : 0;

        const kbm = $('#osagoKBM');
        INSURANCE.kbm.forEach(k => {
            const o = document.createElement('option');
            o.value = k.v;
            o.textContent = `Класс ${k.cls} — ${k.v.toFixed(2).replace('.', ',')}${k.hint ? ' (' + k.hint + ')' : ''}`;
            kbm.appendChild(o);
        });
        // Стартовый класс 3 для новых водителей
        kbm.value = '1.17';

        const age = $('#osagoAge');
        INSURANCE.kvs.forEach((a, i) => {
            const o = document.createElement('option');
            o.value = i;
            o.textContent = a.age + ' лет';
            age.appendChild(o);
        });
        age.value = '3'; // 30–34

        const stazh = $('#osagoStazh');
        INSURANCE.kvsStazh.forEach((s, i) => {
            const o = document.createElement('option');
            o.value = i;
            o.textContent = s;
            stazh.appendChild(o);
        });
        stazh.value = '8'; // более 8 лет

        const km = $('#osagoKM');
        INSURANCE.km.forEach(k => {
            const o = document.createElement('option');
            o.value = k.v;
            o.textContent = k.label;
            km.appendChild(o);
        });
        km.value = '1.2';

        const ko = $('#osagoKO');
        INSURANCE.ko.forEach((k, i) => {
            const o = document.createElement('option');
            o.value = k.v;
            o.textContent = k.label;
            ko.appendChild(o);
        });
        ko.value = '1';

        const ks = $('#osagoKS');
        INSURANCE.ks.forEach((k, i) => {
            const o = document.createElement('option');
            o.value = k.v;
            o.textContent = k.label;
            ks.appendChild(o);
        });
        ks.value = '1';

        ['#osagoTB', '#osagoKT', '#osagoKBM', '#osagoAge', '#osagoStazh', '#osagoKM', '#osagoKO', '#osagoKS']
            .forEach(sel => {
                const el = $(sel);
                el.addEventListener('change', calcOsago);
                el.addEventListener('input', calcOsago);
            });

        calcOsago();
    }

    function calcOsago() {
        const tb = parseFloat($('#osagoTB').value) || INSURANCE.tbDefault;
        const kt = INSURANCE.kt[parseInt($('#osagoKT').value)] || INSURANCE.kt[0];
        const kbm = parseFloat($('#osagoKBM').value) || 1;
        const kvs = kvsValue(parseInt($('#osagoAge').value), parseInt($('#osagoStazh').value));
        const km = parseFloat($('#osagoKM').value) || 1;
        const ko = parseFloat($('#osagoKO').value) || 1;
        const ks = parseFloat($('#osagoKS').value) || 1;

        const price = tb * kt.kt * kbm * kvs * ko * km * ks;
        const min = INSURANCE.tbMin * kt.kt * kbm * kvs * ko * km * ks;
        const max = INSURANCE.tbMax * kt.kt * kbm * kvs * ko * km * ks;

        const fmt = n => Math.round(n).toLocaleString('ru-RU');
        const d = n => n.toFixed(2).replace('.', ',');

        $('#osagoResult').innerHTML = `
            <div class="or-price">${fmt(price)} ₽</div>
            <div class="or-sub">Предварительная стоимость годового полиса ОСАГО</div>
            <div class="or-formula">
                ТБ <b>${fmt(tb)}</b> × КТ <b>${d(kt.kt)}</b> × КБМ <b>${d(kbm)}</b> × КВС <b>${d(kvs)}</b>
                × КО <b>${d(ko)}</b> × КМ <b>${d(km)}</b> × КС <b>${d(ks)}</b> = <b>${fmt(price)} ₽</b>
            </div>
            <div class="or-range">Коридор по базовому тарифу: ${fmt(min)} – ${fmt(max)} ₽</div>
        `;
    }

    /* =====================================================
       КАСКО (ориентировочно)
       ===================================================== */
    function initKasko() {
        const age = $('#kaskoAge');
        Object.entries(INSURANCE.kaskoAge).forEach(([k, v]) => {
            const o = document.createElement('option');
            o.value = k;
            o.textContent = v.label;
            age.appendChild(o);
        });
        age.value = 'used1';

        const type = $('#kaskoType');
        INSURANCE.kaskoTypes.forEach(t => {
            const o = document.createElement('option');
            o.value = t.id;
            o.textContent = t.name;
            type.appendChild(o);
        });
        type.value = 'tpl';

        ['#kaskoPrice', '#kaskoAge', '#kaskoType'].forEach(sel => {
            $(sel).addEventListener('input', calcKasko);
            $(sel).addEventListener('change', calcKasko);
        });

        calcKasko();
    }

    function calcKasko() {
        const price = parseInt($('#kaskoPrice').value) || 0;
        const ageKey = $('#kaskoAge').value;
        const typeId = $('#kaskoType').value;
        const factor = INSURANCE.kaskoAge[ageKey].factor;
        const rate = INSURANCE.kaskoBase[ageKey][typeId];
        const year = Math.round(price * rate / 100);
        const typeName = INSURANCE.kaskoTypes.find(t => t.id === typeId).name;

        $('#kaskoResult').innerHTML = `
            <div class="or-price" style="font-size:28px">≈ ${year.toLocaleString('ru-RU')} ₽ <span style="font-size:15px;opacity:.8">/ год</span></div>
            <div class="or-sub">${esc(typeName)} · ${esc(INSURANCE.kaskoAge[ageKey].label)}</div>
            <div class="or-formula">
                ${price.toLocaleString('ru-RU')} ₽ × <b>${rate.toFixed(1).replace('.', ',')}%</b> (${esc(typeName)}) × <b>${factor.toFixed(2).replace('.', ',')}</b> (возраст авто) ≈ <b>${year.toLocaleString('ru-RU')} ₽</b>
            </div>
            <div class="or-range">⚠️ Это ориентир по рынку, а не оферта. Точную цену считает страховая компания с учётом износа, региона и истории.</div>
        `;
    }

    /* =====================================================
       СТРАХОВЩИКИ
       ===================================================== */
    function renderInsurers() {
        const html = INSURANCE.insurers.map(i => `
            <a class="insurer-card" href="${i.site}" target="_blank" rel="noopener">
                <div class="ic-logo">🏢</div>
                <div class="ic-body">
                    <div class="ic-name">${esc(i.name)}</div>
                    <div class="ic-tags">
                        ${i.osago ? '<span class="ic-tag osago">ОСАГО</span>' : ''}
                        ${i.kasko ? '<span class="ic-tag kasko">КАСКО</span>' : ''}
                    </div>
                </div>
                <div class="ic-phone">${esc(i.phone)}</div>
            </a>
        `).join('');
        $('#insurerList').innerHTML = html;
        $('#kaskoLinks').innerHTML = html;
    }

    function renderComm() {
        $('#commNote').innerHTML = esc(INSURANCE.commissioners.note);
        $('#commRSA').innerHTML = INSURANCE.commissioners.rsa.map(c => `
            <a class="em-item" href="tel:${c.num.replace(/[^\d+]/g, '')}">
                <div class="em-icon">${c.icon}</div>
                <div class="em-body">
                    <div class="em-name">${esc(c.name)}</div>
                    <div class="em-desc">${esc(c.desc)}</div>
                </div>
                <div class="em-num">${esc(c.num)}</div>
            </a>
        `).join('');
        $('#commLocal').innerHTML = INSURANCE.commissioners.local.map(c => {
            const isPhone = /^\+?[\d\s\-()]+$/.test(c.num);
            const numHtml = isPhone
                ? `<a class="em-num" href="tel:${c.num.replace(/[^\d+]/g, '')}">${esc(c.num)}</a>`
                : `<div class="em-num">${esc(c.num)}</div>`;
            const siteHtml = c.site
                ? `<a class="em-site" href="${c.site}" target="_blank" rel="noopener">сайт →</a>`
                : '';
            const freeBadge = c.free ? '<span class="em-free">бесплатно по договору</span>' : '';
            return `
            <div class="em-item em-item-col">
                <div class="em-icon">${c.icon}</div>
                <div class="em-body">
                    <div class="em-name">${esc(c.name)} ${freeBadge}</div>
                    <div class="em-desc">${esc(c.desc)}</div>
                    ${siteHtml}
                </div>
                ${numHtml}
            </div>`;
        }).join('');
        $('#insServices').innerHTML = INSURANCE.services.map(s => `
            <a class="doc-item" href="${s.url}" target="_blank" rel="noopener">
                <div class="doc-icon">${s.icon}</div>
                <div>
                    <div class="doc-name">${esc(s.name)}</div>
                    <div class="doc-desc">${esc(s.desc)}</div>
                </div>
            </a>
        `).join('');
    }

    function showToast(msg, type) {
        const t = $('#toast');
        if (!t) return;
        t.textContent = msg;
        t.style.background = type === 'warn' ? '#dc2626' : '';
        t.hidden = false;
        clearTimeout(t._tid);
        t._tid = setTimeout(() => t.hidden = true, 2600);
    }

    /* =====================================================
       INIT
       ===================================================== */
    document.addEventListener('DOMContentLoaded', () => {
        initOsago();
        initKasko();
        renderInsurers();
        renderComm();

        // Под-вкладки страхования
        $$('.ins-tab').forEach(t => {
            t.addEventListener('click', () => {
                $$('.ins-tab').forEach(x => x.classList.remove('active'));
                t.classList.add('active');
                $$('.ins-block').forEach(b => b.classList.toggle('hidden', b.id !== 'ins-' + t.dataset.ins));
            });
        });

        // Нижняя панель — SOS прокручивает к разделу экстренных служб
        $('#bbHelp').addEventListener('click', e => {
            e.preventDefault();
            const tab = document.querySelector('.tab[data-target="emergency"]');
            if (tab) tab.click();
        });
    });
})();
