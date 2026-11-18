import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  ApiApplication,
  ApiDomain,
  ApiHealthRecord,
  ApiIncidentHistory,
  ApplicationDetail,
  ApplicationSummary,
  AwsInstanceMetricsResponse,
  CreateApplicationRequest,
  DomainRequest,
  HealthStatus,
  Incident,
  OverviewResponse,
  UpdateApplicationRequest,
} from '../types/domain';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3000/api';
const baseUrl = `${configuredApiUrl.replace(/\/+$/, '').replace(/\/api$/i, '')}/api`;

interface ApiResponse<T> {
  status: string | number;
  data: T;
}

const toHealthStatus = (status?: string): HealthStatus => {
  if (status === 'UP') return 'healthy';
  if (status === 'DOWN') return 'down';
  return 'unknown';
};

const toApplicationSummary = (
  application: ApiApplication,
  health: ApiHealthRecord | undefined,
  domain: ApiDomain | undefined,
): ApplicationSummary => ({
  id: application.id,
  name: application.name,
  status: toHealthStatus(health?.status),
  healthScore: null,
  availabilityPct: null,
  responseTimeMs: health?.responseTime ?? null,
  errorRatePct: null,
  trend: [],
  owner: application.email,
  tier: null,
  domainName: domain?.domainName ?? 'Not assigned',
  lastUpdated: health?.lastUpdated ?? null,
});

function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'data' in error) {
    const data = error.data;
    if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
      return data.error;
    }
  }
  return 'The API request failed.';
}

