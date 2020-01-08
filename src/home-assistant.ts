import {
  HAConnectionStatus,
  HAMessageType,
  IHAConfig,
  IHAConnectAuthInvalid,
  IHAConnectAuthToken,
  IHAConnectInit,
  IHAMessageBase,
  IHAMessageWithId,
  IHAResultMessage
} from './declarations';
import * as WebSocket from 'ws';
import { ErrorEvent, MessageEvent } from 'ws';
import { BehaviorSubject, fromEvent, interval, Observable, of, Subject } from 'rxjs';
import { catchError, filter, map, take, tap, timeout } from 'rxjs/operators';
import { HomeAssistantEvents } from './events';
import { HomeAssistantService } from './service';
import { HomeAssistantEntities } from './entities';


export class HomeAssistant {

  events: HomeAssistantEvents;
  service: HomeAssistantService;
  entities: HomeAssistantEntities;

  get ready$(): Observable<void> {

    let obs: Observable<any>;

    if (this.connectionStatus === HAConnectionStatus.Connected) {
      obs = of('');
    } else {
      obs = this.connectionStatus$
        .pipe(
          filter(status => status === HAConnectionStatus.Connected)
        );
    }

    return obs
      .pipe(
        take(1)
      );

  }

  connectionStatus$ = new BehaviorSubject<HAConnectionStatus>(HAConnectionStatus.Disconnected);
  connectionStatus: HAConnectionStatus = HAConnectionStatus.Disconnected;

  haVersion = '';

  wsMessage$ = new Subject<IHAMessageBase>();

  timeout = 5000;
  pingInterval = 2000;

  private ws: WebSocket | null = null;

  private resultSubjects: { [id: number]: Subject<IHAResultMessage> } = {};

  private connectionId = 0;

  private id = 1;

  private pingSend = false;
  private lastMessageTime = 0;

  constructor(private config: IHAConfig) {

    this.config.host = this.config.host || '127.0.0.1';
    this.config.port = this.config.port || 8123;

    if (!this.config.token) {
      throw new Error('Missing token');
    }

    this.events = new HomeAssistantEvents(this);
    this.service = new HomeAssistantService(this);
    this.entities = new HomeAssistantEntities(this);

    this.init();

  }

  /**
   * Returns next id for WS
   */
  getNextId(): number {
    return this.id++;
  }


  /**
   * Send to HA with ID
   */
  sendWithIdAndResult(data: IHAMessageWithId): Observable<IHAResultMessage> {

    if (this.connectionStatus !== HAConnectionStatus.Connected) {

      return of({
        id: 0,
        type: HAMessageType.Result,
        success: false,
        result: null,
        error: {
          code: -1,
          message: 'Not connected to HA'
        }
      } as IHAResultMessage);
    }

    if (!data.id) {
      data.id = this.getNextId();
    }

    const reqConnectionId = this.connectionId;

    this.resultSubjects[data.id] = new Subject<IHAResultMessage>();

    this.send(data);

    return this.resultSubjects[data.id]
      .pipe(
        timeout(this.timeout),
        catchError(() => {

          if (this.connectionId === reqConnectionId) {
            console.log('Timeout. Reconnecting');
            this.reconnect();
          }

          return of({
            id: data.id,
            type: HAMessageType.Result,
            success: false,
            result: null,
            error: {
              code: -2,
              message: 'Timeout'
            }
          } as IHAResultMessage)
        })
        // catchError(() => throwError({
        //   id: 0,
        //   type: HAMessageType.Result,
        //   success: false,
        //   result: null,
        //   error: {
        //     code: -2,
        //     message: 'Timeout'
        //   }
        // } as IHAResultMessage))
      );

  }


