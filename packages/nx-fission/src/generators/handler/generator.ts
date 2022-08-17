import {
  formatFiles,
  generateFiles,
  names,
  offsetFromRoot,
  ProjectConfiguration,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import jsYaml from 'js-yaml';
import { get, set } from 'lodash';
import * as path from 'path';
import { HandlerGeneratorSchema } from './schema';
interface NormalizedSchema extends HandlerGeneratorSchema {
  handlerName: string;
  projectName: string;
  projectRoot: string;
}

function normalizeOptions(
  project: ProjectConfiguration,

  options: HandlerGeneratorSchema
): NormalizedSchema {
  const handlerName = names(options.name).fileName;
  const projectDirectory = options.directory
    ? names(options.directory).fileName
    : null;

  const projectName = options.project;

  const projectRoot = projectDirectory
    ? `${project.sourceRoot}/${projectDirectory}`
    : `${project.sourceRoot}/handlers`;

  return {
    ...options,
    handlerName,
    projectName,
    projectRoot,
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

async function updateFissionConfig(
  tree: Tree,
  normalizedOptions: NormalizedSchema,
  project: ProjectConfiguration
) {
  const fissionConfig = path.join(project.root, 'fission.yaml');

  if (tree.exists(fissionConfig)) {
    const fissionYamlObject: any = jsYaml.load(
      tree.read(fissionConfig, 'utf-8')
    );

    set(fissionYamlObject, `function.${normalizedOptions.handlerName}`, {
      handler: `${normalizedOptions.handlerName}.handler`,
      event: [
        {
          http: {
            url: `/${normalizedOptions.handlerName}`,
            methods: ['GET', 'POST', 'PUT', 'PATCH'],
          },
        },
      ],
      name: `${normalizedOptions.handlerName}`,
      description: `My ${normalizedOptions.handlerName} function`,
      labels: {
        environment: 'dev',
        application: 'analytics',
      },
      'environment-variables': {
        SAMPLE_CONFIG: 'ENV_NAME',
        SAMPLE_SECRET: {
          type: 'secret',
          value: 'ENV_NAME',
        },
      },
    });

    tree.write(fissionConfig, jsYaml.dump(fissionYamlObject));
  } else {
    console.log('Fission config not found in project root');
  }
}

export default async function (tree: Tree, options: HandlerGeneratorSchema) {
  const project = readProjectConfiguration(tree, options.project);

  const normalizedOptions = normalizeOptions(project, options);

  const additionalEntryPoints: Array<any> = get(
    project,
    'targets.build.options.additionalEntryPoints',
    []
  );

  set(
    project,
    `targets.build.options.additionalEntryPoints.${additionalEntryPoints.length}`,
    {
      entryName: normalizedOptions.handlerName,
      entryPath: `${normalizedOptions.projectRoot}/${normalizedOptions.handlerName}.ts`,
    }
  );

  updateProjectConfiguration(tree, options.project, project);

  addFiles(tree, normalizedOptions);

  updateFissionConfig(tree, normalizedOptions, project);

  await formatFiles(tree);
}
