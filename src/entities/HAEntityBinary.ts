import { Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { HAEntityBase } from './HAEntityBase';

export class HAEntityBinary extends HAEntityBase {
  isOn$: Observable<boolean> = this.onUpdate.pipe(
    map(() => this.isOn),
    distinctUntilChanged(),
  );

  get isOn(): boolean {
    return this.state === 'on';
  }

  get isOff(): boolean {
    return !this.isOn;
  }
}
