import { defaultsDeep, fromPairs, get, has, isObject, toPairs } from 'lodash';

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

export const httpTriggerTransform = async (
  handlerData: any,
  httpTrigger: any
) => {
  httpTrigger['functionName'] = get(handlerData, 'name');

  return defaultsDeep(httpTrigger, handlerData);
};

export const environmentVariablesTransform = async (
  handlerData: any,
  defaultConfig: any
) => {
  const combinedConfig = defaultsDeep(
    get(handlerData, 'environment-variables'),
    get(defaultConfig, 'environment-variables')
  );

  const configMap = [];
  const secretMap = [];

  const configPairs = toPairs(combinedConfig);

  for (const [variableKey, variableValue] of configPairs) {
    if (isObject(variableValue)) {
      if (get(variableValue, 'type') == 'secret') {
        const base64EncodedValue = Buffer.from(
          get(variableValue, 'value')
        ).toString('base64');

        secretMap.push([variableKey, base64EncodedValue]);
      } else {
        configMap.push([variableKey, get(variableValue, 'value')]);
      }
    } else {
      configMap.push([variableKey, variableValue]);
    }
  }

  return { configMap: fromPairs(configMap), secretMap: fromPairs(secretMap) };
};
