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
import { filter, map, tap } from 'rxjs/operators';
import { HAEntity } from './entities/base.entity';

export class HomeAssistantEntities {

  onChange = new Subject<HAEntity>();

  private entities: { [id: string]: HAEntity } = {};

  constructor(private hass: HomeAssistant) {

    this.hass
      .events
      .select('state_changed')
      .subscribe(data => this.handleHAStateChange(data));

    this.hass.connectionStatus$
      .pipe(
        filter(status => status === HAConnectionStatus.Connected)
      )
      .subscribe(() => this.fetchEntities());

  }

  /**
   * Fetch and set states
   */
  fetchEntities(): Observable<HAEntity[]> {

    console.log('Fetching states');

    return this.hass
      .sendWithIdAndResult({
        type: HAMessageType.GetStates
      })
      .pipe(
        map(($event: IHAResultMessage<IHAEntityState[]>) => {

          const oldEntities = this.entities;
          this.entities = {};

          if ($event.result) {
            $event.result.forEach((new_state: IHAEntityState)  => {

              let entity = oldEntities[new_state.entity_id];

              if (entity) {
                entity.setStateFromHA(new_state);
              } else {
                entity = new HAEntity(new_state);
              }

              this.entities[new_state.entity_id] = entity;

              delete oldEntities[new_state.entity_id];

            });
          }

          Object.values(oldEntities).forEach((entity: HAEntity) => entity.destroy());

          return Object.values(this.entities);

        })
      );

  }


  /**
   * Get current state
   */
  getEntity(entityId: string): HAEntity | null {
    return this.entities[entityId] || null;
  }

  /**
   * Handle HS result message
   */
  private handleHAStateChange($event: IHAEvent<IHAEventStateChangeData>) {

    const data = $event.data;

    let entity = this.getEntity(data.entity_id);

    if (data.new_state) {
      if (entity) {
        entity.setStateFromHA(data.new_state);
      } else {
        entity = new HAEntity(data.new_state);
        this.entities[data.entity_id] = entity;
      }
    } else {
      if (entity) {
        entity.destroy();
        delete this.entities[data.entity_id];
      }
    }

    if (entity) {
      this.onChange.next(entity);
    }

  }

}
