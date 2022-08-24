# Nx Fission

A fission serverless plugin for nx workspace. Supports application & handler generation.
Building and publishing to the fission cluster.

- Plugin uses a custom yaml file (similar to serverless framework) instead of spec
- Main objective to simplify the migration of serverless users
- The project is extensively work in progress

## Install

Create nx workspace

```
npx create-nx-workspace@14.5.6 --preset=apps

```

Install nx-fission to workspace

```
npm i -D nx-fission
```

## Generate

To generate a fission application

```
npx nx generate nx-fission:application <application-name>
```

To generate a handler inside an application

```
npx nx generate nx-fission:handler <handler-name> --project=<application-name>
```

## File Tree

```
.
|-- fission.yaml
|-- project.json
|-- src
|   `-- handlers
|       `-- main.ts
|-- tsconfig.app.json
|-- tsconfig.json
`-- tsconfig.spec.json
```

## Fission Configuration

Structure of fission configuration used by nx-fission

- environment
  - For each application we need an environment
  - Only node js based environment are supported now
- environment-variables
  - By default environment variables are considered as config maps
  - Secrets are stored as secret maps
  - For each handler there will be a config map which will include the global and handler level variables
- default
  - Every handler will inherit those configurations
- function
  - (function-name)
    - handler: (file-name).(exported function name)
    - event
      - only http events are supported now
      - url defines the path to the same
    - name: The name for the handler will override the (function-name)
    - labels: labels used to identify the lambda instance
    - environment-variables
      - will override the global

```
environment:
  - name: backend-app-5f75b6ee-f041-456c-88d4-e9c6808c2fe1
    runtime: fission/node-env
    poolSize: 4
    builder: fission/node-builder

environment-variables:
  SAMPLE_CONFIG: ENV_NAME
  SAMPLE_SECRET:
    type: secret
    value: ENV_NAME

default:
  environment: backend-app-5f75b6ee-f041-456c-88d4-e9c6808c2fe1
  minimumScale: 1
  maximumScale: 1
  targetCPUPercent: 0
  specializationTimeout: 120
  functionNamespace: default
  environmentNamespace: default
  executorType: poolmgr
  functionTimeout: 60
  idleTimeout: 60
  concurrency: 500
  requestsPerPod: 1
function:
  main:
    handler: main.handler
    event:
      - http:
          url: /main
          methods: [GET, POST, PUT, PATCH]
    name: main
    description: My main function
    # environment: backend-app-5f75b6ee-f041-456c-88d4-e9c6808c2fe1
    labels:
      environment: dev
      application: analytics
    environment-variables:
      SAMPLE_CONFIG: ENV_NAME
      SAMPLE_SECRET:
        type: secret
        value: ENV_NAME

```
