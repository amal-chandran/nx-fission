import fs from 'fs-extra';
import yaml from 'js-yaml';
import { clone, get, isString, set } from 'lodash';
import path from 'path';
import traverse from 'traverse';

function getYamlObject(filePath: string) {
  return yaml.load(fs.readFileSync(filePath, 'utf8'));
}

interface MapToKubeSpec {
  inputSpec: any;
  transformSpec: string;
  transformDefaultSpec: string;
}

export const mapToKubeSpec = ({
  inputSpec,
  transformSpec,
  transformDefaultSpec,
}: MapToKubeSpec) => {
  const docMain: any = getYamlObject(transformSpec);
  const docMainDefault: any = getYamlObject(transformDefaultSpec);

  const leafPaths = traverse(docMain).reduce(function (acc) {
    if (this.isLeaf) acc.push(this.path);
    return acc;
  }, []);

  const newObject = clone(docMain);

  for (const currentPath of leafPaths) {
    const selectedValue = get(docMain, currentPath);
    if (isString(selectedValue) && selectedValue.includes('$')) {
      const specPath = selectedValue.replace('$', '');
      const specValue = get(inputSpec, specPath);
      const defaultValue = get(docMainDefault, currentPath);

      set(newObject, currentPath, specValue || defaultValue);
    }
  }

  return newObject;
};

export const createSpecByType = (inputSpec: any, specType: string) => {
  const transformSpec = path.join(
    __dirname,
    '..',
    'kube-specs',
    `${specType}.yaml`
  );

  const transformDefaultSpec = path.join(
    __dirname,
    '..',
    'kube-specs-defaults',
    `${specType}.yaml`
  );

  return mapToKubeSpec({
    inputSpec,
    transformSpec,
    transformDefaultSpec,
  });
};
