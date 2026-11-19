import type { FormEventHandler } from 'react';
import { Button } from '../../components/ui/Button';
import type { ApiDomain, ApplicationDetail, UpdateApplicationRequest } from '../../types/domain';
import Dropdown from '../../components/Dropdown/Dropdown';

export type EditableApplication = Omit<UpdateApplicationRequest, 'id'>;

interface ApplicationEditFormProps {
  application: ApplicationDetail;
  domains: ApiDomain[];
  values: EditableApplication;
  isSaving: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onCancel: () => void;
  onUpdateField: <K extends keyof EditableApplication>(field: K, value: EditableApplication[K]) => void;
}

export function ApplicationEditForm({
  application,
  domains,
  values,
  isSaving,
  onSubmit,
  onCancel,
  onUpdateField,
}: ApplicationEditFormProps) {
  return (
    <section className="surface detail-v2-edit-surface" aria-labelledby="edit-application-heading">
      <header className="detail-v2-section-heading">
        <div>
          <h2 id="edit-application-heading">Edit application</h2>
          <p>Changes are saved to the monitoring API.</p>
        </div>
      </header>
      <form className="detail-v2-edit-form" onSubmit={onSubmit}>
        <label htmlFor="edit-app-name">Name
          <input id="edit-app-name" required value={values.name} onChange={(event) => onUpdateField('name', event.target.value)} />
        </label>
        <label htmlFor="edit-app-url">Health-check URL
          <input id="edit-app-url" type="url" required value={values.url} onChange={(event) => onUpdateField('url', event.target.value)} />
        </label>
        <label>
          <span>Domain</span>
          <Dropdown
            ariaLabel="Domain"
            value={values.domainId}
            onChange={(value) => onUpdateField('domainId', value)}
            options={domains.map((domain) => ({ value: domain.id, label: domain.domainName }))}
          />
        </label>
        <label htmlFor="edit-app-email">Owner email
          <input id="edit-app-email" type="email" required value={values.email} onChange={(event) => onUpdateField('email', event.target.value)} />
        </label>
        <label htmlFor="edit-app-failure-threshold">Failed probes before DOWN
          <input
            id="edit-app-failure-threshold"
            type="number"
            min={1}
            max={10}
            required
            value={values.failureThreshold}
            onChange={(event) => onUpdateField('failureThreshold', Number(event.target.value))}
          />
          <small>Current setting: {application.failureThreshold} consecutive failures; default is 2.</small>
        </label>
        <label htmlFor="edit-app-aws-instance-id">AWS EC2 instance ID
          <input
            id="edit-app-aws-instance-id"
            value={values.awsInstanceId ?? ''}
            placeholder="i-0123456789abcdef0"
            pattern="i-[a-fA-F0-9]{8,17}"
            title="Enter a valid EC2 instance ID."
            onChange={(event) => onUpdateField('awsInstanceId', event.target.value || null)}
          />
          <small>Used to load live AWS metrics; leave blank to disable AWS metrics.</small>
        </label>
        <label className="detail-v2-edit-full" htmlFor="edit-app-description">Description
          <textarea id="edit-app-description" rows={3} value={values.description} onChange={(event) => onUpdateField('description', event.target.value)} />
        </label>
        <label className="detail-v2-edit-full" htmlFor="edit-app-teams">Workflow link
          <input id="edit-app-teams" type="url" required value={values.teamslink} onChange={(event) => onUpdateField('teamslink', event.target.value)} />
        </label>
        <div className="detail-v2-form-actions">
          <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" type="submit" loading={isSaving}>
            {isSaving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </form>
    </section>
  );
}
