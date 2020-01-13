import { HAEntityBase } from './HAEntityBase';
import { HAServiceType, IHAResultMessage } from '../declarations';
import { Observable } from 'rxjs';

export class HAEntityBoolean extends HAEntityBase {

  get isOn(): boolean {
    return this.state === 'on';
  }

  get isOff(): boolean {
    return !this.isOn;
  }

  turnOn(): Observable<IHAResultMessage> {
    return this.callService(HAServiceType.TurnOn);
  }

  turnOff(): Observable<IHAResultMessage> {
    return this.callService(HAServiceType.TurnOff);
  }

  toggle(on?: boolean): Observable<IHAResultMessage> {

    if (on !== void 0) {
      return on ? this.turnOn() : this.turnOff();
    }

    return this.callService(HAServiceType.Toggle);

  }

}
