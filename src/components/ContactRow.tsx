import type { Contact } from "../types/contact";
import { formatTimestamp } from "../utils/date";
import { previewMessage } from "../utils/conversation";
import { OutcomeBadge } from "./OutcomeBadge";
import { ConversationTranscript } from "./ConversationTranscript";

interface ContactRowProps {
  contact: Contact;
  expanded: boolean;
  onToggle: (contactId: string) => void;
}

export function ContactRow({ contact, expanded, onToggle }: ContactRowProps) {
  return (
    <>
      <tr
        className={`contact-row ${expanded ? "contact-row--expanded" : ""}`}
        onClick={() => onToggle(contact.contactId)}
      >
        <td className="contact-row__toggle" aria-hidden="true">
          <span className={`chevron ${expanded ? "chevron--open" : ""}`}>›</span>
        </td>
        <td className="contact-row__id">
          <span className="contact-row__id-text">{contact.contactId}</span>
        </td>
        <td>{contact.phoneNumber}</td>
        <td>{formatTimestamp(contact.startedAt)}</td>
        <td>
          <OutcomeBadge outcome={contact.outcome} />
        </td>
        <td className="contact-row__preview">{previewMessage(contact.conversation)}</td>
      </tr>
      {expanded && (
        <tr className="contact-row__detail">
          <td colSpan={6}>
            <ConversationTranscript conversation={contact.conversation} />
          </td>
        </tr>
      )}
    </>
  );
}
