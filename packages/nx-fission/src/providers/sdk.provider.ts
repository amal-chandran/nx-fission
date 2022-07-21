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
