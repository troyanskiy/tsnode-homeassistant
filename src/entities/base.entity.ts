import { HADomain, IHAEntityState } from '../declarations';
import { Subject } from 'rxjs';

export class HAEntity implements IHAEntityState {

  entity_id: string = '';

  state: string = '';
  attributes: any = {};
  context: any = null;

  last_changed: string;
  last_updated: string;

  domain: HADomain | string = '';
  objectId: string = '';

  onUpdate = new Subject<HAEntity>();

  lastState: IHAEntityState | null = null;

  destroyed = false;

  constructor(state: IHAEntityState) {
    this.setStateFromHA(state, true);
  }

  setStateFromHA(state: IHAEntityState, skipSaveState: boolean = false) {

    if (!skipSaveState) {
      this.lastState = this.getState();
    }

    Object.assign(this, state);

    let objectIdParts: string[];

    [this.domain, ...objectIdParts] = this.entity_id.split('.');
    this.objectId = objectIdParts.join('.');

    this.onUpdate.next(this);
  }

  getState(): IHAEntityState {
    return JSON.parse(JSON.stringify({
      entity_id: this.entity_id,
      state: this.state,
      attributes: this.attributes,
      context: this.context,
      last_changed: this.last_changed,
      last_updated: this.last_updated
    }));
  }

  destroy() {
    this.destroyed = true;
    this.onUpdate.complete();
  }



}
