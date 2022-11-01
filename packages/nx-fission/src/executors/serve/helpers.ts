import { Express } from 'express';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import { get, has } from 'lodash';
import path from 'path';
import { functionTransform } from '../../helpers/data-transform';

export const createHandlers = async (app: Express, fissionConfig: string) => {
  const fissionConfigObject = yaml.load(fs.readFileSync(fissionConfig, 'utf8'));

  const functions = get(fissionConfigObject, 'function');
  const defaultConfig = get(fissionConfigObject, 'default');

  const functionRegistry = [];

  for (const functionName in functions) {
    const functionConfig = await functionTransform(
      functionName,
      functions[functionName],
      defaultConfig
    );
    const handlerName = get(functionConfig, 'handler');
    const entrypoint = handlerName ? handlerName.split('.') : [];
    const modulepath = path.join(process.env.NX_BUILD_DIR, entrypoint[0] || '');

    const loadedFunction = loadFunction(modulepath, entrypoint[1]);

    for (const functionEvents of functionConfig.event) {
      if (!has(functionEvents, 'http')) continue;

      const httpEvent = get(functionEvents, 'http');

      registerFunctionHandler(app, loadedFunction, httpEvent);

      functionRegistry.push({ functionName, httpEvent });
    }
  }

  return functionRegistry;
};

const loadFunction = (modulepath, funcname) => {
  // Read and load the code. It's placed there securely by the fission runtime.
  try {
    // support v1 codepath and v2 entrypoint like 'foo', '', 'index.hello'
    const userFunction = funcname
      ? // eslint-disable-next-line @typescript-eslint/no-var-requires
        require(modulepath)[funcname]
      : require(modulepath);

    return userFunction;
  } catch (e) {
    console.error(`user code load error: ${e}`);
    return e;
  }
};

const registerFunctionHandler = (
  app: Express,
  userFunction: any,
  httpEvent: any
) => {
  const path = httpEvent.url;

  app.all(path, (req, res) => {
    if (!userFunction) {
      res.status(500).send('Generic container: no requests supported');
      return;
    }

    const context = {
      request: req,
      response: res,
      // TODO: context should also have: URL template params, query string
    };

    const callback = (status, body, headers?: any) => {
      if (!status) return;
      if (headers) {
        for (const name of Object.keys(headers)) {
          res.set(name, headers[name]);
        }
      }
      res.status(status).send(body);
    };

    //
    // Customizing the request context
    //
    // If you want to modify the context to add anything to it,
    // you can do that here by adding properties to the context.
    //

    if (userFunction.length <= 1) {
      // One or zero argument (context)
      let result;
      // Make sure their function returns a promise
      if (userFunction.length === 0) {
        result = Promise.resolve(userFunction());
      } else {
        result = Promise.resolve(userFunction(context));
      }
      result
        .then(({ status, body, headers }) => {
          callback(status, body, headers);
        })
        .catch((err) => {
          console.log(`Function error: ${err}`);
          callback(500, 'Internal server error');
        });
    } else {
      // 2 arguments (context, callback)
      try {
        userFunction(context, callback);
      } catch (err) {
        console.log(`Function error: ${err}`);
        callback(500, 'Internal server error');
      }
    }
  });
};
