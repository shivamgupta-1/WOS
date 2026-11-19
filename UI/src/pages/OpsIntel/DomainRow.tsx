import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import {
  getErrorMessage,
  useDeleteDomainMutation,
  useLazyGetDomainQuery,
  useUpdateDomainMutation,
} from '../../api/opsApi';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { ApiDomain } from '../../types/domain';

interface DomainRowProps {
  domain: ApiDomain;
}

interface Feedback {
  message: string;
  type: 'error' | 'success';
}

export function DomainRow({ domain }: DomainRowProps) {
  const [name, setName] = useState(domain.domainName);
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const formId = useId();
  const [loadDomain, { isLoading: isLoadingDomain }] = useLazyGetDomainQuery();
  const [updateDomain, { isLoading: isUpdating }] = useUpdateDomainMutation();
  const [deleteDomain, { isLoading: isDeleting }] = useDeleteDomainMutation();

  async function startEditing() {
    setFeedback(null);
    try {
      const currentDomain = await loadDomain(domain.id).unwrap();
      setName(currentDomain.domainName);
      setIsEditing(true);
    } catch (error) {
      setFeedback({ message: getErrorMessage(error), type: 'error' });
    }
  }

  async function saveDomain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName === domain.domainName) return;
    setFeedback(null);
    try {
      await updateDomain({ ...domain, domainName: trimmedName }).unwrap();
      setIsEditing(false);
      setFeedback({ message: 'Domain updated.', type: 'success' });
    } catch (error) {
      setFeedback({ message: getErrorMessage(error), type: 'error' });
    }
  }

  function cancelEditing() {
    setName(domain.domainName);
    setIsEditing(false);
    setFeedback(null);
  }

  async function removeDomain() {
    if (!window.confirm(`Delete the ${domain.domainName} domain?`)) return;
    setFeedback(null);
    try {
      await deleteDomain(domain.id).unwrap();
    } catch (error) {
      setFeedback({ message: getErrorMessage(error), type: 'error' });
    }
  }

  return (
    <tr>
      <td className="domains-v2-name-cell">
        {isEditing ? (
          <form id={formId} onSubmit={(event) => void saveDomain(event)}>
            <Input
              aria-label={`Domain name for ${domain.domainName}`}
              autoFocus
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </form>
        ) : (
          <strong>{domain.domainName}</strong>
        )}
      </td>
      <td><code className="domains-v2-id">{domain.id}</code></td>
      <td className="domains-v2-actions-cell">
        <div className="domains-v2-row-actions" role="group" aria-label={`Actions for ${domain.domainName}`}>
          {isEditing ? (
            <>
              <Button
                type="submit"
                form={formId}
                variant="primary"
                size="sm"
                loading={isUpdating}
                disabled={!name.trim() || name.trim() === domain.domainName}
              >
                Save
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={cancelEditing}>Cancel</Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={isLoadingDomain}
                onClick={() => void startEditing()}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                loading={isDeleting}
                onClick={() => void removeDomain()}
              >
                Delete
              </Button>
            </>
          )}
        </div>
        {feedback && (
          <span
            className={`domains-v2-row-feedback is-${feedback.type}`}
            role={feedback.type === 'error' ? 'alert' : 'status'}
          >
            {feedback.message}
          </span>
        )}
      </td>
    </tr>
  );
}
