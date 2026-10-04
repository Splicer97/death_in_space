import { findOrigin } from '../data/origins';
import {
  availableSlots,
  defenseRating,
  itemSlots,
  type Character,
  type Hub,
  type InstalledModule,
} from '../types';

function line(label: string, value: string | number): string {
  const text = String(value).trim();
  return text ? `${label}: ${text}` : '';
}

function section(title: string, lines: string[]): string {
  const body = lines.filter(Boolean);
  return body.length ? [title, ...body].join('\n') : '';
}

function sign(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

function moduleLine(item: InstalledModule): string {
  return `• ${item.name} — ${item.energy} ВМ`;
}

function weaponLine(label: string, weapon: Character['weapons'][0]): string {
  const maxUses = weapon.maxUses ?? weapon.uses;
  const charges = weapon.uses > 0 || maxUses > 0
    ? `, заряды ${weapon.uses}/${maxUses}`
    : '';
  const body = `${weapon.name} (${weapon.damage})${charges}`;
  return line(label, weapon.ammo ? `${body}, патроны: ${weapon.ammo}` : body);
}

export function characterToText(character: Character): string {
  const origin = character.origin ? findOrigin(character.origin) : null;
  const blocks = [
    'СМЕРТЬ В КОСМОСЕ — ЛИСТ ПЕРСОНАЛЬНЫХ ДАННЫХ',
    section(character.name || 'БЕЗ ИМЕНИ', [
      character.nickname ? `Прозвище: ${character.nickname}` : '',
      character.playerName ? `Игрок: ${character.playerName}` : '',
      origin ? `Происхождение: ${origin.name}` : '',
      line('Опыт', character.xp),
    ]),
    section('ХАРАКТЕРИСТИКИ', [
      line('Тел', sign(character.abilities.body)),
      line('Лов', sign(character.abilities.dexterity)),
      line('Рас', sign(character.abilities.savvy)),
      line('Тех', sign(character.abilities.tech)),
      line('ОЗ', `${character.hp}/${character.hpMax}`),
      line('УЗ', defenseRating(character.abilities.dexterity, character.armor)),
      line('Очки пустоты', character.voidPoints),
      line('Жизнеобеспечение', character.lifeSupport),
    ]),
    section('ПРЕДЫСТОРИЯ', [
      line('Прошлое', character.background),
      line('Принадлежность', character.pastAllegiance),
      line('Черта', character.trait),
      line('Движущая сила', character.drive),
      line('Внешность', character.looks),
    ]),
    section('МУТАЦИИ И ПОРЧА ПУСТОТЫ', [
      ...character.mutations.map(name => `• ${name}`),
      ...character.voidCorruption.map(name => `• ${name}`),
    ]),
    section('СНАРЯЖЕНИЕ', [
      line('Слоты предметов', `${availableSlots(character.abilities.body, character.armor)}/${itemSlots(character.abilities.body)}`),
      ...character.items.map(item => {
        const named = item.name.trim();
        if (!named) {
          return '';
        }
        return item.condition > 0
          ? `• ${named} — состояние ${item.condition}`
          : `• ${named}`;
      }),
      line('Мелочи', character.smallItems.map(item =>
        item.count > 1 ? `${item.name} ×${item.count}` : item.name,
      ).join(', ')),
      weaponLine('Оружие 1', character.weapons[0]),
      weaponLine('Оружие 2', character.weapons[1]),
      character.armor
        ? `Броня: ${character.armor.type} (УЗ +${character.armor.drBonus}${
            character.armor.protectsAgainst
              ? `, защита: ${character.armor.protectsAgainst}`
              : ''
          })`
        : 'Броня: нет',
    ]),
    section('РЕСУРСЫ', [
      line('Гало', character.holos),
      line('Долг', character.debt),
    ]),
    section('СТАРТОВОЕ', [
      line('Набор', character.startingKit),
      line('Безделушка', character.trinket),
      line('Бонус', character.startingBonus),
    ]),
    section('ЗАМЕТКИ', character.noteGroups.flatMap(group => [
      group.title.trim() ? `ЗАМЕТКИ — ${group.title.trim()}` : 'ЗАМЕТКИ',
      group.text,
    ])),
  ];

  return blocks.filter(Boolean).join('\n\n');
}

export function hubToText(hub: Hub): string {
  const used = hub.modules.reduce((sum, item) => sum + item.energy, 0);
  const blocks = [
    'СМЕРТЬ В КОСМОСЕ — ЛИСТ ХАБА',
    section(hub.hull || (hub.type === 'starship' ? 'ЗВЕЗДОЛЁТ' : 'СТАНЦИЯ'), [
      `Тип: ${hub.type === 'starship' ? 'звездолёт' : 'станция'}`,
      line('Источник энергии', hub.energySource),
      line('Уровень защиты', hub.defenseRating),
      line('Состояние', `${hub.condition}/${hub.conditionMax}`),
      line('Топливо', `${hub.fuel}/${hub.fuelMax}`),
      line('Целостность корпуса', `${hub.integrity}%`),
      line('Выходная мощность', `${used}/${hub.energyOutput} ВМ`),
    ]),
    section('ПРЕДЫСТОРИЯ И ИЗЮМИНКА', [
      line('Предыстория', hub.backstory),
      line('Изюминка', hub.quirk),
    ]),
    section('УСТАНОВЛЕННЫЕ МОДУЛИ', hub.modules.map(moduleLine)),
    section('ЗАМЕТКИ', [hub.notes]),
  ];

  return blocks.filter(Boolean).join('\n\n');
}
