import { useGetWorkspaceMemberInvitesToManageQuery } from '@/generated/graphql';
import useIsPlatform from '@/hooks/common/useIsPlatform';
import { useSubmitState } from '@/hooks/useSubmitState';
import Button from '@/ui/v2/Button';
import Text from '@/ui/v2/Text';
import { nhost } from '@/utils/nhost';
import { triggerToast } from '@/utils/toast';
import { updateOwnCache } from '@/utils/updateOwnCache';
import { useApolloClient } from '@apollo/client';
import { useUserData } from '@nhost/nextjs';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export function InviteAnnounce() {
  const user = useUserData();

  const isPlatform = useIsPlatform();
  const client = useApolloClient();
  const router = useRouter();
  const { submitState, setSubmitState } = useSubmitState();
  const { submitState: ignoreState, setSubmitState: setIgnoreState } =
    useSubmitState();

  // @FIX: We probably don't want to poll every ten seconds for possible invites. (We can change later depending on how it works in production.) Maybe just on the workspace page?
  const { data, loading, error, refetch, startPolling } =
    useGetWorkspaceMemberInvitesToManageQuery({
      variables: {
        userId: user?.id,
      },
      skip: !isPlatform,
    });

  useEffect(() => {
    startPolling(15000);
  }, [startPolling]);

  if (loading) {
    return null;
  }

  if (error) {
    // TODO: Throw error instead and wrap this component in an ErrorBoundary
    // that would handle the error
    return null;
  }

  if (!data || data.workspaceMemberInvites.length === 0) {
    return null;
  }

  const handleInviteAccept = async (
    _event: React.SyntheticEvent<HTMLButtonElement>,
    invite: typeof data.workspaceMemberInvites[number],
  ) => {
    setSubmitState({
      error: null,
      loading: true,
    });
    const res = await nhost.functions.call('/accept-workspace-invite', {
      workspaceMemberInviteId: invite.id,
      isAccepted: true,
    });

    if (res?.res?.status !== 200) {
      triggerToast('An error occurred when trying to accept the invitation.');

      return setSubmitState({
        error: res.error,
        loading: false,
      });
    }

    await updateOwnCache(client);
    await router.push(`/${invite.workspace.slug}`);
    await refetch();
    triggerToast('Workspace invite accepted');
    return setSubmitState({
      error: null,
      loading: false,
    });
  };

  async function handleIgnoreInvitation(
    inviteId: typeof data.workspaceMemberInvites[number]['id'],
  ) {
    setIgnoreState({
      loading: true,
      error: null,
    });

    const res = await nhost.functions.call('/accept-workspace-invite', {
      workspaceMemberInviteId: inviteId,
      isAccepted: false,
    });

    if (res?.error) {
      triggerToast('An error occurred when trying to ignore the invitation.');

      setIgnoreState({
        loading: false,
        error: res.error,
      });

      return;
    }

    // just refetch all data
    await client.refetchQueries({
      include: ['getOneUser', 'getWorkspaceMemberInvitesToManage'],
    });

    setIgnoreState({
      loading: false,
      error: null,
    });
  }

  return (
    <div className="absolute right-10 z-50 mt-14 w-workspaceSidebar rounded-lg bg-greyscaleDark px-6 py-6 text-left">
      {data.workspaceMemberInvites.map(
        (invite: typeof data.workspaceMemberInvites[number]) => (
          <div key={invite.id} className="grid grid-flow-row gap-4 text-center">
            <div className="grid grid-flow-row gap-1">
              <Text variant="h3" component="h2" className="text-white">
                You have been invited to
              </Text>
              <Text variant="h3" component="p" className="text-white">
                {invite.workspace.name}
              </Text>
            </div>

            <div className="grid grid-flow-row gap-2">
              <Button
                onClick={(e: React.SyntheticEvent<HTMLButtonElement>) =>
                  handleInviteAccept(e, invite)
                }
                loading={submitState.loading}
              >
                Accept Invite
              </Button>

              <Button
                variant="outlined"
                color="secondary"
                className="text-white hover:bg-white hover:bg-opacity-5 focus:bg-white focus:bg-opacity-10"
                onClick={() => handleIgnoreInvitation(invite.id)}
                loading={ignoreState.loading}
              >
                Ignore Invite
              </Button>
            </div>
          </div>
        ),
      )}
    </div>
  );
}

export default InviteAnnounce;
