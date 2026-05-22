import { noSeparation } from './separation-utils';

export function displayValueIfPresent(value: string | null, toDisplay: string): string {
  return value !== null ? toDisplay : '';
}

export function displayDatesAndPlace(startYear: number, endYear: number, place?: string) {
  return `<div class="italic">
            ${startYear}${startYear === endYear ? '' : `${endYear ? `-${endYear}` : '~'}`}
            ${place ? '-' : ''}
            ${place ? place : ''}
          </div>`;
}

export function keepNewLine(value: string): string {
  return value
    .split('\n')
    .map((valSplitted) => `<div>${valSplitted}</div>`)
    .reduce(noSeparation, '');
}
