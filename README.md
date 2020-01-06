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

const ha = new HomeAssistant(CONFIG);

ha
  .events
  .select$('deconz_event')
  .pipe(
    map(($event: IHAEvent<IButtonEventData>) => $event.data)
  )
  .subscribe(data => {

    console.log('The event', data);

  });

ha
  .states
  .onChange
  .subscribe(state => console.log(state));

```
