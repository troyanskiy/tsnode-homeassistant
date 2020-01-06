import { HAServiceType } from './declarations';

export const toggleServiceActionType = (force?: boolean)
  : HAServiceType.Toggle | HAServiceType.TurnOn | HAServiceType.TurnOff => {

  if (force === true) {
    return HAServiceType.TurnOn;
  }

  if (force === false) {
    return HAServiceType.TurnOff;
  }

  return HAServiceType.Toggle;

}
