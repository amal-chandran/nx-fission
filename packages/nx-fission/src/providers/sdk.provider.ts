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
    }
  }
};

export const createFunction = async (sdk: MeshSDK, fissionSpec: any) => {
  const envInput = createSpecByType(fissionSpec, 'function');

  console.log(`Creating function ${get(fissionSpec, 'name')}`);

  try {
    // console.log('envInput', envInput);
    const functionResponse = await sdk.createFunctions({ object: envInput });
    // console.log('functions', functionResponse);
    console.log(`Created new ${get(fissionSpec, 'name')} function`);
  } catch (error) {
    if (get(error, 'message').includes('already exists')) {
      console.log(`Function ${get(fissionSpec, 'name')} already exists`);
    }
    console.log('error', error);
  }
};
