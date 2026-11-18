import {
  DescribeInstancesCommand,
  EC2Client,
  type Instance,
} from "@aws-sdk/client-ec2";
import {
  CloudWatchClient,
  GetMetricDataCommand,
  type MetricDataQuery,
  type MetricDataResult,
} from "@aws-sdk/client-cloudwatch";
import {
  CloudWatchLogsClient,
  FilterLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import type {
  Application,
  ApplicationHealthResponse,
  LogEvent,
  Metrics,
} from "./aws.types.ts";

const ec2Client = new EC2Client({});
const cloudWatchClient = new CloudWatchClient({});
const cloudWatchLogsClient = new CloudWatchLogsClient({});

export class AwsIntegrationError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "AwsIntegrationError";
  }
}

function getAwsErrorDetails(error: unknown): {
  name: string | undefined;
  message: string;
  statusCode: number | undefined;
} {
  if (!(error instanceof Error)) {
    return { name: undefined, message: "Unknown AWS error", statusCode: undefined };
  }

  const awsError = error as Error & {
    $metadata?: { httpStatusCode?: number };
  };
  return {
    name: error.name,
    message: error.message,
    statusCode: awsError.$metadata?.httpStatusCode,
  };
}

function toAwsIntegrationError(error: unknown, operation: string): AwsIntegrationError {
  if (error instanceof AwsIntegrationError) return error;

  const details = getAwsErrorDetails(error);
  const authenticationErrors = new Set([
    "CredentialsProviderError",
    "ExpiredToken",
    "ExpiredTokenException",
    "InvalidClientTokenId",
    "UnrecognizedClientException",
    "SignatureDoesNotMatch",
    "AccessDenied",
    "AccessDeniedException",
  ]);

  if (authenticationErrors.has(details.name ?? "")) {
    return new AwsIntegrationError(
      `AWS authentication or authorization failed during ${operation}.`,
      502,
      { cause: error },
    );
  }

  if (details.statusCode === 429 || details.statusCode === 503) {
    return new AwsIntegrationError(
      `AWS temporarily throttled or unavailable during ${operation}.`,
      503,
      { cause: error },
    );
  }

  return new AwsIntegrationError(
    `AWS ${operation} request failed${details.message ? `: ${details.message}` : "."}`,
    502,
    { cause: error },
  );
}

export async function getInstance(instanceId: string): Promise<Application> {
  let instance: Instance | undefined;

  try {
    const result = await ec2Client.send(
      new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      }),
    );
    instance = result.Reservations?.flatMap(
      (reservation) => reservation.Instances ?? [],
    ).find((candidate) => candidate.InstanceId === instanceId);
  } catch (error) {
    const details = getAwsErrorDetails(error);
    if (details.name === "InvalidInstanceID.NotFound") {
      throw new AwsIntegrationError("EC2 instance was not found.", 404, {
        cause: error,
      });
    }
    throw toAwsIntegrationError(error, "instance lookup");
  }

  if (!instance?.InstanceId) {
    throw new AwsIntegrationError("EC2 instance was not found.", 404);
  }

  let region: string;
  try {
    region = await ec2Client.config.region();
  } catch (error) {
    throw toAwsIntegrationError(error, "region resolution");
  }

  return {
    instanceId: instance.InstanceId,
    name: instance.Tags?.find((tag) => tag.Key === "Name")?.Value ?? null,
    state: instance.State?.Name ?? "unknown",
    instanceType: instance.InstanceType ?? null,
    privateIp: instance.PrivateIpAddress ?? null,
    publicIp: instance.PublicIpAddress ?? null,
    region,
  };
}

function getLatestMetricValue(
  results: MetricDataResult[],
  id: string,
): number | null {
  const result = results.find((metricResult) => metricResult.Id === id);
  const timestamps = result?.Timestamps ?? [];
  const values = result?.Values ?? [];
  let latestIndex = -1;

  for (let index = 0; index < timestamps.length; index += 1) {
    const timestamp = timestamps[index];
    const latestTimestamp = latestIndex >= 0 ? timestamps[latestIndex] : undefined;
    if (timestamp && (!latestTimestamp || timestamp > latestTimestamp)) {
      latestIndex = index;
    }
  }

  return latestIndex >= 0 ? values[latestIndex] ?? null : null;
}

