import { Subject } from 'rxjs';

export interface IHAConfig {
  host?: string;
  port?: number;
  token: string;
}

export enum HAMessageType {
  AuthRequired = 'auth_required',
  AuthOK = 'auth_ok',
  AuthInvalid = 'auth_invalid',
  Auth = 'auth',

  SubscribeEvents = 'subscribe_events',
  UnsubscribeEvents = 'unsubscribe_events',
  Event = 'event',

  Result = 'result',

  CallService = 'call_service',

  GetStates = 'get_states',

  Ping = 'ping',
  Pong = 'pong'
}

export interface IHAMessageBase {
  type: HAMessageType;

  [prop: string]: any;
}

export interface IHAConnectInit extends IHAMessageBase {
  type: HAMessageType.AuthRequired | HAMessageType.AuthOK;
  ha_version: string;
}

export interface IHAConnectAuthToken {
  type: HAMessageType.Auth;
  access_token: string;
}

export enum HAConnectionStatus {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Authenticating = 'authenticating',
  Connected = 'connected'
}

export interface IHAConnectAuthInvalid extends IHAMessageBase {
  type: HAMessageType.AuthInvalid;
  message: string;
}

export interface IHAMessageWithId extends IHAMessageBase {
  id?: number;
}

export interface IEventSubscriptionEntry {
  id: number;
  type: string;
  obs: Subject<IHAEvent>;
}

export interface IHAMessageEvent extends IHAMessageWithId {
  type: HAMessageType.Event
  event: IHAEvent;
}

export interface IHAEvent<T = any> {
  data: T;
  event_type: string;
  time_fired: string;
  origin: string;
  context?: IHAEventContext;
}

export interface IHAEventStateChangeData {
  entity_id: string;
  old_state: IHAEntityState | null;
  new_state: IHAEntityState | null;
}

export interface IHAEventContext {
  id: string;
  parent_id: string | null;
  user_id: string | null;
}

export interface IHASubscribeToEvent extends IHAMessageWithId {
  type: HAMessageType.SubscribeEvents;
  event_type?: string;
}

export enum HADomain {
  Light = 'light',
  Switch = 'switch',
  Sensor = 'sensor'
}

export enum HAServiceActionType {
  TurnOn = 'turn_on',
  TurnOff = 'turn_off',
  Toggle = 'toggle'
}

export interface IHACallServiceMessage extends IHAMessageWithId {
  type: HAMessageType.CallService;
  domain: HADomain;
  service: HAServiceActionType;
  service_data?: any;
}

export interface IHAResultMessage<T = any> extends IHAMessageWithId {
  type: HAMessageType.Result;
  success: boolean;
  result: T;
  error?: {
    code: number;
    message: string;
  }
}

export interface IHAEntityState {
  entity_id: string;
  state: string;
  attributes: any;
  last_changed: string;
  last_updated: string;
  context: any;
}
