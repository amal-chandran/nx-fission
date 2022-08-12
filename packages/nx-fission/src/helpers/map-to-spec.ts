import fs from 'fs-extra';
import yaml from 'js-yaml';
import { cloneDeepWith, get, has, isString } from 'lodash';
import path from 'path';

interface MapToKubeSpec {
  inputSpec: any;
  transformSpec: string;
}
export const mapToKubeSpec = ({ inputSpec, transformSpec }: MapToKubeSpec) => {
  const doc: any = yaml.load(fs.readFileSync(transformSpec, 'utf8'));

  const customizer = (
    input: any,
    inputPath: any,
    ordinalObject: any,
    stack: any
  ) => {
    if (isString(input)) {
      if (input.includes('$')) {
        const specPath = input.replace('$', '');
        if (has(inputSpec, specPath)) {
          return get(inputSpec, specPath);
        } else {
          throw new Error(`Path not found in args:${specPath}`);
        }
      }
    }
  };

  return cloneDeepWith(doc, customizer);
};

export const createSpecByType = (inputSpec: any, specType: string) => {
  return mapToKubeSpec({
    inputSpec,
    transformSpec: path.join(__dirname, '..', 'kube-specs', `${specType}.yaml`),
  });
};
