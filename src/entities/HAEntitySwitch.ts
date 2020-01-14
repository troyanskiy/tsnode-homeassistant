import { HAEntityBinary } from './HAEntityBinary';
import { Observable } from 'rxjs';
import { HAServiceType, IHAResultMessage } from '../declarations';

export class HAEntitySwitch extends HAEntityBinary {

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