export const opsApi = createApi({
  reducerPath: 'opsApi',
  baseQuery: fetchBaseQuery({ baseUrl }),
  tagTypes: ['Overview', 'Application', 'Domain'],
  endpoints: (builder) => ({
    getOverview: builder.query<OverviewResponse, void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const [applicationsResult, healthResult, domainsResult] = await Promise.all([
          fetchWithBQ('/applications/application'),
          fetchWithBQ('/applications/healthSnapshot'),
          fetchWithBQ('/domains/domain'),
        ]);
        const failedResult = [applicationsResult, healthResult, domainsResult].find((result) => 'error' in result);
        if (failedResult && 'error' in failedResult) return { error: failedResult.error };

        const applications = (applicationsResult.data as ApiResponse<ApiApplication[]>).data;
        const healthRecords = (healthResult.data as ApiResponse<ApiHealthRecord[]>).data;
        const domains = (domainsResult.data as ApiResponse<ApiDomain[]>).data;
        const healthByApplication = new Map(healthRecords.map((record) => [record.applicationId, record]));
        const domainById = new Map(domains.map((domain) => [domain.id, domain]));
        const summaries = applications.map((application) =>
          toApplicationSummary(
            application,
            healthByApplication.get(application.id),
            domainById.get(application.domainId),
          ),
        );
        const openApplications = summaries.filter((application) => application.status === 'down');
        const incidents: Incident[] = [];
        for (const application of openApplications) {
          const historyResult = await fetchWithBQ(`/applications/application/${application.id}/incidents?days=30`);
          if ('error' in historyResult) return { error: historyResult.error };
          const history = (historyResult.data as ApiResponse<ApiIncidentHistory>).data;
          for (const incident of history.history.filter((period) => period.status === 'DOWN' && !period.endAt)) {
            incidents.push({
              id: incident.id,
              title: incident.errorMessage || `${application.name} is unavailable`,
              severity: null,
              startedAt: incident.startAt,
              team: application.owner,
              appId: application.id,
            });
          }
        }

        const latestUpdate = healthRecords.reduce<string | null>((latest, record) =>
          !latest || record.lastUpdated > latest ? record.lastUpdated : latest, null);

        return {
          data: {
            kpis: {
              total: summaries.length,
              healthy: summaries.filter((application) => application.status === 'healthy').length,
              degraded: null,
              down: summaries.filter((application) => application.status === 'down').length,
              sloAttainmentPct: null,
              openIncidents: incidents.length,
            },
            applications: summaries,
            incidents,
            lastUpdated: latestUpdate,
          },
        };
      },
      providesTags: ['Overview'],
    }),
    getApplication: builder.query<ApplicationDetail, { id: string; days: 1 | 7 | 30 }>({
      async queryFn({ id, days }, _api, _extraOptions, fetchWithBQ) {
        const [applicationResult, healthResult, domainsResult, historyResult] = await Promise.all([
          fetchWithBQ(`/applications/application/${id}`),
          fetchWithBQ('/applications/healthSnapshotStatic'),
          fetchWithBQ('/domains/domain'),
          fetchWithBQ(`/applications/application/${id}/incidents?days=${days}`),
        ]);
        const failedResult = [applicationResult, healthResult, domainsResult, historyResult].find((result) => 'error' in result);
        if (failedResult && 'error' in failedResult) return { error: failedResult.error };

        const application = (applicationResult.data as ApiResponse<ApiApplication>).data;
        const healthRecords = (healthResult.data as ApiResponse<ApiHealthRecord[]>).data;
        const domains = (domainsResult.data as ApiResponse<ApiDomain[]>).data;
        const history = (historyResult.data as ApiResponse<ApiIncidentHistory>).data;
        const health = healthRecords.find((record) => record.applicationId === application.id);
        const summary = toApplicationSummary(
          application,
          health,
          domains.find((domain) => domain.id === application.domainId),
        );
        const incidents: Incident[] = history.history
          .filter((period) => period.status === 'DOWN')
          .map((period) => ({
            id: period.id,
            title: period.errorMessage || `${application.name} health check failed`,
            severity: null,
            startedAt: period.startAt,
            team: application.email,
            appId: application.id,
          }));

        return {
          data: {
            ...summary,
              domainId: application.domainId,
              failureThreshold: application.failureThreshold,
              awsInstanceId: application.awsInstanceId ?? null,
              url: application.url,
            teamslink: application.teamslink,
            email: application.email,
            description: application.description,
            statusCode: health?.statusCode ?? null,
            lastUpdated: health?.lastUpdated ?? null,
            incidents,
            history: history.history,
          },
        };
      },
      providesTags: (_result, _error, id) => [{ type: 'Application', id }],
    }),
    getDomains: builder.query<ApiDomain[], void>({
      query: () => '/domains/domain',
      transformResponse: (response: ApiResponse<ApiDomain[]>) => response.data,
      providesTags: ['Domain'],
    }),
    getDomain: builder.query<ApiDomain, string>({
      query: (id) => `/domains/domain/${id}`,
      transformResponse: (response: ApiResponse<ApiDomain>) => response.data,
      providesTags: (_result, _error, id) => [{ type: 'Domain', id }],
    }),
    getAwsInstanceMetrics: builder.query<AwsInstanceMetricsResponse, string>({
      query: (instanceId) => `/aws/application/${encodeURIComponent(instanceId)}/metrics`,
    }),
    createApplication: builder.mutation<ApplicationSummary, CreateApplicationRequest>({
      query: (body) => ({
        url: '/applications/application',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<ApiApplication>) =>
        toApplicationSummary(response.data, undefined, undefined),
      invalidatesTags: ['Overview'],
    }),
    updateApplication: builder.mutation<ApplicationSummary, UpdateApplicationRequest>({
      query: ({ id, ...body }) => ({
        url: `/applications/application/${id}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (response: ApiResponse<ApiApplication>) =>
        toApplicationSummary(response.data, undefined, undefined),
      invalidatesTags: (_result, _error, { id }) => ['Overview', { type: 'Application', id }],
    }),
    deleteApplication: builder.mutation<void, string>({
      query: (id) => ({ url: `/applications/application/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Overview'],
    }),
    createDomain: builder.mutation<ApiDomain, DomainRequest>({
      query: (body) => ({ url: '/domains/domain', method: 'POST', body }),
      transformResponse: (response: ApiResponse<ApiDomain>) => response.data,
      invalidatesTags: ['Domain', 'Overview'],
    }),
    updateDomain: builder.mutation<ApiDomain, ApiDomain>({
      query: ({ id, domainName }) => ({
        url: `/domains/domain/${id}`,
        method: 'PUT',
        body: { name: domainName },
      }),
      transformResponse: (response: ApiResponse<ApiDomain>) => response.data,
      invalidatesTags: ['Domain', 'Overview'],
    }),
    deleteDomain: builder.mutation<void, string>({
      query: (id) => ({ url: `/domains/domain/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Domain', 'Overview'],
    }),
  }),
});

export { getErrorMessage };
export const {
  useGetOverviewQuery,
  useGetApplicationQuery,
  useGetDomainsQuery,
  useGetDomainQuery,
  useLazyGetDomainQuery,
  useLazyGetAwsInstanceMetricsQuery,
  useGetAwsInstanceMetricsQuery,
  useCreateApplicationMutation,
  useUpdateApplicationMutation,
  useDeleteApplicationMutation,
  useCreateDomainMutation,
  useUpdateDomainMutation,
  useDeleteDomainMutation,
} = opsApi;