  /**
   * Main init
   */
  private init() {

    // Need to auth
    this.wsMessage$
      .pipe(
        filter($event => $event.type === HAMessageType.AuthRequired)
      )
      .subscribe(($event: IHAConnectInit) => this.sendAuth($event));

    // Auth OK
    this.wsMessage$
      .pipe(
        filter($event => $event.type === HAMessageType.AuthOK)
      )
      .subscribe(($event: IHAConnectInit) => this.setAuthenticated($event));

    // Auth fail
    this.wsMessage$
      .pipe(
        filter($event => $event.type === HAMessageType.AuthInvalid)
      )
      .subscribe(($event: IHAConnectAuthInvalid) => this.authInvalid($event));

    // HA Results
    this.wsMessage$
      .pipe(
        filter(($event: IHAResultMessage) =>
          $event.type === HAMessageType.Result || $event.type === HAMessageType.Pong
        )
      )
      .subscribe($event => this.handleHAResult($event));

    interval(this.pingInterval)
      .pipe(
        filter(() =>
          !this.pingSend
          && this.lastMessageTime + this.pingInterval < Date.now()
          && this.connectionStatus === HAConnectionStatus.Connected),
      )
      .subscribe(
        () => this.ping()
      );


    // Connect to HA
    this.connect();

  }

  /**
   * Main connect
   */
  private connect() {

    this.connectionId++;

    const config = this.config;

    const url = `ws://${config.host}:${config.port}/api/websocket`;

    this.updateConnectionStatus(HAConnectionStatus.Connecting);

    console.log('Connecting to HA ', url);

    this.ws = new WebSocket(url);

    fromEvent(this.ws, 'open')
      .pipe(
        take(1)
      )
      .subscribe(() => {
        console.log('HA WebSocket Connected');
      });

    fromEvent(this.ws, 'error')
      .pipe(
        take(1)
      )
      .subscribe((data: ErrorEvent) => {
        console.log('HA Connection Error: ', data.message)
      });

    const messagesSubscription = fromEvent(this.ws, 'message')
      .pipe(
        map(($event: MessageEvent) => JSON.parse($event.data as string)),
        tap($event => {
          // console.log('Received from HA', $event);
          this.lastMessageTime = Date.now();
        })
      )
      .subscribe(this.wsMessage$);

    fromEvent(this.ws, 'close')
      .pipe(
        take(1)
      )
      .subscribe(() => {
        console.log('HA Disconnected');

        messagesSubscription.unsubscribe();

        this.ws = null;

        setTimeout(() => this.connect(), 2000);
      });


  }

  /**
   * Reconnect to HA
   */
  private reconnect() {
    if (this.ws) {
      this.ws.terminate();
    }
  }

  /**
   * General send data to ha
   */
  private send(data: IHAMessageBase) {
    console.log('Send to HA', data);
    this.ws && this.ws.send(JSON.stringify(data));
  }

  /**
   * Send auth token
   */
  private sendAuth($event: IHAConnectInit) {

    console.log('Sending auth with access token');

    this.updateConnectionStatus(HAConnectionStatus.Authenticating);

    this.haVersion = $event.ha_version;

    this.send({
      type: HAMessageType.Auth,
      access_token: this.config.token
    } as IHAConnectAuthToken);

  }

  /**
   * Set auth success
   */
  private setAuthenticated($event: IHAConnectInit) {

    console.log('Authenticated with HA');

    this.id = 1;

    this.pingSend = false;

    this.updateConnectionStatus(HAConnectionStatus.Connected);

    this.haVersion = $event.ha_version;

  }

  /**
   * Handle invalid token
   */
  private authInvalid($event: IHAConnectAuthInvalid) {
    console.log(`Authentication fail with message "${$event.message}"`);

    this.ws && this.ws.close();
  }

  /**
   * Handle HS result message
   * @param $event
   */
  private handleHAResult($event: IHAResultMessage) {

    if (!$event.id) {
      return;
    }

    const subject = this.resultSubjects[$event.id];

    if (subject) {
      subject.next($event);
      subject.complete();
    }

    delete this.resultSubjects[$event.id];

  }

  private updateConnectionStatus(status: HAConnectionStatus) {
    this.connectionStatus = status;
    this.connectionStatus$.next(this.connectionStatus);
  }

  /**
   * Send ping
   */
  private ping() {

    console.log('Ping');

    this.pingSend = true;

    this
      .sendWithIdAndResult({
        type: HAMessageType.Ping
      })
      .subscribe((data: IHAResultMessage) => {
        if (data.type !== HAMessageType.Result) {
          console.log('Pong');
        }
        this.pingSend = false;
      });
  }

}
