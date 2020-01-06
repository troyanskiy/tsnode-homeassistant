# TypeScript/RXJS Node.js api for HomeAssistant

It's simple reactive way of access and control HomeAssistant using the
websocket api.

## Installation

```bash
$ npm i --save tsnode-homeassistant
```

## Usage example

```typescript
import { HomeAssistant, IHAEvent } from 'tsnode-homeassistant';
import { IButtonEventData } from './data';
import { CONFIG } from './config';
import { map } from 'rxjs/operators';

// Create the HomeAssistant instance and connect to the HA server
const ha = new HomeAssistant(CONFIG);

ha
  .events // Events object
  .select('deconz_event') // Select HA events
  .pipe(
    map(($event: IHAEvent<IButtonEventData>) => $event.data) // Map event
  )
  .subscribe(data => { // Subscribe to events

    console.log('The event', data);

  });

ha
  .states
  .onChange
  .subscribe(state => console.log(state));

```

# API

## Events

Available as object on HomeAssistant instance `<instance>.events`

### Subscribe to event

```typescript
*.events.select(eventType: string): Observable<IHAEvent<T>>
```

```typescript
export interface IHAEvent<T = any> {
  data: T; // event data
  event_type: string; // event type or name
  time_fired: string; // time of event fire
  origin: string; // event origin 
  context?: IHAEventContext;
}

export interface IHAEventContext {
  id: string;
  parent_id: string | null;
  user_id: string | null;
}
```

#### Example

Above

## Service

Available as object on HomeAssistant instance `<instance>.service`

### Call a service

```typescript
*.service.call(domain: HADomain, service: HAServiceActionType, serviceDataOrEntity?: any): Observable<IHAResultMessage>
```

#### Examples

```typescript
ha
  .service
  .call(
    HADomain.Light,
    'light.EntityId1',
    HAServiceType.TurnOn
  )
```

```typescript
ha
  .service
  .call(
    HADomain.Light,
    'EntityId1',
    HAServiceType.TurnOn
  )
```

```typescript
ha
  .service
  .call(
    HADomain.Switch,
    ['EntityId1', 'switch.EntityId2'],
    HAServiceType.TurnOff
  )
```

```typescript
ha
  .service
  .call(
    HADomain.Switch,
    {
      entity_id: ['EntityId1', 'EntityId2']
    },
    HAServiceType.Toggle
  )
```
