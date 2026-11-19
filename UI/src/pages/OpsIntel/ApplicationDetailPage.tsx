import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import {
  getErrorMessage,
  useDeleteApplicationMutation,
  useGetAwsInstanceMetricsQuery,
  useGetApplicationQuery,
  useGetDomainsQuery,
  useUpdateApplicationMutation,
} from '../../api/opsApi';
import { Button } from '../../components/ui/Button';
import { StatusDot } from '../../components/ui/StatusDot';
import { ApplicationDetailOverview } from './ApplicationDetailOverview';
import { ApplicationDetailTabs } from './ApplicationDetailTabs';
import { applicationDetailTabFromParam } from './applicationDetailTabTypes';
import type { ApplicationDetailTab } from './applicationDetailTabTypes';
import { getHistoryBars } from './applicationDetailSelectors';
import type { HistoryDays } from './applicationDetailSelectors';
import { ApplicationEditForm } from './ApplicationEditForm';
import type { EditableApplication } from './ApplicationEditForm';
import { ApplicationDetailError, ApplicationDetailLoading } from './ApplicationDetailStates';
import { readableStatus, serviceStatus } from './overviewFormatters';
import './ApplicationDetailPage.css';

export default function ApplicationDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [historyDays, setHistoryDays] = useState<HistoryDays>(30);
  const { currentData: application, isLoading, isFetching, isError, refetch } = useGetApplicationQuery(
    { id, days: historyDays },
    { pollingInterval: 30_000, skip: !id, refetchOnMountOrArgChange: true },
  );
  const awsMetrics = useGetAwsInstanceMetricsQuery(application?.awsInstanceId ?? '', {
    pollingInterval: 60_000,
    skip: !application?.awsInstanceId,
    refetchOnMountOrArgChange: true,
  });
  const { data: domains = [] } = useGetDomainsQuery();
  const [updateApplication, { isLoading: isSaving }] = useUpdateApplicationMutation();
  const [deleteApplication, { isLoading: isDeleting }] = useDeleteApplicationMutation();
  const [editValues, setEditValues] = useState<EditableApplication | null>(null);
  const [message, setMessage] = useState('');
  const requestedTab = searchParams.get('tab');
  const activeTab: ApplicationDetailTab = applicationDetailTabFromParam(requestedTab);
  const historyBars = useMemo(
    () => application ? getHistoryBars(application.history, new Date(), historyDays) : [],
    [application, historyDays],
  );

  function setActiveTab(tab: ApplicationDetailTab) {
    const nextSearchParams = new URLSearchParams(searchParams);
    if (tab === 'Metrics') nextSearchParams.delete('tab');
    else nextSearchParams.set('tab', tab.toLowerCase().replaceAll(' ', '-'));
    setSearchParams(nextSearchParams);
  }

  function startEditing() {
    if (!application) return;
    setEditValues({
      name: application.name,
      url: application.url,
      teamslink: application.teamslink,
      email: application.email,
      description: application.description,
      domainId: application.domainId,
      failureThreshold: application.failureThreshold,
      awsInstanceId: application.awsInstanceId,
    });
    setMessage('');
  }

  function updateField<K extends keyof EditableApplication>(field: K, value: EditableApplication[K]) {
    setEditValues((current) => current ? { ...current, [field]: value } : current);
  }

  async function saveApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editValues || !application) return;
    setMessage('');
    try {
      await updateApplication({ id: application.id, ...editValues }).unwrap();
      setEditValues(null);
      await refetch();
      setMessage('Application updated.');
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function removeApplication() {
    if (!application || !window.confirm(`Delete ${application.name}? This cannot be undone.`)) return;
    setMessage('');
    try {
      await deleteApplication(application.id).unwrap();
      navigate('/', { replace: true });
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  if (isLoading) return <ApplicationDetailLoading />;
  if (isError || !application) {
    return <ApplicationDetailError onRetry={() => void refetch()} />;
  }

  const awsInstanceState = awsMetrics.data?.application.state
    ?? (application.awsInstanceId
      ? awsMetrics.isError ? 'Unavailable' : awsMetrics.isLoading ? 'Loading' : 'No data'
      : 'Not configured');

  return (
    <main className="detail-v2">
      <nav className="detail-v2-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/" aria-label="Back to dashboard"><ArrowLeft aria-hidden="true" size={16} /> Applications</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{application.name}</span>
      </nav>

      <header className="detail-v2-page-header">
        <div className="detail-v2-heading-copy">
          <div className="detail-v2-title-line">
            <h1>{application.name}</h1>
            <StatusDot
              status={serviceStatus(application.status)}
              label={application.status === 'unknown' ? 'Not checked' : readableStatus(application.status)}
            />
            {isFetching && <span className="detail-v2-refreshing" role="status"><RefreshCw aria-hidden="true" size={13} /> Updating</span>}
          </div>
          <p>{application.description || 'No description provided.'}</p>
          <div className="detail-v2-meta">
            <span>Domain <strong>{application.domainName}</strong></span>
            <span>Health-check URL <strong>{application.url}</strong></span>
            <span>Owner <strong>{application.email}</strong></span>
          </div>
        </div>
        <div className="detail-v2-actions">
          <Button
            variant="secondary"
            leadingIcon={<Pencil aria-hidden="true" size={15} />}
            onClick={startEditing}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            leadingIcon={<Trash2 aria-hidden="true" size={15} />}
            loading={isDeleting}
            onClick={() => void removeApplication()}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </header>

      {message && (
        <div className="detail-v2-feedback" role="status">
          <span>{message}</span>
          <Button variant="ghost" size="sm" aria-label="Dismiss message" onClick={() => setMessage('')}>Dismiss</Button>
        </div>
      )}

      {editValues && (
        <ApplicationEditForm
          application={application}
          domains={domains}
          values={editValues}
          isSaving={isSaving}
          onSubmit={(event) => void saveApplication(event)}
          onCancel={() => setEditValues(null)}
          onUpdateField={updateField}
        />
      )}

      <ApplicationDetailOverview
        application={application}
        awsInstanceState={awsInstanceState}
        historyDays={historyDays}
        historyBars={historyBars}
        isFetching={isFetching}
        onHistoryDaysChange={setHistoryDays}
      />

      <ApplicationDetailTabs
        application={application}
        activeTab={activeTab}
        awsMetrics={awsMetrics}
        onActiveTabChange={setActiveTab}
      />
    </main>
  );
}
