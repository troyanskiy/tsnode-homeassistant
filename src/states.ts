import { HomeAssistant } from './index';
import {
  HAConnectionStatus,
  HAMessageType,
  IHAEntityState,
  IHAEvent,
  IHAEventStateChangeData,
  IHAResultMessage
} from './declarations';
import { Observable, Subject } from 'rxjs';
import { filter, tap } from 'rxjs/operators';

export class HomeAssistantStates {

  onChange = new Subject<IHAEventStateChangeData>();

  private states: { [id: string]: IHAEntityState } = {};

  constructor(private hass: HomeAssistant) {

    this.hass
      .events
      .select$('state_changed')
      .subscribe(data => this.handleHAStateChange(data));

    this.hass.connectionStatus$
      .pipe(
        filter(status => status === HAConnectionStatus.Connected)
      )
      .subscribe(() => this.fetchStates$());

  }

  /**
   * Fetch and set states
   */
  fetchStates$(): Observable<IHAResultMessage<IHAEntityState[]>> {

    console.log('Fetching states');

    return this.hass
      .sendWithIdAndResult({
        type: HAMessageType.GetStates
      })
      .pipe(
        tap(($event: IHAResultMessage<IHAEntityState[]>) => {

          const oldStates = this.states;
          this.states = {};

          $event.result.forEach((new_state: IHAEntityState)  => {
            this.states[new_state.entity_id] = new_state;

            const old_state = oldStates[new_state.entity_id] || null;

            this.onChange.next({
              entity_id: new_state.entity_id,
              old_state,
              new_state
            });

            delete oldStates[new_state.entity_id];

          });

          Object.values(oldStates).forEach((old_state: IHAEntityState) => {
            this.onChange.next({
              entity_id: old_state.entity_id,
              old_state,
              new_state: null
            });
          });

        })
      );

  }


  /**
   * Get current state
   */
  getState(entityId: string): IHAEntityState | null {
    return this.states[entityId] || null;
  }

  /**
   * Handle HS result message
   */
  private handleHAStateChange($event: IHAEvent<IHAEventStateChangeData>) {

    const data = $event.data;

    if (data.new_state) {
      this.states[data.entity_id] = data.new_state;
    } else {
      delete this.states[data.entity_id];
    }

    this.onChange.next(data);

  }

}
