export function separateByNewLine(string1: string, string2: string): string {
  return `${string1}<br/>${string2}`;
}

export function noSeparation(string1: string, string2: string): string {
  return `${string1}${string2}`;
}

export function separateByComma(string1: string, string2: string): string {
  return `${string1}, ${string2}`;
}
