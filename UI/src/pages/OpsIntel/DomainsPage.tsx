import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getErrorMessage,
  useCreateDomainMutation,
  useDeleteDomainMutation,
  useLazyGetDomainQuery,
  useGetDomainsQuery,
  useUpdateDomainMutation,
} from '../../api/opsApi';
import type { ApiDomain } from '../../types/domain';

function DomainRow({ domain }: { domain: ApiDomain }) {
  const [name, setName] = useState(domain.domainName);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [loadDomain, { isLoading: isLoadingDomain }] = useLazyGetDomainQuery();
  const [updateDomain, { isLoading: isUpdating }] = useUpdateDomainMutation();
  const [deleteDomain, { isLoading: isDeleting }] = useDeleteDomainMutation();

  async function startEditing() {
    setMessage('');
    try {
      const currentDomain = await loadDomain(domain.id).unwrap();
      setName(currentDomain.domainName);
      setIsEditing(true);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function saveDomain() {
    setMessage('');
    try {
      await updateDomain({ ...domain, domainName: name.trim() }).unwrap();
      setIsEditing(false);
      setMessage('Domain updated.');
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function removeDomain() {
    if (!window.confirm(`Delete the ${domain.domainName} domain?`)) return;
    setMessage('');
    try {
      await deleteDomain(domain.id).unwrap();
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <div className="domain-row">
      {isEditing
        ? <label className="form-field" htmlFor={`domain-${domain.id}`}><span className="sr-only">Domain name</span><input id={`domain-${domain.id}`} value={name} onChange={(event) => setName(event.target.value)} /></label>
        : <strong>{domain.domainName}</strong>}
      {isEditing
        ? <button className="button button-secondary" type="button" disabled={isUpdating || isLoadingDomain || !name.trim() || name.trim() === domain.domainName} onClick={() => void saveDomain()}>{isUpdating ? 'Saving...' : 'Save'}</button>
        : <button className="button button-secondary" type="button" disabled={isLoadingDomain} onClick={() => void startEditing()}>{isLoadingDomain ? 'Loading...' : 'Edit'}</button>}
      {isEditing && <button className="button button-secondary" type="button" onClick={() => setIsEditing(false)}>Cancel</button>}
      <button className="button button-danger" type="button" disabled={isDeleting} onClick={() => void removeDomain()}>
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
      {message && <span className="domain-message" role="status">{message}</span>}
    </div>
  );
}

export default function DomainsPage() {
  const { data: domains = [], isLoading, isError, refetch } = useGetDomainsQuery();
  const [createDomain, { isLoading: isCreating }] = useCreateDomainMutation();
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  async function submitDomain(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    try {
      await createDomain({ name: name.trim() }).unwrap();
      setName('');
      setMessage('Domain created.');
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <div className="domains-page">
      <div className="breadcrumbs"><Link to="/">Dashboard</Link><span aria-hidden="true">/</span><span>Domains</span></div>
      <div className="page-heading"><div><div className="eyebrow">APPLICATION ORGANIZATION</div><h1>Domains</h1><p>Manage the domains used to group monitored applications.</p></div></div>
      <section className="surface domain-surface">
        <h2>Add a domain</h2>
        <form className="domain-create-form" onSubmit={(event) => void submitDomain(event)}>
          <label className="form-field" htmlFor="new-domain">Domain name<input id="new-domain" value={name} onChange={(event) => setName(event.target.value)} required /></label>
          <button className="button button-primary" type="submit" disabled={isCreating || !name.trim()}>{isCreating ? 'Creating...' : 'Create domain'}</button>
          {message && <span role="status">{message}</span>}
        </form>
      </section>
      <section className="surface domain-surface" aria-labelledby="domains-heading">
        <div className="surface-heading"><div><h2 id="domains-heading">Configured domains</h2><p>{domains.length} total</p></div></div>
        {isLoading ? <div className="loading-state" role="status">Loading domains...</div>
          : isError ? <section className="error-state" role="alert"><strong>Domains could not be loaded.</strong><button className="button button-secondary" type="button" onClick={() => void refetch()}>Retry</button></section>
            : domains.length === 0 ? <p>No domains configured yet.</p>
              : <div className="domain-list">{domains.map((domain) => <DomainRow key={domain.id} domain={domain} />)}</div>}
      </section>
    </div>
  );
}
