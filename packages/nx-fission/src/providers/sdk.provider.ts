import { get } from 'lodash';
import { createSpecByType } from '../helpers/map-to-spec';
import { MeshSDK } from '../mesh/common-types';

export const createEnvironment = async (sdk: MeshSDK, fissionSpec: any) => {
  const envInput = createSpecByType(fissionSpec, 'environment');

  console.log(`Creating environment ${get(fissionSpec, 'name')}`);

  try {
    await sdk.createEnvironments({ object: envInput });

    console.log(`Created new ${get(fissionSpec, 'name')} environment`);
  } catch (error) {
    if (get(error, 'message').includes('already exists')) {
      console.log(`Environment ${get(fissionSpec, 'name')} already exists`);
      // throw new Error(`Environment ${get(fissionSpec, 'name')} already exists`);
    } else {
      console.log(error);
      // throw error;
    }
  }
};

export const createFunction = async (sdk: MeshSDK, fissionSpec: any) => {
  const envInput = createSpecByType(fissionSpec, 'function');

  console.log(`Creating function ${get(fissionSpec, 'name')}`);

  try {
    await sdk.createFunctions({ object: envInput });

    console.log(`Created new ${get(fissionSpec, 'name')} function`);
  } catch (error) {
    if (get(error, 'message').includes('already exists')) {
      throw new Error(`Function ${get(fissionSpec, 'name')} already exists`);
    } else {
      throw error;
    }
  }
};

export const createHTTPTrigger = async (sdk: MeshSDK, fissionSpec: any) => {
  const envInput = createSpecByType(fissionSpec, 'http-trigger');

  console.log(`Creating http trigger ${get(fissionSpec, 'name')}`);

  try {
    await sdk.createHttp({ object: envInput });

    console.log(`Created new ${get(fissionSpec, 'name')} http trigger`);
  } catch (error) {
    if (get(error, 'message').includes('already exists')) {
      throw new Error(
        `HTTP Trigger ${get(fissionSpec, 'name')} already exists`
      );
    } else {
      throw error;
    }
  }
};
