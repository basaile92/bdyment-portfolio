const ENTER_KEY_CODE = 13;
const LEFT_KEY_CODE = 37;
const UP_KEY_CODE = 38;
const DOWN_KEY_CODE = 40;
const TAB_KEY_CODE = 9;
const C_KEY_CODE = 67;

export const isEnterDown = (e: any) => {
  return e.keyCode === ENTER_KEY_CODE && e.ctrlKey === false && e.shiftKey === false;
};
export const isArrowWithShiftDown = (e: any) => {
  return e.shiftKey === true && e.ctrlKey === false && e.keyCode >= LEFT_KEY_CODE && e.keyCode <= DOWN_KEY_CODE;
};
export const isUpTyped = (e: any) => {
  return e.shiftKey === false && e.ctrlKey === false && e.keyCode === UP_KEY_CODE;
};

export const isDownTyped = (e: any) => {
  return e.shiftKey === false && e.ctrlKey === false && e.keyCode === DOWN_KEY_CODE;
};

export const isTabTyped = (e: any) => {
  return e.shiftKey === false && e.ctrlKey === false && e.keyCode === TAB_KEY_CODE;
};
export const isTabShiftTyped = (e: any) => {
  return e.shiftKey === true && e.ctrlKey === false && e.keyCode === TAB_KEY_CODE;
};

export const isCtrlCTyped = (e: any) => {
  return e.shiftKey === false && e.ctrlKey === true && e.keyCode === C_KEY_CODE;
};

export const removeAllBehave = (e: any) => e.preventDefault();
