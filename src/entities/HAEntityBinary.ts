import { HAEntityBase } from './HAEntityBase';

export class HAEntityBinary extends HAEntityBase {

  get isOn(): boolean {
    return this.state === 'on';
  }

  get isOff(): boolean {
    return !this.isOn;
  }

}
