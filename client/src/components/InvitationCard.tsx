import React from "react";
import { useMutation } from "@apollo/client";
import { ACCEPT_INVITATION, DECLINE_INVITATION } from "../graphql/mutations";

interface User {
  _id: string;
  username: string;
}

export interface Invitation {
  _id: string;
  gameId: string;
  inviterId: User;
  inviteeId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface InvitationCardProps {
  invitation: Invitation;
  // Optionally, you could pass a callback to remove the invitation
  // from the list once it's accepted/declined.
  onActionCompleted?: () => void;
}

const InvitationCard: React.FC<InvitationCardProps> = ({
  invitation,
  onActionCompleted,
}) => {
  const [acceptInvitation, { loading: acceptLoading }] = useMutation(
    ACCEPT_INVITATION,
    {
      variables: { invitationId: invitation._id },
      onCompleted: () => {
        if (onActionCompleted) onActionCompleted();
      },
    }
  );

  const [declineInvitation, { loading: declineLoading }] = useMutation(
    DECLINE_INVITATION,
    {
      variables: { invitationId: invitation._id },
      onCompleted: () => {
        if (onActionCompleted) onActionCompleted();
      },
    }
  );

  const handleAccept = async () => {
    try {
      await acceptInvitation();
    } catch (err) {
      console.error("Error accepting invitation:", err);
    }
  };

  const handleDecline = async () => {
    try {
      await declineInvitation();
    } catch (err) {
      console.error("Error declining invitation:", err);
    }
  };

  return (
    <div className="invitation-card">
      <h3>Invitation</h3>
      <p>
        <strong>Game ID:</strong> {invitation.gameId}
      </p>
      <p>
        <strong>Inviter:</strong> {invitation.inviterId.username}
      </p>
      <p>
        <strong>Status:</strong> {invitation.status}
      </p>
      {invitation.status === "pending" && (
        <div>
          <button onClick={handleAccept} disabled={acceptLoading}>
            {acceptLoading ? "Accepting..." : "Accept"}
          </button>
          <button onClick={handleDecline} disabled={declineLoading}>
            {declineLoading ? "Declining..." : "Decline"}
          </button>
        </div>
      )}
    </div>
  );
};


export default InvitationCard;
