import { ExecutorContext, parseTargetString, runExecutor } from '@nrwl/devkit';
import { PublishExecutorSchema } from './schema';

import fs from 'fs-extra';
import yaml from 'js-yaml';
import { get, has, isArray } from 'lodash';
import path from 'path';
import { zipFolderContents } from '../../helpers/archive.helper';
import { transformSDK } from '../../helpers/sdk.helper';
import { getMeshSDK } from '../../mesh/.mesh';
import { createEnvironment } from '../../providers/sdk.provider';

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

  // const proxyChildProcess = execCmdDetached('kubectl -n fission proxy');
  const sdk = transformSDK(getMeshSDK());

  const applicationName = context.projectName;
  const appRoot = path.join(context.root, 'apps', applicationName);
  const distPath = path.join(context.root, 'dist');
  const distProjectPath = path.join(distPath, applicationName);
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
  for (const functionName in functions) {
    console.log('key', functionName);
    const functionConfig = functions[functionName];
    sdk.deleteFunction({ function: applicationName });
  }
  // console.log('functions', functions);
  // proxyChildProcess.kill();
  return {
    success: true,
  };
}
