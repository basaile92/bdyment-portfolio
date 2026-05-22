export const isNumeric = (value: string): boolean => {
  return !isNaN(Number(value));
};

export const isInteger = (value: string): boolean => {
  return isNumeric(value) && Number.isInteger(Number.parseInt(value));
};
