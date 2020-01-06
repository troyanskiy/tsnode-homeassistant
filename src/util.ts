import { HAServiceActionType } from './declarations';

export const toggleServiceActionType = (force?: boolean)
  : HAServiceActionType.Toggle | HAServiceActionType.TurnOn | HAServiceActionType.TurnOff => {

  if (force === true) {
    return HAServiceActionType.TurnOn;
  }

  if (force === false) {
    return HAServiceActionType.TurnOff;
  }

  return HAServiceActionType.Toggle;

}
