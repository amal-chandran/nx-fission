import { defaultsDeep, get, has } from 'lodash';

export const functionTransform = async (
  handlerName: string,
  handlerData: any,
  defaultConfig: any
) => {
  const extendedConfig = defaultsDeep(handlerData, defaultConfig);

  if (has(handlerData, 'name')) {
    extendedConfig['name'] = get(handlerData, 'name');
  } else {
    extendedConfig['name'] = handlerName;
  }

  if (!has(extendedConfig, 'packageName')) {
    extendedConfig['packageName'] = get(extendedConfig, 'name');
  }
  // console.log('handlerData', handlerData);
  if (!has(extendedConfig, 'packageNamespace')) {
    extendedConfig['packageNamespace'] =
      get(extendedConfig, 'fnNamespace') || get(extendedConfig, 'envNamespace');
  }

  return extendedConfig;
};
