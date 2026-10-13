export interface WeaponReference {
  roll: string;
  type: string;
  condition: string;
  slots: string;
  uses: string;
  damage: string;
  price: string;
  examples?: string[];
}

export interface EquipmentReference {
  name: string;
  slots: number | null;
  price: number;
}

export const WEAPONS: WeaponReference[] = [
  {
    roll: '1',
    type: 'Метательное оружие',
    condition: '1',
    slots: '1',
    uses: '—',
    damage: '1d4',
    price: '20',
  },
  {
    roll: '2',
    type: 'Оружие ближнего боя',
    condition: '2',
    slots: '1',
    uses: '—',
    damage: '1d4',
    price: '40',
  },
  {
    roll: '3',
    type: 'Пистолеты и револьверы',
    condition: '3',
    slots: '1',
    uses: '5',
    damage: '1d6',
    price: '125',
  },
  {
    roll: '4',
    type: 'Дробовики',
    condition: '3',
    slots: '2',
    uses: '4',
    damage: '2d4*',
    price: '250',
  },
  {
    roll: '5',
    type: 'Компактные винтовки',
    condition: '3',
    slots: '2',
    uses: '10',
    damage: '1d8',
    price: '300',
  },
  {
    roll: '6',
    type: 'Рейдорские винтовки',
    condition: '3',
    slots: '3',
    uses: '10',
    damage: '1d10',
    price: '400',
    examples: [
      'проционная рейдорская винтовка',
      'вакуумная винтовка булл-пап',
      'дуговая винтовка',
    ],
  },
  {
    roll: '7',
    type: 'Снайперское оружие',
    condition: '3',
    slots: '3',
    uses: '4',
    damage: '1d12',
    price: '500',
    examples: [
      'термитный арбалет',
      'снайперское ружьё с целеуказанием',
      'серповидный отсекатель конечностей',
    ],
  },
  {
    roll: '8',
    type: 'Автопушки',
    condition: '4',
    slots: '6',
    uses: '4',
    damage: '3d6',
    price: '800',
    examples: ['Каацерская коаксиальная пушка', 'лёгкая автомобильная пушка'],
  },
  {
    roll: '9',
    type: 'Гранаты',
    condition: '—',
    slots: '1',
    uses: '—',
    damage: '2d6*',
    price: '50',
    examples: [
      'плерионная граната',
      'зажигательный квазар',
      'пылеочищающая граната',
    ],
  },
  {
    roll: '10',
    type: 'Огнемёты',
    condition: '4',
    slots: '5',
    uses: '3',
    damage: '3d6',
    price: '700',
    examples: ['зажигательное устройство на жидком топливе («Панциморт»)'],
  },
];

export const EQUIPMENT: EquipmentReference[] = [
  { name: '50 странных металлических шариков', slots: 1, price: 4 },
  { name: 'Дыхательная маска (1d6 минут)', slots: null, price: 100 },
  { name: 'Альпинистская верёвка (15 м)', slots: 1, price: 10 },
  { name: 'Контейнер с моторной смазкой', slots: 1, price: 4 },
  { name: 'Клейкая лента', slots: null, price: 3 },
  { name: 'Костюм СК, лёгкий', slots: 3, price: 200 },
  { name: 'Костюм СК, тяжёлый', slots: 5, price: 400 },
  { name: 'Фальшивая граната', slots: null, price: 5 },
  { name: 'Фонарик P78C', slots: 1, price: 20 },
  { name: 'Голо-игральные карты', slots: null, price: 5 },
  { name: 'Магнитные ботинки', slots: 2, price: 80 },
  {
    name: 'Эпоксидная смола, мед. класс (5 применений)',
    slots: null,
    price: 50,
  },
  { name: 'Световые палочки военного типа (5 шт.)', slots: null, price: 10 },
  { name: 'Упаковка ароматических палочек', slots: null, price: 4 },
  { name: 'Феромонный спрей', slots: 1, price: 20 },
  { name: 'Планетарный набор для приготовления пищи', slots: 3, price: 20 },
  { name: 'Планетарный парашют', slots: 1, price: 300 },
  { name: 'Баллончик с краской', slots: 1, price: 2 },
  { name: 'Палатка для экстремальных условий (5 чел.)', slots: 2, price: 120 },
  { name: 'Тепловая микрометеороидная накидка-одеяло', slots: 1, price: 10 },
  { name: 'Набор инструментов', slots: 1, price: 50 },
  { name: 'Ловушка и охотничий набор', slots: 2, price: 50 },
  { name: 'Сигнальная растяжка', slots: 1, price: 8 },
  { name: 'Таблетки для очистки воды (5 применений)', slots: null, price: 10 },
];

export const ELECTRONICS: EquipmentReference[] = [
  { name: 'Искусственное животное с ИИ', slots: 2, price: 650 },
  { name: 'Перезаряжаемая батарея с солнечной панелью', slots: 2, price: 50 },
  { name: 'Летающий мини-дрон', slots: 2, price: 300 },
  { name: 'Сварочный аппарат', slots: 2, price: 50 },
  { name: 'Грави-гамак', slots: 2, price: 35 },
  { name: 'Нефизисный визор', slots: 1, price: 100 },
  { name: 'Персональный детектор радиации', slots: 1, price: 30 },
  {
    name: 'Портативная система жизнеобеспечения (5 чел.)',
    slots: 3,
    price: 800,
  },
  { name: 'Детектор приближения', slots: 1, price: 60 },
  { name: 'Рекордер с 4 мини варп-дисками', slots: 1, price: 50 },
  { name: 'Планшетный компьютер', slots: 1, price: 150 },
  { name: 'Переводчик (5/6)', slots: 1, price: 100 },
  { name: 'Вибро-отмычки', slots: 1, price: 100 },
  { name: 'Скремблер голоса', slots: 1, price: 50 },
];

export function equipmentLine(item: EquipmentReference): string {
  return `Слоты ${item.slots ?? '—'} · ${item.price} гало`;
}
