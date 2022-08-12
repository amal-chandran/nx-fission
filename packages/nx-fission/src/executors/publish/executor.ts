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
import { execCmd, execCmdDetached } from '../../helpers/exec.helper';
import { transformSDK } from '../../helpers/sdk.helper';
import { getMeshSDK } from '../../mesh/.mesh';
import {
  createEnvironment,
  createFunction,
  createHTTPTrigger,
} from '../../providers/sdk.provider';

export default async function (
  options: PublishExecutorSchema,
  context: ExecutorContext
) {
  for await (const s of await runExecutor(
    parseTargetString(get(options, 'buildTarget')),
    {},
    context
  )) {
    // console.log(s);
  }
  // console.log(context);

  const proxyChildProcess = execCmdDetached('kubectl -n fission proxy -p 8685');

  const sdk = transformSDK(getMeshSDK());

  const applicationName = context.projectName;
  const appRoot = path.join(context.root, 'apps', applicationName);
  const distPath = path.join(context.root, 'dist');
  const distProjectPath = path.join(distPath, 'apps', applicationName);
  const zipPath = path.join(distPath, `${applicationName}.zip`);

  await zipFolderContents(distProjectPath, zipPath);

  const fissionConfigurationPath = path.join(appRoot, 'fission.yaml');

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
    } catch (error) {
      // Nothing to handle
    }

    try {
      await sdk.deletePackage({ package: currentFunctionName });
    } catch (error) {
      console.log(error);
      // Nothing to handle
    }

    execCmd(
      `fission package create --src ${zipPath}  --env ${currentEnvironmentName} --name ${currentFunctionName}`
    );

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
          await sdk.deleteHttp({ httpTrigger: get(httpTriggerConfig, 'name') });
        } catch (error) {
          //
        }

        await createHTTPTrigger(sdk, httpTriggerConfig);
      }
    }
  }

  proxyChildProcess.kill();

  return {
    success: true,
  };
}
