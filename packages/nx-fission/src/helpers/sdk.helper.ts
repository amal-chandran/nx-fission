import { fromPairs, get, toPairs } from 'lodash';
import { getMeshSDK } from './../mesh/.mesh';

type sdk = ReturnType<typeof getMeshSDK>;

export const transformSDK = (sdk: sdk) => {
  const sdkPairs = toPairs(sdk);

  const mappedSDK = sdkPairs.map(([functionName, functionDefinition]) => [
    functionName,
    async (...args) => responseSDK(await functionDefinition.apply(sdk, args)),
  ]);

  return fromPairs(mappedSDK) as sdk;
};

export const responseSDK = <T>(response: T): T => {
  // return response;
  if (response instanceof Error) {
    if (get(response, 'errors.0.message') == 'Unexpected response') {
      throw new Error(get(response, 'errors.0.extensions.responseText'));
    } else {
      throw response;
    }
  } else {
    return response;
  }
};
