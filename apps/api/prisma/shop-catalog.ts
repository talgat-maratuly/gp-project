/** Каталог GP Shop для seed (синхрон с apps/gp-service/src/data/products.js) */

export type ShopCatalogItem = {
  id: string;
  name: string;
  categoryId: string;
  brand: string;
  price: number;
  stock: number;
  inStock: boolean;
  description: string;
  specs?: Record<string, string | number>;
};

function specsText(specs?: Record<string, string | number>): string {
  if (!specs) return '';
  return Object.entries(specs)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
}

export function toProductSeedRow(item: ShopCatalogItem, partnerId: string) {
  return {
    id: `seed-${item.id}`,
    partnerId,
    name: item.name,
    price: item.price,
    stock: item.stock,
    category: item.categoryId,
    brand: item.brand,
    description: item.description,
    specifications: specsText(item.specs),
    inStock: item.inStock,
  };
}

export const SHOP_CATALOG: ShopCatalogItem[] = [
  { id: 'p001', name: 'Сосна горная «Мопс»', categoryId: 'plants', brand: 'GP', price: 22500, stock: 12, inStock: true, description: 'Медленнорастущая хвойная для альпинариев и рокариев. Высота до 1.2 м.', specs: { height: '80–120 см', zone: '4–7' } },
  { id: 'p002', name: 'Спирея японская «Широбана»', categoryId: 'plants', brand: 'GP', price: 14000, stock: 18, inStock: true, description: 'Декоративный куст с пёстрой листвой. Цветёт белыми соцветиями.', specs: { height: '60–80 см' } },
  { id: 'p003', name: 'Лаванда узколистная', categoryId: 'plants', brand: 'GP', price: 4400, stock: 40, inStock: true, description: 'Ароматное многолетнее растение для солнечных мест.', specs: { height: '40–60 см' } },
  { id: 'p004', name: 'Туя западная «Смарагд»', categoryId: 'plants', brand: 'GP', price: 31000, stock: 8, inStock: true, description: 'Колоновидная туя для живых изгородей. Не требует стрижки.', specs: { height: '2–3 м' } },
  { id: 'p005', name: 'Гортензия древовидная «Аннабель»', categoryId: 'plants', brand: 'GP', price: 17000, stock: 0, inStock: false, description: 'Крупные белые шапки цветов. Хорошо растёт в полутени.', specs: { height: '1–1.5 м' } },
  { id: 'p006', name: 'Семена газона «Универсал Про» 10 кг', categoryId: 'lawn', brand: 'GP', price: 44500, stock: 6, inStock: true, description: 'Смесь овсяницы и мятлика. Плотный зелёный газон.', specs: { coverage: '200 м²', weight: '10 кг' } },
  { id: 'p007', name: 'Рулонный газон «Премиум»', categoryId: 'lawn', brand: 'GP', price: 2200, stock: 500, inStock: true, description: 'Готовый газон высшего сорта. Укладка за 1 день.', specs: { thickness: '2.5 см' } },
  { id: 'p008', name: 'Аэратор ручной для газона', categoryId: 'lawn', brand: 'Gardena', price: 21000, stock: 14, inStock: true, description: 'Улучшает доступ воздуха к корням. Ширина 35 см.', specs: { width: '35 см' } },
  { id: 'p009', name: 'Скарификатор электрический', categoryId: 'lawn', brand: 'Karcher', price: 94500, stock: 4, inStock: true, description: 'Удаление мха и войлока. Мощность 1400 Вт.', specs: { power: '1400 Вт' } },
  { id: 'p010', name: 'Контроллер полива Hunter XC 4 зоны', categoryId: 'irrigation', brand: 'Hunter', price: 62500, stock: 9, inStock: true, description: 'Программируемый контроллер на 4 зоны. Внутренний и наружный монтаж.', specs: { zones: 4, programs: 3 } },
  { id: 'p011', name: 'Капельная лента 16 мм 100 м', categoryId: 'irrigation', brand: 'Netafim', price: 16000, stock: 25, inStock: true, description: 'Шаг капельниц 30 см. Расход 2.1 л/ч.', specs: { length: '100 м', step: '30 см' } },
  { id: 'p012', name: 'Труба ПНД 25 мм 50 м', categoryId: 'irrigation', brand: 'GP', price: 24000, stock: 20, inStock: true, description: 'Полиэтиленовая труба для магистрали автополива.', specs: { diameter: '25 мм', pressure: '6 атм' } },
  { id: 'p013', name: 'Электромагнитный клапан 1" Rain Bird', categoryId: 'irrigation', brand: 'Rain Bird', price: 17000, stock: 30, inStock: true, description: 'Клапан с регулировкой расхода. 24V AC.', specs: { size: '1"', voltage: '24V' } },
  { id: 'p014', name: 'Набор фитингов компрессионных 25 мм', categoryId: 'irrigation', brand: 'GP', price: 10500, stock: 22, inStock: true, description: '20 предметов: углы, тройники, муфты.', specs: { count: 20 } },
  { id: 'p015', name: 'Спринклер Hunter PGP Ultra', categoryId: 'hunter', brand: 'Hunter', price: 21000, stock: 35, inStock: true, description: 'Роторный спринклер с радиусом до 14.6 м. Регулируемая дуга.', specs: { radius: '4.9–14.6 м' } },
  { id: 'p016', name: 'Спринклер Hunter Pro-Spray 15 см', categoryId: 'hunter', brand: 'Hunter', price: 9000, stock: 40, inStock: true, description: 'Выдвижной корпус 15 см для форсунок MP Rotator.', specs: { height: '15 см' } },
  { id: 'p017', name: 'Форсунка MP Rotator 90–210', categoryId: 'hunter', brand: 'Hunter', price: 3200, stock: 80, inStock: true, description: 'Низкорасходная форсунка с равномерным покрытием.', specs: { arc: '90–210°' } },
  { id: 'p018', name: 'Контроллер Hunter Pro-HC 6 зон Wi-Fi', categoryId: 'hunter', brand: 'Hunter', price: 144500, stock: 3, inStock: true, description: 'Управление с телефона через приложение Hydrawise.', specs: { zones: 6 } },
  { id: 'p019', name: 'Датчик дождя Hunter Rain-Clik', categoryId: 'hunter', brand: 'Hunter', price: 28000, stock: 15, inStock: true, description: 'Автоматическое отключение полива при осадках.', specs: { type: 'механический' } },
  { id: 'p020', name: 'Насос погружной Grundfos SQ 2-55', categoryId: 'pumps', brand: 'Grundfos', price: 210000, stock: 2, inStock: true, description: 'Для скважин до 55 м. Встроенный частотник.', specs: { depth: '55 м' } },
  { id: 'p021', name: 'Насосная станция GP Aqua 60', categoryId: 'pumps', brand: 'GP', price: 79000, stock: 6, inStock: true, description: 'Гидроаккумулятор 24 л. Для автополива и дома.', specs: { tank: '24 л' } },
  { id: 'p022', name: 'Циркуляционный насос 25-60', categoryId: 'pumps', brand: 'Grundfos', price: 44500, stock: 7, inStock: true, description: 'Для систем фильтрации и повторного использования воды.', specs: { flow: '3 м³/ч' } },
  { id: 'p023', name: 'Фекальный насос дренажный GP 750', categoryId: 'pumps', brand: 'GP', price: 32500, stock: 0, inStock: false, description: 'Для откачки ливневых и дренажных вод.', specs: { power: '750 Вт' } },
  { id: 'p024', name: 'Фильтр сетчатый 1" 120 mesh', categoryId: 'filters', brand: 'Rain Bird', price: 14000, stock: 28, inStock: true, description: 'Промывной фильтр для защиты форсунок.', specs: { mesh: '120', size: '1"' } },
  { id: 'p025', name: 'Фильтр дисковый 2" 130 micron', categoryId: 'filters', brand: 'Netafim', price: 44500, stock: 10, inStock: true, description: 'Для капельных систем с высокой степенью очистки.', specs: { micron: '130' } },
  { id: 'p026', name: 'Гидроциклон песочный 1"', categoryId: 'filters', brand: 'GP', price: 22500, stock: 12, inStock: true, description: 'Отделение песка без расходных материалов.', specs: { size: '1"' } },
  { id: 'p027', name: 'Картридж сменный 120 mesh (5 шт)', categoryId: 'filters', brand: 'Rain Bird', price: 6000, stock: 50, inStock: true, description: 'Сменные сетки для фильтра 100/120 mesh.', specs: { count: 5 } },
  { id: 'p028', name: 'Удобрение NPK 12-12-17 для газона 5 кг', categoryId: 'fertilizers', brand: 'GP', price: 9400, stock: 30, inStock: true, description: 'Гранулированное удобрение для активного роста.', specs: { weight: '5 кг' } },
  { id: 'p029', name: 'Удобрение для хвойных «Кора» 3 кг', categoryId: 'fertilizers', brand: 'GP', price: 4900, stock: 25, inStock: true, description: 'Подкисляет почву, предотвращает пожелтение.', specs: { weight: '3 кг' } },
  { id: 'p030', name: 'Органика «Биогумус» 10 л', categoryId: 'fertilizers', brand: 'GP', price: 2200, stock: 60, inStock: true, description: 'Жидкий биогумус для всех культур.', specs: { volume: '10 л' } },
  { id: 'p031', name: 'Стимулятор корнеобразования «Корнерост»', categoryId: 'fertilizers', brand: 'GP', price: 1600, stock: 45, inStock: true, description: 'Для обработки саженцев при пересадке.', specs: { volume: '50 мл' } },
  { id: 'p032', name: 'Прожектор LED ландшафтный 10W IP67', categoryId: 'lighting', brand: 'Philips', price: 12000, stock: 32, inStock: true, description: 'Тёплый белый 3000K. Угол 30°. Кабель 2 м.', specs: { power: '10W', ip: 'IP67' } },
  { id: 'p033', name: 'Гирлянда LED для деревьев 20 м', categoryId: 'lighting', brand: 'GP', price: 19500, stock: 20, inStock: true, description: '240 LED, тёплый белый, 8 режимов.', specs: { length: '20 м' } },
  { id: 'p034', name: 'Трансформатор 12V 60W для подсветки', categoryId: 'lighting', brand: 'GP', price: 16000, stock: 16, inStock: true, description: 'Защита от перегрузки и короткого замыкания.', specs: { power: '60W' } },
  { id: 'p035', name: 'Столбик садовый LED 60 см', categoryId: 'lighting', brand: 'Philips', price: 25500, stock: 11, inStock: true, description: 'Рассеянный свет для дорожек и клумб.', specs: { height: '60 см' } },
  { id: 'p036', name: 'Секатор садовый Fiskars PowerGear', categoryId: 'tools', brand: 'Fiskars', price: 21000, stock: 18, inStock: true, description: 'Рычажный механизм — до 3x усилия. До 24 мм.', specs: { cut: '24 мм' } },
  { id: 'p037', name: 'Лопата штыковая с фиберглассовой ручкой', categoryId: 'tools', brand: 'Fiskars', price: 14000, stock: 24, inStock: true, description: 'Закалённая сталь. Ручка 130 см.', specs: { length: '130 см' } },
  { id: 'p038', name: 'Тачка садовая 100 л', categoryId: 'tools', brand: 'GP', price: 28000, stock: 9, inStock: true, description: 'Пневматическое колесо. Грузоподъёмность 150 кг.', specs: { volume: '100 л' } },
  { id: 'p039', name: 'Грабли веерные 22 зуба', categoryId: 'tools', brand: 'Gardena', price: 9400, stock: 26, inStock: true, description: 'Регулируемая ширина. Алюминиевая рукоятка.', specs: { width: '43–53 см' } },
  { id: 'p040', name: 'Ножницы газонные длинноручковые', categoryId: 'tools', brand: 'Gardena', price: 22500, stock: 13, inStock: true, description: 'Для подравнивания кромок без наклона.', specs: { length: '90 см' } },
  { id: 'p041', name: 'Шланг садовый 25 мм 25 м', categoryId: 'consumables', brand: 'Gardena', price: 16000, stock: 22, inStock: true, description: '3 слоя, давление 25 бар. Не перекручивается.', specs: { length: '25 м' } },
  { id: 'p042', name: 'Крепёж для труб 25 мм (50 шт)', categoryId: 'consumables', brand: 'GP', price: 4400, stock: 40, inStock: true, description: 'Пластиковые клипсы для ПНД труб.', specs: { count: 50 } },
  { id: 'p043', name: 'Изолента ПВХ для полива (10 рул)', categoryId: 'consumables', brand: 'GP', price: 2200, stock: 55, inStock: true, description: 'Влагостойкая, зелёная, 19 мм × 10 м.', specs: { count: 10 } },
  { id: 'p044', name: 'Таймер полива механический', categoryId: 'consumables', brand: 'Gardena', price: 10500, stock: 19, inStock: true, description: 'На кран 3/4". До 120 мин за цикл.', specs: { programs: 1 } },
  { id: 'p045', name: 'Ремкомплект спринклера Hunter PGP', categoryId: 'parts', brand: 'Hunter', price: 6000, stock: 33, inStock: true, description: 'Фильтр, шайбы, отвёртка, сопло.', specs: { model: 'PGP Ultra' } },
  { id: 'p046', name: 'Соленоид 24V для клапана Rain Bird', categoryId: 'parts', brand: 'Rain Bird', price: 9000, stock: 27, inStock: true, description: 'Сменный соленоид для клапанов DV/DAS.', specs: { voltage: '24V AC' } },
  { id: 'p047', name: 'Муфта компрессионная 25 мм', categoryId: 'parts', brand: 'GP', price: 400, stock: 200, inStock: true, description: 'Для ПНД труб 25 мм. PN10.', specs: { size: '25 мм' } },
  { id: 'p048', name: 'Короб распределительный 6 клапанов', categoryId: 'parts', brand: 'GP', price: 17000, stock: 14, inStock: true, description: 'Наземный бокс для группы электромагнитных клапанов.', specs: { valves: 6 } },
];
