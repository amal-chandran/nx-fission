import express from 'express';
import http from 'http';
import { toNumber } from 'lodash';
import Module from 'module';
import morgan from 'morgan';
import process from 'process';
import { createHandlers } from './helpers';

//@ts-ignore
const originalLoader = Module._load;

const mappings = JSON.parse(process.env.NX_MAPPINGS);
const keys = Object.keys(mappings);
const fileToRun = process.env.NX_FILE_TO_RUN;
//@ts-ignore
Module._load = function (request, parent) {
  if (!parent) return originalLoader.apply(this, arguments);
  const match = keys.find((k) => request === k);
  if (match) {
    const newArguments = [...arguments];
    newArguments[0] = mappings[match];
    return originalLoader.apply(this, newArguments);
  } else {
    return originalLoader.apply(this, arguments);
  }
};

const fissionConfig = process.env.NX_FISSION_CONFIG;
const app = express();

// To catch unhandled exceptions thrown by user code async callbacks,
// these exceptions cannot be catched by try-catch in user function invocation code below
process.on('uncaughtException', (err) => {
  console.error(`Caught exception: ${err}`);
});

// Request logger
app.use(morgan('combined'));

const bodyParserLimit = process.env.BODY_PARSER_LIMIT || '1mb';

app.use(express.urlencoded({ extended: false, limit: bodyParserLimit }));
app.use(express.json({ limit: bodyParserLimit }));
app.use(express.raw({ limit: bodyParserLimit }));
app.use(express.text({ type: 'text/*', limit: bodyParserLimit }));

const server = http.createServer();

// Also mount the app here
server.on('request', app);

const port = toNumber(process.env.NX_PORT);

const host = process.env.NX_HOST as string;

(async () => {
  const functionRegistry = await createHandlers(app, fissionConfig);

  server.listen(port, host, () => {
    const serverBase = `http://${host}:${port}`;
    console.log('Server listening on', serverBase);

    for (const functionMetadata of functionRegistry) {
      console.log('Function:', functionMetadata.functionName);
      for (const currentEventMethod of functionMetadata.httpEvent.methods) {
        console.log(
          currentEventMethod,
          `${serverBase}${functionMetadata.httpEvent.url}`
        );
      }
    }
  });
})();
