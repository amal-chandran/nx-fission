// @ts-nocheck
export default {
  "name": "FissionCustomMap",
  "baseUrl": "http://localhost:8685/api/v1/namespaces/fission/services/controller:80/proxy/",
  "operations": [
    {
      "type": "Mutation",
      "field": "createEnvironments",
      "path": "/v2/environments",
      "method": "POST",
      "requestTypeName": "environment",
      "requestSample": "./json-samples/create-environment/create-environment.request.json",
      "responseTypeName": "environment_Output",
      "responseSample": "./json-samples/create-environment/create-environment.response.json"
    }
  ],
  "referencedSchema": {
    "$ref": "#/definitions/_schema",
    "definitions": {
      "date-time": {
        "type": "string",
        "format": "date-time",
        "title": "date-time"
      },
      "environment_Output": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "namespace": {
            "type": "string"
          },
          "uid": {
            "type": "string"
          },
          "resourceVersion": {
            "type": "string"
          },
          "generation": {
            "type": "integer"
          },
          "creationTimestamp": {
            "$ref": "#/definitions/date-time"
          }
        },
        "additionalProperties": false,
        "title": "environment_Output",
        "examples": [
          {
            "name": "node45",
            "namespace": "default",
            "uid": "830bad1c-3ebe-4130-9b10-f8483a6e2c61",
            "resourceVersion": "67463",
            "generation": 1,
            "creationTimestamp": "2022-07-05T07:47:07Z"
          }
        ]
      },
      "Mutation": {
        "type": "object",
        "title": "Mutation",
        "properties": {
          "createEnvironments": {
            "$ref": "#/definitions/environment_Output"
          }
        }
      },
      "mutationInput_createEnvironments_metadata_creationTimestamp": {
        "type": "null",
        "title": "mutationInput_createEnvironments_metadata_creationTimestamp"
      },
      "mutationInput_createEnvironments_metadata": {
        "type": "object",
        "properties": {
          "creationTimestamp": {
            "$ref": "#/definitions/mutationInput_createEnvironments_metadata_creationTimestamp"
          },
          "name": {
            "type": "string"
          },
          "namespace": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "title": "mutationInput_createEnvironments_metadata"
      },
      "mutationInput_createEnvironments_spec_builder_container_resources": {
        "type": "object",
        "title": "mutationInput_createEnvironments_spec_builder_container_resources"
      },
      "mutationInput_createEnvironments_spec_builder_container": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "resources": {
            "$ref": "#/definitions/mutationInput_createEnvironments_spec_builder_container_resources"
          }
        },
        "additionalProperties": false,
        "title": "mutationInput_createEnvironments_spec_builder_container"
      },
      "mutationInput_createEnvironments_spec_builder": {
        "type": "object",
        "properties": {
          "command": {
            "type": "string"
          },
          "container": {
            "$ref": "#/definitions/mutationInput_createEnvironments_spec_builder_container"
          },
          "image": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "title": "mutationInput_createEnvironments_spec_builder"
      },
      "mutationInput_createEnvironments_spec_keeparchive": {
        "type": "boolean",
        "title": "mutationInput_createEnvironments_spec_keeparchive"
      },
      "mutationInput_createEnvironments_spec_runtime": {
        "type": "object",
        "properties": {
          "container": {
            "$ref": "#/definitions/mutationInput_createEnvironments_spec_builder_container"
          },
          "image": {
            "type": "string"
          }
        },
        "additionalProperties": false,
        "title": "mutationInput_createEnvironments_spec_runtime"
      },
      "mutationInput_createEnvironments_spec": {
        "type": "object",
        "properties": {
          "builder": {
            "$ref": "#/definitions/mutationInput_createEnvironments_spec_builder"
          },
          "imagepullsecret": {
            "type": "string"
          },
          "keeparchive": {
            "$ref": "#/definitions/mutationInput_createEnvironments_spec_keeparchive"
          },
          "poolsize": {
            "type": "integer"
          },
          "resources": {
            "$ref": "#/definitions/mutationInput_createEnvironments_spec_builder_container_resources"
          },
          "runtime": {
            "$ref": "#/definitions/mutationInput_createEnvironments_spec_runtime"
          },
          "version": {
            "type": "integer"
          }
        },
        "additionalProperties": false,
        "title": "mutationInput_createEnvironments_spec"
      },
      "environment": {
        "type": "object",
        "properties": {
          "apiVersion": {
            "type": "string"
          },
          "kind": {
            "type": "string"
          },
          "metadata": {
            "$ref": "#/definitions/mutationInput_createEnvironments_metadata"
          },
          "spec": {
            "$ref": "#/definitions/mutationInput_createEnvironments_spec"
          }
        },
        "additionalProperties": false,
        "title": "environment",
        "examples": [
          {
            "apiVersion": "fission.io/v1",
            "kind": "Environment",
            "metadata": {
              "creationTimestamp": null,
              "name": "$name",
              "namespace": "default"
            },
            "spec": {
              "builder": {
                "command": "build",
                "container": {
                  "name": "",
                  "resources": {}
                },
                "image": "$builder"
              },
              "imagepullsecret": "",
              "keeparchive": false,
              "poolsize": 3,
              "resources": {},
              "runtime": {
                "container": {
                  "name": "",
                  "resources": {}
                },
                "image": "$runtime"
              },
              "version": 2
            }
          }
        ]
      },
      "MutationInput": {
        "type": "object",
        "title": "MutationInput",
        "properties": {
          "createEnvironments": {
            "$ref": "#/definitions/environment"
          }
        }
      },
      "_schema": {
        "type": "object",
        "title": "_schema",
        "properties": {
          "mutation": {
            "$ref": "#/definitions/Mutation"
          },
          "mutationInput": {
            "$ref": "#/definitions/MutationInput"
          }
        },
        "required": [
          "query"
        ]
      }
    }
  }
}