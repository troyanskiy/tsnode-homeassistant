import { HomeAssistant } from './index';
import { HADomain, HAMessageType, HAServiceActionType, IHACallServiceMessage, IHAResultMessage } from './declarations';
import { Observable } from 'rxjs';
import { toggleServiceActionType } from './util';

export class HomeAssistantService {

  constructor(private hass: HomeAssistant) {

  }

  /**
   * Call service
   */
  call(domain: HADomain, service: HAServiceActionType, serviceDataOrEntity?: any): Observable<IHAResultMessage> {

    const pack: IHACallServiceMessage = {
      type: HAMessageType.CallService,
      domain,
      service
    };

    if (serviceDataOrEntity) {

      if (typeof serviceDataOrEntity === 'string') {

        if (!serviceDataOrEntity.startsWith(`${domain}.`)) {
          serviceDataOrEntity = `${domain}.${serviceDataOrEntity}`;
        }

        serviceDataOrEntity = {
          entity_id: serviceDataOrEntity
        }

      }

      pack.service_data = serviceDataOrEntity;
    }

    return this.hass.sendWithIdAndResult(pack);

  }

  /**
   * Toggle event
   */
  toggle(domain: HADomain, entities: string[] | string, force?: boolean): Observable<IHAResultMessage> {
    return this.call(
      domain,
      toggleServiceActionType(force),
      {
        entity_id: entities
      }
    );
  }

}
