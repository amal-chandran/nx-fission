import * as k8s from '@kubernetes/client-node';
import axios from 'axios';
import delay from 'delay';
import { kubeBaseURL } from '../constants/kube.constants';
import { ExecuterException } from './exceptions.helper';
import { execCmdDetached, resolveOnCmdOut } from './exec.helper';
export const createKubeClient = () => {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();

  const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

  return { kc, k8sApi };
};

export const isK8SProxyUp = async () => {
  try {
    await axios.get(`${kubeBaseURL}/version`);
    return true;
  } catch (error) {
    return false;
  }
};

export const createKubeProxy = async () => {
  const proxyChildProcess = execCmdDetached('kubectl -n fission proxy -p 8685');

  await Promise.race([
    resolveOnCmdOut(proxyChildProcess.childProcess),
    delay(10000),
  ]);

  if (!(await isK8SProxyUp())) {
    throw new ExecuterException(
      'Kube proxy is not reachable! Check Kube is Up'
    );
  }

  return { proxyChildProcess };
};
