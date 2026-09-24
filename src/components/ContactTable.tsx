import type { Contact } from "../types/contact";
import { ContactRow } from "./ContactRow";

interface ContactTableProps {
  contacts: Contact[];
  expandedIds: Set<string>;
  onToggle: (contactId: string) => void;
}

export function ContactTable({ contacts, expandedIds, onToggle }: ContactTableProps) {
  if (contacts.length === 0) {
    return <div className="empty-state">No contacts match the current filters.</div>;
  }

  return (
    <table className="contact-table">
      <thead>
        <tr>
          <th aria-hidden="true"></th>
          <th>Contact ID</th>
          <th>Phone number</th>
          <th>Started at</th>
          <th>Outcome</th>
          <th>First message</th>
        </tr>
      </thead>
      <tbody>
        {contacts.map((contact) => (
          <ContactRow
            key={contact.contactId}
            contact={contact}
            expanded={expandedIds.has(contact.contactId)}
            onToggle={onToggle}
          />
        ))}
      </tbody>
    </table>
  );
}