export async function getInstanceMetrics(instanceId: string): Promise<Metrics> {
  const queries: MetricDataQuery[] = [
    {
      Id: "cpu",
      MetricStat: {
        Metric: {
          Namespace: "AWS/EC2",
          MetricName: "CPUUtilization",
          Dimensions: [{ Name: "InstanceId", Value: instanceId }],
        },
        Period: 60,
        Stat: "Average",
      },
      ReturnData: true,
    },
    {
      Id: "memory",
      MetricStat: {
        Metric: {
          Namespace: "CWAgent",
          MetricName: "mem_used_percent",
          Dimensions: [{ Name: "InstanceId", Value: instanceId }],
        },
        Period: 60,
        Stat: "Average",
      },
      ReturnData: true,
    },
    {
      Id: "disk",
      MetricStat: {
        Metric: {
          Namespace: "CWAgent",
          MetricName: "disk_used_percent",
          Dimensions: [{ Name: "InstanceId", Value: instanceId }],
        },
        Period: 60,
        Stat: "Average",
      },
      ReturnData: true,
    },
    {
      Id: "network_in",
      MetricStat: {
        Metric: {
          Namespace: "AWS/EC2",
          MetricName: "NetworkIn",
          Dimensions: [{ Name: "InstanceId", Value: instanceId }],
        },
        Period: 60,
        Stat: "Sum",
      },
      ReturnData: true,
    },
    {
      Id: "network_out",
      MetricStat: {
        Metric: {
          Namespace: "AWS/EC2",
          MetricName: "NetworkOut",
          Dimensions: [{ Name: "InstanceId", Value: instanceId }],
        },
        Period: 60,
        Stat: "Sum",
      },
      ReturnData: true,
    },
  ];

  try {
    const endTime = new Date();
    const result = await cloudWatchClient.send(
      new GetMetricDataCommand({
        StartTime: new Date(endTime.getTime() - 5 * 60 * 1000),
        EndTime: endTime,
        MetricDataQueries: queries,
        ScanBy: "TimestampDescending",
      }),
    );
    const results = result.MetricDataResults ?? [];

    return {
      cpu: getLatestMetricValue(results, "cpu"),
      memory: getLatestMetricValue(results, "memory"),
      disk: getLatestMetricValue(results, "disk"),
      networkIn: getLatestMetricValue(results, "network_in"),
      networkOut: getLatestMetricValue(results, "network_out"),
    };
  } catch (error) {
    throw toAwsIntegrationError(error, "metric retrieval");
  }
}

export async function getApplicationLogs(
  logGroupName: string,
): Promise<LogEvent[]> {
  const endTime = Date.now();

  try {
    const result = await cloudWatchLogsClient.send(
      new FilterLogEventsCommand({
        logGroupName,
        startTime: endTime - 30 * 60 * 1000,
        endTime,
        limit: 100,
      }),
    );

    return (result.events ?? []).flatMap((event) => {
      if (event.timestamp == null || event.message == null) return [];
      return [{
        timestamp: new Date(event.timestamp).toISOString(),
        message: event.message,
      }];
    });
  } catch (error) {
    const details = getAwsErrorDetails(error);
    if (details.name === "ResourceNotFoundException") {
      throw new AwsIntegrationError(
        `CloudWatch Logs log group "${logGroupName}" was not found.`,
        404,
        { cause: error },
      );
    }
    throw toAwsIntegrationError(error, "log retrieval");
  }
}

export async function getApplicationHealth(
  instanceId: string,
): Promise<ApplicationHealthResponse> {
  const logGroupName = process.env.AWS_LOG_GROUP_NAME?.trim() || "api.log";
  const [{ application, metrics }, logs] = await Promise.all([
    getApplicationMetrics(instanceId),
    getApplicationLogs(logGroupName),
  ]);

  return { application, metrics, logs };
}

export async function getApplicationMetrics(
  instanceId: string,
): Promise<Pick<ApplicationHealthResponse, "application" | "metrics">> {
  const [application, metrics] = await Promise.all([
    getInstance(instanceId),
    getInstanceMetrics(instanceId),
  ]);

  return { application, metrics };
}
