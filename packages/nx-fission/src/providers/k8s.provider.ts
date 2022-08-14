import * as k8s from '@kubernetes/client-node';
import { get } from 'lodash';
import { environmentVariablesTransform } from '../helpers/data-transform';

export const createEnvironmentVariables = async (
  k8sApi: k8s.CoreV1Api,
  functionConfig: any,
  defaultConfig: any
) => {
  const functionName = get(functionConfig, 'name');
  const namespace = get(functionConfig, 'fnNamespace');

  const { configMap, secretMap } = await environmentVariablesTransform(
    functionConfig,
    defaultConfig
  );
  const configMapName = `${functionName}-config-map`;

  await createConfigMap(k8sApi, namespace, configMapName, configMap);

  const secretMapName = `${functionName}-secret-map`;

  await createSecretMap(k8sApi, namespace, secretMapName, secretMap);

  return { secretMapName, configMapName };
};

export const createSecretMap = (
  k8sApi: k8s.CoreV1Api,
  namespace: string,
  name: string,
  data: any
) => {
  const configMap = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      namespace,
      name,
    },
    data,
    type: 'Opaque',
  };

  return k8sApi.createNamespacedSecret(namespace, configMap);
};
export const createConfigMap = (
  k8sApi: k8s.CoreV1Api,
  namespace: string,
  name: string,
  data: any
) => {
  const configMap = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      namespace: namespace,
      name: name,
    },
    data,
  };

  return k8sApi.createNamespacedConfigMap(namespace, configMap);
};

export const deleteEnvironmentVariables = async (
  k8sApi: k8s.CoreV1Api,
  functionConfig: any
) => {
  const functionName = get(functionConfig, 'name');
  const namespace = get(functionConfig, 'functionNamespace');

  const configMapName = `${functionName}-config-map`;
  const secretMapName = `${functionName}-secret-map`;

  await k8sApi.deleteCollectionNamespacedConfigMap(
    namespace,
    undefined,
    undefined,
    undefined,
    `metadata.name=${configMapName}`
  );

  await k8sApi.deleteCollectionNamespacedSecret(
    namespace,
    undefined,
    undefined,
    undefined,
    `metadata.name=${secretMapName}`
  );
};
