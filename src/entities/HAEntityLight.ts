import { HALightSupportFeatureFlag, IHAEntityState } from '../declarations';
import { clamp } from '../util';
import { HAEntitySwitch } from './HAEntitySwitch';

export class HAEntityLight extends HAEntitySwitch {
  attributes: IHAEntityLightAttributes;

  attributesToUpdate: IHAEntityLightAttributesBase = {};

  supports = {
    brightness: false,
    colorTemp: false,
    effect: false,
    flash: false,
    color: false,
    transition: false,
    whiteValue: false,
  };

  getBrightnessRaw(): number | null {
    return this.attributes.brightness ?? null;
  }

  getColorTemp(): number | null {
    return this.attributes.color_temp ?? null;
  }

  getColorHS(): [number, number] | null {
    return this.attributes.hs_color ?? null;
  }

  getColorRGB(): [number, number, number] | null {
    return this.attributes.rgb_color ?? null;
  }

  getColorXY(): [number, number] | null {
    return this.attributes.xy_color ?? null;
  }

  setBrightnessRaw(value: number): HAEntityLight {
    if (value < 0 || value > 255) {
      console.warn(
        'Trying to set brightness out of range 0 <= B <= 255. Value: ' + value,
      );
      value = clamp(value, 0, 255);
    }

    this.attributesToUpdate.brightness = value;

    return this;
  }

  setBrightnessPercent(value: number): HAEntityLight {
    if (value < 0 || value > 100) {
      console.warn(
        'Trying to set brightness percent out of range 0 <= B <= 100. Value: ' +
          value,
      );
      value = clamp(value, 0, 100);
    }

    return this.setBrightnessRaw(Math.round((value / 100) * 255));
  }

  setStateFromHA(state: IHAEntityState, skipSaveState: boolean = false) {
    super.setStateFromHA(state, skipSaveState);

    if (!this.supports) {
      this.supports = {} as any;
    }

    this.supports.brightness = !!(
      this.attributes.supported_features & HALightSupportFeatureFlag.BRIGHTNESS
    );
    this.supports.colorTemp = !!(
      this.attributes.supported_features & HALightSupportFeatureFlag.COLOR_TEMP
    );
    this.supports.effect = !!(
      this.attributes.supported_features & HALightSupportFeatureFlag.EFFECT
    );
    this.supports.flash = !!(
      this.attributes.supported_features & HALightSupportFeatureFlag.FLASH
    );
    this.supports.color = !!(
      this.attributes.supported_features & HALightSupportFeatureFlag.COLOR
    );
    this.supports.transition = !!(
      this.attributes.supported_features & HALightSupportFeatureFlag.TRANSITION
    );
    this.supports.whiteValue = !!(
      this.attributes.supported_features & HALightSupportFeatureFlag.WHITE_VALUE
    );
  }
}

interface IHAEntityLightAttributesBase {
  brightness?: number;
  color_temp?: number;
  hs_color?: [number, number];
  rgb_color?: [number, number, number];
  xy_color?: [number, number];
}

interface IHAEntityLightAttributes extends IHAEntityLightAttributesBase {
  supported_features: number;

  friendly_name?: string;

  min_mireds?: number;
  max_mireds?: number;
}
