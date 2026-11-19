import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  getErrorMessage,
  useCreateDomainMutation,
} from '../../api/opsApi';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface Feedback {
  message: string;
  type: 'error' | 'success';
}

export function DomainCreatePanel() {
  const [createDomain, { isLoading: isCreating }] = useCreateDomainMutation();
  const [name, setName] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function submitDomain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setFeedback(null);
    try {
      await createDomain({ name: trimmedName }).unwrap();
      setName('');
      setFeedback({ message: 'Domain created.', type: 'success' });
    } catch (error) {
      setFeedback({ message: getErrorMessage(error), type: 'error' });
    }
  }

  return (
    <aside className="surface domains-v2-create" aria-labelledby="create-domain-heading">
      <header className="domains-v2-section-header">
        <div>
          <h2 id="create-domain-heading">Add a domain</h2>
          <p>Use a name that application owners will recognize.</p>
        </div>
      </header>
      <form className="domains-v2-create-form" onSubmit={(event) => void submitDomain(event)}>
        <Input
          id="new-domain"
          label="Domain name"
          placeholder="e.g. Payments"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Button type="submit" variant="primary" loading={isCreating} disabled={!name.trim()}>
          Create domain
        </Button>
      </form>
      {feedback && (
        <p className={`domains-v2-feedback is-${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>
          {feedback.message}
        </p>
      )}
    </aside>
  );
}
