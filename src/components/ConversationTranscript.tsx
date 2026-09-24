import type { ConversationTurn } from "../types/contact";
import { parseTurn } from "../utils/conversation";

interface ConversationTranscriptProps {
  conversation: ConversationTurn[];
}

export function ConversationTranscript({ conversation }: ConversationTranscriptProps) {
  const turns = conversation.map(parseTurn).filter((turn) => turn !== null);

  if (turns.length === 0) {
    return <p className="transcript__empty">No transcript available for this contact.</p>;
  }

  return (
    <div className="transcript">
      {turns.map((turn, index) => (
        <div key={index} className={`transcript__turn transcript__turn--${turn.speaker}`}>
          <div className="transcript__meta">
            <span className="transcript__speaker">
              {turn.speaker === "customer" ? "Customer" : "AI Agent"}
            </span>
          </div>
          <div className="transcript__bubble">
            <p>{turn.text}</p>
            {turn.speaker === "agent" && turn.sources.length > 0 && (
              <details className="transcript__sources">
                <summary>Knowledge base sources ({turn.sources.length})</summary>
                <ul>
                  {turn.sources.map((source) => (
                    <li key={source}>
                      <a href={source} target="_blank" rel="noreferrer">
                        {source}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
