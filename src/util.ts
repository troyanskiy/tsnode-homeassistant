import { HAServiceType } from './declarations';

export const toggleServiceActionType = (
  force?: boolean,
): HAServiceType.Toggle | HAServiceType.TurnOn | HAServiceType.TurnOff => {
  if (force === true) {
    return HAServiceType.TurnOn;
  }

  if (force === false) {
    return HAServiceType.TurnOff;
  }

  return HAServiceType.Toggle;
};

export const clamp = (
  value: number,
  minVal: number,
  maxVal: number,
): number => {
  return Math.min(Math.max(value, minVal), maxVal);
};
