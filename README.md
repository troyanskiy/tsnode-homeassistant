# TypeScript/RXJS Node.js api for HomeAssistant

It's simple reactive way of access and control HomeAssistant using the
websocket api.

This is very first versions of the library and some functionality is missing...

Please, do not hasitate to create an issues if you will find any bug or missing functionality.

## Installation

```bash
$ npm i --save tsnode-homeassistant
```

Or use seed project

[https://github.com/troyanskiy/tsnode-homeassistant-seed](https://github.com/troyanskiy/tsnode-homeassistant-seed)

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

## 1 HomeAssistant

### 1.1 Connection status observable

`connectionStatus$: Observable<HAConnectionStatus>`

### 1.2 Connection status

`connectionStatus: HAConnectionStatus`

### 1.3 Ready state observable

`ready$: Observable<void>`

### 1.4 HomeAssistant Version

`haVersion: string`

### 1.5 Events instance

`events: HomeAssistantEvents`

Details below

### 1.6 Service instance

`service: HomeAssistantService`

Details below

### 1.7 States instance

`entities: HomeAssistantEntities`

Details below




## 2 Events

Available as object on HomeAssistant instance `<instance>.events`

### 2.1 Subscribe to event

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

## 3 Service

Available as object on HomeAssistant instance `<instance>.service`

### 3.1 Call a service

```typescript
*.service.call(domain: HADomain, service: HAServiceActionType, serviceDataOrEntity?: any): Observable<IHAResultMessage>
```

Will return an observable with service execution result

#### Examples

```typescript
ha
  .service
  .call(
    HADomain.Light,
    HAServiceType.TurnOn,
    'light.EntityId1'
  )
```

```typescript
ha
  .service
  .call(
    HADomain.Light,
    HAServiceType.TurnOn,
    'EntityId1'
  )
```

```typescript
ha
  .service
  .call(
    HADomain.Switch,
    HAServiceType.TurnOff,
    ['EntityId1', 'switch.EntityId2']
  )
```

```typescript
ha
  .service
  .call(
    HADomain.Switch,
    HAServiceType.Toggle,
    {
      entity_id: ['EntityId1', 'EntityId2']
    }
  )
```

### 3.2 Toggle / Shortcut to call a service

```typescript
toggle(domain: HADomain, entities: string[] | string, force?: boolean): Observable<IHAResultMessage>
```
Will return an observable with service execution result

If 
* `force === true` it will call `TurnOn` service
* `force === false` it will call `TurnOff` service
* `force` is missing will call `Toggle` service


#### Example

```typescript
ha
  .service
  .toggle(
    HADomain.Switch,
    ['EntityId1', 'EntityId2']
  )
```

## 4 Entities / States

Available as object on HomeAssistant instance `<instance>.entities`

All the entities/states are loaded and saved in the memory every time
when Node.js instance is connected to the HomeAssistant server

### 4.1 On Change

```typescript
*.entities.onChange: Subject<HAEntity>
```

#### Examples

```typescript
ha
  .entities
  .onChange
  .pipe(
    filter(entity => entity.id === 'MyEntityId')
  )
  .subscribe(entity => {
    // do something with new state
    console.log('Received new state of entity', entity);
  })
```

### 4.2 Fetch/update states from HomeAssistant and update in the memory

Will call HA to get all the states, updates them in the memory and returns as observable resolution

```typescript
*.entities.fetchEntities(): Observable<HAEntity[]>
```

### 4.3 Get state from memory

Will return entity from memory or null if not found

```typescript
*.entities.getState(entityId: string): HAEntity | null
```


