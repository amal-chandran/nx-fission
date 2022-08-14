import { ExecutorContext, parseTargetString, runExecutor } from '@nrwl/devkit';
import { PublishExecutorSchema } from './schema';

import fs from 'fs-extra';
import yaml from 'js-yaml';
import { get, has, isArray } from 'lodash';
import path from 'path';
import { zipFolderContents } from '../../helpers/archive.helper';
import {
  functionTransform,
  httpTriggerTransform,
} from '../../helpers/data-transform';
import { ExecuterException } from '../../helpers/exceptions.helper';
import { execCmd } from '../../helpers/exec.helper';
import { createKubeClient, createKubeProxy } from '../../helpers/k8s.helper';
import { transformSDK } from '../../helpers/sdk.helper';
import { getMeshSDK } from '../../mesh/.mesh';
import {
  createEnvironmentVariables,
  deleteEnvironmentVariables,
} from '../../providers/k8s.provider';
import {
  createEnvironment,
  createFunction,
  createHTTPTrigger,
} from '../../providers/sdk.provider';

export default async function (
  options: PublishExecutorSchema,
  context: ExecutorContext
) {
  let childProcess: Awaited<
    ReturnType<typeof createKubeProxy>
  >['proxyChildProcess'];

  try {
    const { proxyChildProcess } = await createKubeProxy();
    childProcess = proxyChildProcess;
    for await (const s of await runExecutor(
      parseTargetString(get(options, 'buildTarget')),
      {},
      context
    )) {
      //
    }

    const sdk = transformSDK(getMeshSDK());

    const { k8sApi } = createKubeClient();

    const applicationName = context.projectName;

    const fissionConfigurationPath = get(options, 'fissionConfig');
    const distPath = path.join(context.root, 'dist');
    const distProjectPath = get(options, 'outputPath');
    const zipPath = path.join(distPath, `${applicationName}.zip`);

    await zipFolderContents(distProjectPath, zipPath);

    const fissionConfigObject = yaml.load(
      fs.readFileSync(fissionConfigurationPath, 'utf8')
    );

    if (has(fissionConfigObject, 'environment')) {
      const globalEnvironment = get(fissionConfigObject, 'environment');
      if (isArray(globalEnvironment)) {
        for (const singleEnvironment of globalEnvironment) {
          await createEnvironment(sdk, singleEnvironment);
        }
      } else {
        await createEnvironment(sdk, globalEnvironment);
      }
    }

    const functions = get(fissionConfigObject, 'function');
    const defaultConfig = get(fissionConfigObject, 'default');

    for (const functionName in functions) {
      const functionConfig = await functionTransform(
        functionName,
        functions[functionName],
        defaultConfig
      );

      const currentFunctionName = get(functionConfig, 'name');
      const currentEnvironmentName = get(functionConfig, 'environment');

      try {
        await sdk.deleteFunction({ function: currentFunctionName });
      } catch {
        //
      }

      try {
        await sdk.deletePackage({ package: currentFunctionName });
      } catch (error) {
        //
      }

      execCmd(
        `fission package create --src ${zipPath}  --env ${currentEnvironmentName} --name ${currentFunctionName}`
      );

      try {
        await deleteEnvironmentVariables(k8sApi, functionConfig);
      } catch (error) {
        console.log(error);
      }

      try {
        const { configMapName, secretMapName } =
          await createEnvironmentVariables(
            k8sApi,
            functionConfig,
            defaultConfig
          );
        const functionNamespace = get(functionConfig, 'functionNamespace');

        functionConfig['configmaps'] = [
          { name: configMapName, namespace: functionNamespace },
        ];

        functionConfig['secrets'] = [
          { name: secretMapName, namespace: functionNamespace },
        ];
      } catch (error) {
        // console.log(error);
      }

      await createFunction(sdk, functionConfig);

      const functionEvents = get(functionConfig, 'event');

      for (const functionEvent of functionEvents) {
        if (has(functionEvent, 'http')) {
          const triggerData = get(functionEvent, 'http');

          const httpTriggerConfig = await httpTriggerTransform(
            functionConfig,
            triggerData
          );

          try {
            await sdk.deleteHttp({
              httpTrigger: get(httpTriggerConfig, 'name'),
            });
          } catch (error) {
            //
          }

          await createHTTPTrigger(sdk, httpTriggerConfig);
        }
      }
    }

    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof ExecuterException) {
      console.log(error.message);
    } else if (has(error, 'errors.0.extensions.responseBody')) {
      console.log(get(error, 'errors.0.extensions.responseBody'));
    } else {
      console.log(error);
    }

    return {
      success: false,
    };
  } finally {
    childProcess?.kill();
  }
}
