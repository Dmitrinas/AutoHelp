/* === АвтоПомощник — спецификации моделей для персонализации === */
/* fuel: petrol | diesel | hybrid | ev
   drive: fwd | rwd | awd
   eps: true — электроусилитель (жидкости ГУР нет)
   oil: рекомендованная вязкость
   hp: типичная мощность, л.с. (для коэффициента КМ)            */

const CAR_SPECS = {

    /* ---------- Значения по умолчанию для марок ---------- */
    defaults: {
        kia:       { fuel: 'petrol', drive: 'fwd', eps: true,  oil: '5W-30', hp: 130 },
        hyundai:   { fuel: 'petrol', drive: 'fwd', eps: true,  oil: '5W-30', hp: 130 },
        lada:      { fuel: 'petrol', drive: 'fwd', eps: false, oil: '5W-30', hp: 90 },
        renault:   { fuel: 'petrol', drive: 'fwd', eps: true,  oil: '5W-40', hp: 100 },
        vw:        { fuel: 'petrol', drive: 'fwd', eps: true,  oil: '5W-30', hp: 130 },
        skoda:     { fuel: 'petrol', drive: 'fwd', eps: true,  oil: '5W-30', hp: 150 },
        toyota:    { fuel: 'petrol', drive: 'fwd', eps: true,  oil: '5W-30', hp: 140 },
        honda:     { fuel: 'petrol', drive: 'fwd', eps: true,  oil: '0W-20', hp: 130 },
        mazda:     { fuel: 'petrol', drive: 'fwd', eps: true,  oil: '0W-20', hp: 130 },
        nissan:    { fuel: 'petrol', drive: 'fwd', eps: true,  oil: '5W-30', hp: 120 },
        mitsubishi:{ fuel: 'petrol', drive: 'fwd', eps: true,  oil: '5W-30', hp: 150 },
        subaru:    { fuel: 'petrol', drive: 'awd', eps: true,  oil: '0W-20', hp: 150 },
        suzuki:    { fuel: 'petrol', drive: 'fwd', eps: false, oil: '5W-30', hp: 100 },
        geely:     { fuel: 'petrol', drive: 'fwd', eps: true,  oil: '5W-30', hp: 150 },
        chery:     { fuel: 'petrol', drive: 'fwd', eps: true,  oil: '5W-30', hp: 150 },
        haval:     { fuel: 'petrol', drive: 'awd', eps: true,  oil: '5W-30', hp: 190 },
        changan:   { fuel: 'petrol', drive: 'fwd', eps: true,  oil: '5W-30', hp: 150 },
        uaz:       { fuel: 'petrol', drive: 'awd', eps: false, oil: '5W-40', hp: 150 },
        gaz:       { fuel: 'petrol', drive: 'rwd', eps: false, oil: '5W-40', hp: 100 },
        ford:      { fuel: 'petrol', drive: 'fwd', eps: true,  oil: '5W-30', hp: 130 },
        chevrolet: { fuel: 'petrol', drive: 'fwd', eps: true,  oil: '5W-30', hp: 130 },
        bmw:       { fuel: 'petrol', drive: 'rwd', eps: true,  oil: '5W-30', hp: 180 },
        mercedes:  { fuel: 'petrol', drive: 'rwd', eps: true,  oil: '5W-30', hp: 190 },
        audi:      { fuel: 'petrol', drive: 'fwd', eps: true,  oil: '5W-30', hp: 180 },
        lexus:     { fuel: 'petrol', drive: 'rwd', eps: true,  oil: '0W-20', hp: 200 }
    },

    /* ---------- Индивидуальные особенности моделей ---------- */
    models: {
        /* ДИЗЕЛЬ */
        'vw:Polo':        { fuel: 'diesel' }, 'vw:Passat': { fuel: 'diesel' }, 'vw:Tiguan': { fuel: 'diesel' },
        'vw:Jetta':       { fuel: 'diesel' }, 'vw:Passat B8': { fuel: 'diesel' },
        'renault:Logan':  { fuel: 'diesel' }, 'renault:Duster': { fuel: 'diesel' },
        'renault:Sandero':{ fuel: 'diesel' }, 'renault:Kaptur': { fuel: 'diesel' },
        'renault:Arkana': { fuel: 'diesel' }, 'renault:Koleos': { fuel: 'diesel' },
        'skoda:Octavia':  { fuel: 'diesel' }, 'skoda:Superb': { fuel: 'diesel' },
        'skoda:Kodiaq':   { fuel: 'diesel' }, 'skoda:Rapid':  { fuel: 'diesel' },
        'hyundai:Tucson': { fuel: 'diesel' }, 'hyundai:Santa Fe': { fuel: 'diesel' },
        'kia:Sportage':   { fuel: 'diesel' }, 'kia:Sorento': { fuel: 'diesel' },
        'mazda:CX-5':     { fuel: 'diesel' }, 'mazda:CX-9':  { fuel: 'diesel' },
        'nissan:X-Trail': { fuel: 'diesel' }, 'nissan:Terrain': { fuel: 'diesel' },
        'mitsubishi:Pajero': { fuel: 'diesel' }, 'mitsubishi:Pajero Sport': { fuel: 'diesel' },
        'mitsubishi:Outlander': { fuel: 'diesel' }, 'mitsubishi:ASX': { fuel: 'diesel' },
        'toyota:HiLux':   { fuel: 'diesel' }, 'toyota:Fortuner': { fuel: 'diesel' },
        'toyota:Land Cruiser': { fuel: 'diesel' }, 'toyota:Prado': { fuel: 'diesel' },
        'ford:Focus':     { fuel: 'diesel' }, 'ford:Transit': { fuel: 'diesel' },
        'uaz:Буханка':    { fuel: 'diesel' }, 'uaz:Profi':  { fuel: 'diesel' },
        'uaz:Pickup':     { fuel: 'diesel' },
        'changan:CS75':   { fuel: 'diesel' }, 'changan:CS35': { fuel: 'diesel' },
        'changan:Uni-K':  { fuel: 'diesel' },

        /* ПОЛНЫЙ ПРИВОД / ВЫСОКИЙ КЛИРЕНС */
        'lada:Niva':           { drive: 'awd' }, 'lada:Niva Travel': { drive: 'awd' },
        'lada:4x4':            { drive: 'awd' }, 'lada:Largus': { drive: 'fwd' },
        'uaz:Hunter':          { drive: 'awd' }, 'uaz:Patriot': { drive: 'awd' },
        'suzuki:Jimny':        { drive: 'awd' }, 'suzuki:Grand Vitara': { drive: 'awd' },
        'suzuki:Vitara':       { drive: 'awd' }, 'suzuki:S-Cross': { drive: 'awd' },
        'suzuki:Across':       { drive: 'awd' },
        'mitsubishi:Pajero':   { drive: 'awd' }, 'mitsubishi:Pajero Sport': { drive: 'awd' },
        'mitsubishi:Outlander':{ drive: 'awd' }, 'mitsubishi:ASX': { drive: 'awd' },
        'mitsubishi:Lancer':   { drive: 'fwd' },
        'toyota:RAV4':         { drive: 'awd' }, 'toyota:Highlander': { drive: 'awd' },
        'toyota:Land Cruiser': { drive: 'awd' }, 'toyota:Prado': { drive: 'awd' },
        'toyota:Fortuner':     { drive: 'awd' }, 'toyota:HiLux': { drive: 'awd' },
        'subaru:Forester':     { drive: 'awd' }, 'subaru:Outback': { drive: 'awd' },
        'subaru:XV':           { drive: 'awd' }, 'subaru:Impreza': { drive: 'awd' },
        'subaru:WRX':          { drive: 'awd' }, 'subaru:Legacy': { drive: 'awd' },
        'subaru:Tribeca':      { drive: 'awd' },
        'haval:F7':            { drive: 'awd' }, 'haval:F7x': { drive: 'awd' },
        'haval:Dargo':         { drive: 'awd' }, 'haval:H9': { drive: 'awd' },
        'haval:Jolion':        { drive: 'fwd' }, 'haval:M6': { drive: 'fwd' },
        'chery:Tiggo 8':       { drive: 'awd' }, 'chery:Tiggo 8 Pro': { drive: 'awd' },
        'chery:Tiggo 7 Pro':   { drive: 'awd' }, 'chery:Tiggo 7': { drive: 'fwd' },
        'geely:Atlas Pro':     { drive: 'awd' }, 'geely:Atlas': { drive: 'fwd' },
        'geely:Monjaro':       { drive: 'awd' },
        'nissan:Patrol':       { drive: 'awd' }, 'nissan:Terra': { drive: 'awd' },
        'nissan:X-Trail':      { drive: 'awd' }, 'nissan:Qashqai': { drive: 'fwd' },
        'vw:Tiguan':           { drive: 'awd' },
        'changan:CS75':        { drive: 'awd' }, 'changan:CS85': { drive: 'awd' },
        'changan:Uni-K':       { drive: 'awd' },
        'hyundai:Tucson':      { drive: 'awd' }, 'hyundai:Santa Fe': { drive: 'awd' },
        'kia:Sportage':        { drive: 'awd' }, 'kia:Sorento': { drive: 'awwd' },
        'mazda:CX-5':          { drive: 'awd' }, 'mazda:CX-7': { drive: 'awd' },
        'mazda:CX-9':          { drive: 'awd' },
        'lexus:LX':            { drive: 'awd' }, 'lexus:GX': { drive: 'awd' },
        'lexus:RX':            { drive: 'awd' }, 'lexus:NX': { drive: 'fwd' },
        'bmw:X5':              { drive: 'awd' }, 'bmw:X7': { drive: 'awd' },
        'bmw:X6':              { drive: 'awd' }, 'bmw:X3': { drive: 'awd' },
        'bmw:X1':              { drive: 'fwd' },
        'mercedes:GLA':        { drive: 'fwd' }, 'mercedes:GLB': { drive: 'fwd' },
        'mercedes:GLC':        { drive: 'awd' }, 'mercedes:GLE': { drive: 'awd' },
        'mercedes:GLS':        { drive: 'awd' }, 'mercedes:G-Class': { drive: 'awd' },
        'audi:Q3':             { drive: 'fwd' }, 'audi:Q5': { drive: 'awd' },
        'audi:Q7':             { drive: 'awd' }, 'audi:Q8': { drive: 'awd' },
        'audi:A3':             { drive: 'fwd' },

        /* ГИБРИДЫ */
        'toyota:Camry':     { fuel: 'hybrid' }, 'toyota:RAV4': { fuel: 'hybrid' },
        'toyota:Corolla':   { fuel: 'hybrid' }, 'toyota:C-HR': { fuel: 'hybrid' },
        'toyota:Highlander':{ fuel: 'hybrid' }, 'toyota:Avensis': { fuel: 'hybrid' },
        'lexus:ES':         { fuel: 'hybrid' }, 'lexus:UX': { fuel: 'hybrid' },
        'lexus:NX':         { fuel: 'hybrid' }, 'lexus:IS': { fuel: 'hybrid' },
        'lexus:LS':         { fuel: 'hybrid' }, 'lexus:RC': { fuel: 'hybrid' },
        'hyundai:Santa Fe': { fuel: 'hybrid' },
        'kia:Sorento':      { fuel: 'hybrid' },
        'mercedes:EQA':     { fuel: 'hybrid' },

        /* ЭЛЕКТРОМОБИЛИ */
        'bmw:i4':          { fuel: 'ev', drive: 'rwd', eps: true, oil: '0W-20', hp: 285 },
        'bmw:iX':          { fuel: 'ev', drive: 'awd', eps: true, oil: '0W-20', hp: 500 },
        'bmw:Z4':          { fuel: 'ev', drive: 'rwd' },
        'mercedes:EQS':    { fuel: 'ev', drive: 'rwd', eps: true, oil: '0W-20', hp: 450 },
        'audi:e-tron':      { fuel: 'ev', drive: 'awd', eps: true, oil: '0W-20', hp: 340 },
        'hyundai:Ioniq 5': { fuel: 'ev', drive: 'awd', eps: true, oil: '0W-20', hp: 320 },
        'kia:EV6':         { fuel: 'ev', drive: 'awd', eps: true, oil: '0W-20', hp: 320 },

        /* БЕЗ ЭЛЕКТРОУСИЛИТЕЛЯ (механика) */
        'lada:Granta':     { eps: false }, 'lada:Vesta': { eps: false },
        'lada:Largus':     { eps: false }, 'lada:XRAY': { eps: false },
        'gaz:Волга':       { eps: false }, 'gaz:Газель': { eps: false },
        'gaz:Соболь':      { eps: false }, 'gaz:NEXT': { eps: false },
        'uaz:Буханка':     { eps: false }, 'uaz:Hunter': { eps: false },
        'uaz:Patriot':     { eps: false }, 'uaz:Profi': { eps: false },
        'renault:Logan':   { eps: false }, 'renault:Sandero': { eps: false },
        'ford:Fiesta':     { eps: false }
    },

    /* ---------- Подсказки по типам привода и топлива ---------- */
    hints: {
        drive: {
            fwd: { icon: '🚗', name: 'Передний привод', text: 'Обычная переднеприводная компоновка. Буксировка на буксире допустима (на нейтрали), скорость до 50 км/ч.' },
            rwd: { icon: '🚙', name: 'Задний привод', text: 'Заднеприводная компоновка. При буксировке не забывайте переключить КПП в нейтраль.' },
            awd: { icon: '🚙', name: 'Полный привод', text: 'Полноприводная компоновка. Буксировка на буксире запрещена — только эвакуатор с полной погрузкой.' }
        },
        fuel: {
            petrol: { icon: '⛽', name: 'Бензиновый двигатель', text: 'Обычный бензин. Проверьте допустимую марку в руководстве по эксплуатации (АИ-92 или АИ-95).' },
            diesel: { icon: '⛽', name: 'Дизельный двигатель', text: 'Дизельное топливо. Следите за уровнем и качеством топлива — особенно важно в холода. Свечи накаливания и DPF — в списке индикаторов.' },
            hybrid: { icon: '🔋', name: 'Гибрид', text: 'Гибридная силовая установка. Заправляйтесь как обычно, но не допускайте полного опустошения бака — это вредит гибридной системе.' },
            ev: { icon: '⚡', name: 'Электромобиль', text: 'Электрический двигатель. Прикуривать нельзя! Заряжать — на зарядных станциях, запас хода зависит от температуры.' }
        },
        eps: {
            true: { icon: '⚡', name: 'Электроусилитель руля', text: 'Жидкость гидроусилителя не нужна — усилитель электрический. Проверять и доливать нечего.' },
            false: { icon: '🧭', name: 'Гидроусилитель руля', text: 'Есть гидроусилитель — проверяйте уровень жидкости в бачке «Power Steering».' }
        }
    },

    /* ---------- Популярные города для ручного выбора ---------- */
    cities: [
        'Челябинск', 'Москва', 'Санкт-Петербург', 'Екатеринбург', 'Новосибирск',
        'Казань', 'Нижний Новгород', 'Чебоксары', 'Омск', 'Самара', 'Ростов-на-Дону', 'Уфа',
        'Красноярск', 'Пермь', 'Воронеж', 'Волгоград', 'Краснодар', 'Саратов', 'Тюмень',
        'Тольятти', 'Ижевск', 'Барнаул', 'Ульяновск', 'Иркутск', 'Хабаровск', 'Владивосток',
        'Махачкала', 'Ярославль', 'Тверь', 'Курск', 'Брянск', 'Липецк', 'Тула', 'Калуга',
        'Оренбург', 'Кемерово', 'Новокузнецк', 'Рязань', 'Астрахань', 'Пенза', 'Киров',
        'Челябинск', 'Копейск', 'Магнитогорск', 'Миасс', 'Златоуст', 'Сатка', 'Чебаркуль',
        'Абакан', 'Сыктывкар', 'Йошкар-Ола', 'Саранск', 'Нарьян-Мар', 'Майкоп', 'Грозный',
        'Калининград', 'Ставрополь', 'Белгород', 'Владимир', 'Смоленск', 'Кострома', 'Рыбинск'
    ]
};
