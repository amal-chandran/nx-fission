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
import { execSync } from 'child_process';
import * as path from 'path';
import { NxFissionGeneratorSchema } from './schema';

interface NormalizedSchema extends NxFissionGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

function normalizeOptions(
  tree: Tree,
  options: NxFissionGeneratorSchema
): NormalizedSchema {
  const name = names(options.name).fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(tree).appsDir}/${projectDirectory}`;
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
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

  addDependenciesToPackageJson(tree, {}, { '@nrwl/node': currentNxVersion });

  addProjectConfiguration(tree, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    projectType: 'application',
    sourceRoot: `${normalizedOptions.projectRoot}/src`,
    targets: {
      build: {
        executor: '@nrwl/node:webpack',
        outputs: ['{options.outputPath}'],
        options: {
          outputPath: `dist/apps/${normalizedOptions.projectName}`,
          main: `apps/${normalizedOptions.projectName}/src/handlers/main.ts`,
          tsConfig: `apps/${normalizedOptions.projectName}/tsconfig.app.json`,
          buildableProjectDepsInPackageJsonType: 'dependencies',
          externalDependencies: 'none',
          generatePackageJson: true,
        },
      },
      publish: {
        executor: '@nx-fission/nx-fission:publish',
        options: {
          buildTarget: `${normalizedOptions.projectName}:build`,
        },
      },
      remove: {
        executor: '@nx-fission/nx-fission:remove',
      },
      lint: {
        executor: '@nrwl/linter:eslint',
        outputs: ['{options.outputFile}'],
        options: {
          lintFilePatterns: [`apps/${normalizedOptions.projectName}/**/*.ts`],
        },
      },
      test: {
        executor: '@nrwl/jest:jest',
        outputs: [`coverage/apps/${normalizedOptions.projectName}`],
        options: {
          jestConfig: `apps/${normalizedOptions.projectName}/jest.config.ts`,
          passWithNoTests: true,
        },
      },
    },
    tags: normalizedOptions.parsedTags,
  });

  addFiles(tree, normalizedOptions);

  installPackagesTask(tree);

  await formatFiles(tree);
}
