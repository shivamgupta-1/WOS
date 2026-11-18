const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "Wall of Stability API",
    version: "1.0.0",
    description: "API for monitored applications, health checks, incidents, domains, and AWS observability.",
  },
  servers: [{ url: "/api", description: "API base path" }],
  tags: [
    { name: "Applications", description: "Application records and health checks" },
    { name: "Incidents", description: "Application health history" },
    { name: "Domains", description: "Application domains" },
    { name: "AWS", description: "AWS instance observability" },
  ],
  paths: {
    "/applications/application": {
      get: {
        tags: ["Applications"],
        summary: "List applications",
        responses: {
          "200": {
            description: "Applications retrieved",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } },
          },
        },
      },
      post: {
        tags: ["Applications"],
        summary: "Create an application",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ApplicationInput" } } },
        },
        responses: {
          "201": {
            description: "Application created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/applications/healthSnapshot": {
      get: {
        tags: ["Applications"],
        summary: "Run health checks for all applications",
        description: "Probes registered application health-check URLs and stores the results before responding.",
        responses: {
          "200": {
            description: "Health checks completed",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } },
          },
          "500": { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/applications/healthSnapshotStatic": {
      get: {
        tags: ["Applications"],
        summary: "List saved health snapshots",
        responses: {
          "200": {
            description: "Saved health records retrieved",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } },
          },
        },
      },
    },
    "/applications/application/{id}": {
      parameters: [{ $ref: "#/components/parameters/Id" }],
      get: {
        tags: ["Applications"],
        summary: "Get an application",
        responses: {
          "200": {
            description: "Application retrieved",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      put: {
        tags: ["Applications"],
        summary: "Update an application",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ApplicationInput" } } },
        },
        responses: {
          "200": {
            description: "Application updated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Applications"],
        summary: "Delete an application",
        responses: {
          "200": {
            description: "Application deleted",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/applications/application/{id}/incidents": {
      parameters: [{ $ref: "#/components/parameters/Id" }],
      get: {
        tags: ["Incidents"],
        summary: "Get application incident history",
        parameters: [
          {
            name: "days",
            in: "query",
            description: "History lookback window",
            required: false,
            schema: { type: "integer", enum: [1, 7, 30], default: 1 },
          },
        ],
        responses: {
          "200": {
            description: "Incident history retrieved",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/domains/domain": {
      get: {
        tags: ["Domains"],
        summary: "List domains",
        responses: {
          "200": {
            description: "Domains retrieved",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } },
          },
        },
      },
      post: {
        tags: ["Domains"],
        summary: "Create a domain",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/DomainInput" } } },
        },
        responses: {
          "201": {
            description: "Domain created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/domains/domain/{id}": {
      parameters: [{ $ref: "#/components/parameters/Id" }],
      get: {
        tags: ["Domains"],
        summary: "Get a domain",
        responses: {
          "200": {
            description: "Domain retrieved",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      put: {
        tags: ["Domains"],
        summary: "Rename a domain",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/DomainInput" } } },
        },
        responses: {
          "200": {
            description: "Domain updated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Domains"],
        summary: "Delete a domain",
        responses: {
          "200": {
            description: "Domain deleted",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/aws/application/{instanceId}": {
      get: {
        tags: ["AWS"],
        summary: "Get EC2 application health",
        description: "Returns EC2 instance details, latest CloudWatch metrics, and recent log events. Set AWS_LOG_GROUP_NAME to the exact CloudWatch Logs group name; defaults to api.log.",
        parameters: [
          {
            name: "instanceId",
            in: "path",
            required: true,
            schema: { type: "string", pattern: "^i-[a-fA-F0-9]{8,17}$" },
            example: "i-0123456789abcdef0",
          },
        ],
        responses: {
          "200": {
            description: "Application health retrieved",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApplicationHealthResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": {
            description: "EC2 instance or CloudWatch Logs group not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "502": {
            description: "AWS authentication, authorization, or service request failed",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "503": {
            description: "AWS service is throttling or temporarily unavailable",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/aws/application/{instanceId}/metrics": {
      get: {
        tags: ["AWS"],
        summary: "Get EC2 application metrics",
        description: "Returns the EC2 instance details and latest CloudWatch metrics without querying CloudWatch Logs.",
        parameters: [
          {
            name: "instanceId",
            in: "path",
            required: true,
            schema: { type: "string", pattern: "^i-[a-fA-F0-9]{8,17}$" },
            example: "i-0123456789abcdef0",
          },
        ],
        responses: {
          "200": {
            description: "EC2 metrics retrieved",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApplicationMetricsResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "502": {
            description: "AWS authentication, authorization, or service request failed",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "503": {
            description: "AWS service is throttling or temporarily unavailable",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
  },
  components: {
    parameters: {
      Id: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
      },
    },
    responses: {
      BadRequest: {
        description: "Invalid request",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
      NotFound: {
        description: "Requested resource not found",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
      ServerError: {
        description: "Internal server error",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          status: { type: "string" },
          data: { type: "object", additionalProperties: true },
          message: { type: "string" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "failed" },
          error: { type: "string" },
        },
        required: ["error"],
      },
      ApplicationInput: {
        type: "object",
        required: ["name", "url", "teamslink", "email", "description", "domainId"],
        properties: {
          name: { type: "string" },
          url: { type: "string", format: "uri" },
          teamslink: { type: "string", format: "uri" },
          email: { type: "string", format: "email" },
          description: { type: "string" },
          domainId: { type: "string" },
          failureThreshold: { type: "integer", minimum: 1, maximum: 10, default: 2 },
          awsInstanceId: { type: "string", nullable: true, pattern: "^i-[a-fA-F0-9]{8,17}$" },
        },
      },
      DomainInput: {
        type: "object",
        required: ["name"],
        properties: { name: { type: "string" } },
      },
      ApplicationHealthResponse: {
        type: "object",
        required: ["application", "metrics", "logs"],
        properties: {
          application: {
            type: "object",
            required: ["instanceId", "state", "region"],
            properties: {
              instanceId: { type: "string", example: "i-0123456789abcdef0" },
              name: { type: "string", nullable: true, example: "payment-api" },
              state: { type: "string", example: "running" },
              instanceType: { type: "string", nullable: true, example: "t2.micro" },
              privateIp: { type: "string", nullable: true, example: "10.0.0.10" },
              publicIp: { type: "string", nullable: true, example: "203.0.113.10" },
              region: { type: "string", example: "ap-southeast-2" },
            },
          },
          metrics: {
            type: "object",
            required: ["cpu", "memory", "disk", "networkIn", "networkOut"],
            properties: {
              cpu: { type: "number", nullable: true },
              memory: { type: "number", nullable: true },
              disk: { type: "number", nullable: true },
              networkIn: { type: "number", nullable: true },
              networkOut: { type: "number", nullable: true },
            },
          },
          logs: {
            type: "array",
            items: {
              type: "object",
              required: ["timestamp", "message"],
              properties: {
                timestamp: { type: "string", format: "date-time" },
                message: { type: "string" },
              },
            },
          },
        },
      },
      ApplicationMetricsResponse: {
        type: "object",
        required: ["application", "metrics"],
        properties: {
          application: { $ref: "#/components/schemas/ApplicationHealthResponse/properties/application" },
          metrics: { $ref: "#/components/schemas/ApplicationHealthResponse/properties/metrics" },
        },
      },
    },
  },
} as const;

export default swaggerDocument;
