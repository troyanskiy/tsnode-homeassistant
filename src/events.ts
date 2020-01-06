import { HomeAssistant } from './index';
import {
  HAConnectionStatus,
  HAMessageType,
  IEventSubscriptionEntry,
  IHAEvent,
  IHAMessageEvent,
  IHAResultMessage,
  IHASubscribeToEvent
} from './declarations';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

export class HomeAssistantEvents {

  private subMapName: { [eventType: string]: IEventSubscriptionEntry } = {};
  private subMapId: { [id: number]: IEventSubscriptionEntry } = {};

  constructor(private hass: HomeAssistant) {

    this.hass.wsMessage$
      .pipe(
        filter(($event: IHAMessageEvent) => $event.type === HAMessageType.Event)
      )
      .subscribe($event => this.handleEventMessage($event));

    this.hass.connectionStatus$
      .pipe(
        filter(status => status === HAConnectionStatus.Connected)
      )
      .subscribe(() => this.reSubscribe());

  }

  list() {
    // todo
  }

  select<T = any>(eventType: string): Observable<IHAEvent<T>> {
    if (!this.subMapName[eventType]) {

      const entry: IEventSubscriptionEntry = {
        id: this.hass.getNextId(),
        type: eventType,
        obs: new Subject<IHAEvent<T>>()
      };

      this.subMapName[entry.type] = entry;
      this.subMapId[entry.id] = entry;

      this.sendToSubscribeToEvent(entry);

    }

    return this.subMapName[eventType].obs;
  }

  fire(eventType: string, eventData?: any) {
    // todo
  }

  /**
   * Send message to subscribe to event type
   */
  private sendToSubscribeToEvent(entry: IEventSubscriptionEntry): Observable<IHAResultMessage> {

    const pack: IHASubscribeToEvent = {
      id: entry.id,
      type: HAMessageType.SubscribeEvents
    };

    if (entry.type) {
      pack.event_type = entry.type;
    }

    return this.hass.sendWithIdAndResult(pack);
  }

  /**
   * Resubscribe to events after connect
   */
  private reSubscribe() {

    const eventEntries = Object.values(this.subMapName);

    this.subMapId = {};

    eventEntries.forEach(entry => {

      entry.id = this.hass.getNextId();

      this.subMapId[entry.id] = entry;

      this.sendToSubscribeToEvent(entry);

    });

  }

  /**
   * Handle HA Event
   */
  private handleEventMessage($event: IHAMessageEvent) {

    if (!$event.id) {
      return;
    }

    const eventEntry = this.subMapId[$event.id];

    if (eventEntry) {
      eventEntry.obs.next($event.event);
    }

  }
}
