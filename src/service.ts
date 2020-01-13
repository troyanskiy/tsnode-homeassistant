import { HomeAssistant } from './home-assistant';
import { HADomain, HAMessageType, HAServiceType, IHACallServiceMessage, IHAResultMessage } from './declarations';
import { Observable } from 'rxjs';
import { toggleServiceActionType } from './util';

export class HomeAssistantService {

  constructor(private hass: HomeAssistant) {

  }

  /**
   * Call service
   */
  call(domain: HADomain, service: HAServiceType, serviceDataOrEntity?: any): Observable<IHAResultMessage> {

    const pack: IHACallServiceMessage = {
      type: HAMessageType.CallService,
      domain,
      service
    };

    if (serviceDataOrEntity) {

      if (Array.isArray(serviceDataOrEntity)) {

        serviceDataOrEntity = {
          entity_id: serviceDataOrEntity.map(entity => this.mapEntityDomain(domain, entity))
        };

      } else if (typeof serviceDataOrEntity === 'string') {

        serviceDataOrEntity = {
          entity_id: this.mapEntityDomain(domain, serviceDataOrEntity)
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

  private mapEntityDomain(domain: HADomain, entity: string): string {
    if (!entity.startsWith(`${domain}.`)) {
      return `${domain}.${entity}`;
    }

    return entity;
  }

}
