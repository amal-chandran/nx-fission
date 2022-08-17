import {
  addDependenciesToPackageJson,
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  installPackagesTask,
  names,
  offsetFromRoot,
  Tree,
} from '@nrwl/devkit';
import { getRelativePathToRootTsConfig } from '@nrwl/workspace/src/utilities/typescript';
import { execSync } from 'child_process';
import { get } from 'lodash';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { runtimeBuilderMap } from '../../constants/fission.constants';
import { NxFissionGeneratorSchema } from './schema';
interface NormalizedSchema extends NxFissionGeneratorSchema {
  projectName: string;
  handlerName: string;
  builder: string;
  environmentName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

function normalizeOptions(
  tree: Tree,
  options: NxFissionGeneratorSchema
): NormalizedSchema {
  const projectName = names(options.name).fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${projectName}`
    : projectName;

  const projectRoot = `${getWorkspaceLayout(tree).appsDir}/${projectDirectory}`;
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  const builder = get(runtimeBuilderMap, options.runtime);
  const environmentName = `${names(options.name).name}-${uuidv4()}`;
  const handlerName = names(options.handler).fileName;

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
    environmentName,
    builder,
    handlerName,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
    rootTsConfigPath: getRelativePathToRootTsConfig(tree, options.projectRoot),
  };

  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    options.projectRoot,
    templateOptions
  );
}

export default async function (tree: Tree, options: NxFissionGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);

  const currentNxVersion = execSync('nx --version') + '';
  const currentNxVersionTrimmed = currentNxVersion.replace(
    /(\r\n|\n|\r)/gm,
    ''
  );

  addDependenciesToPackageJson(
    tree,
    {},
    { '@nrwl/node': currentNxVersionTrimmed }
  );

  addProjectConfiguration(tree, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    projectType: 'application',
    sourceRoot: `${normalizedOptions.projectRoot}/src`,
    targets: {
      build: {
        executor: '@nrwl/node:webpack',
        outputs: ['{options.outputPath}'],
        options: {
          outputPath: `dist/apps/${normalizedOptions.projectDirectory}`,
          main: `apps/${normalizedOptions.projectDirectory}/src/handlers/${normalizedOptions.handlerName}.ts`,
          tsConfig: `apps/${normalizedOptions.projectDirectory}/tsconfig.app.json`,
          buildableProjectDepsInPackageJsonType: 'dependencies',
          externalDependencies: 'none',
          generatePackageJson: true,
          outputFileName: `${normalizedOptions.handlerName}.js`,
        },
      },
      publish: {
        executor: 'nx-fission:publish',
        options: {
          buildTarget: `${normalizedOptions.projectName}:build`,
          outputPath: `dist/apps/${normalizedOptions.projectDirectory}`,
          fissionConfig: `apps/${normalizedOptions.projectDirectory}/fission.yaml`,
        },
      },
      // remove: {
      //   executor: '@nx-fission/nx-fission:remove',
      // },
      // lint: {
      //   executor: '@nrwl/linter:eslint',
      //   outputs: ['{options.outputFile}'],
      //   options: {
      //     lintFilePatterns: [`apps/${normalizedOptions.projectRoot}/**/*.ts`],
      //   },
      // },
      // test: {
      //   executor: '@nrwl/jest:jest',
      //   outputs: [`coverage/apps/${normalizedOptions.projectDirectory}`],
      //   options: {
      //     jestConfig: `apps/${normalizedOptions.projectDirectory}/jest.config.ts`,
      //     passWithNoTests: true,
      //   },
      // },
    },
    tags: normalizedOptions.parsedTags,
  });

  addFiles(tree, normalizedOptions);

  installPackagesTask(tree);

  await formatFiles(tree);
}
