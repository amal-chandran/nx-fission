import * as k8s from '@kubernetes/client-node';

export const createKubeClient = () => {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();

  const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

  return { kc, k8sApi };
};
