import { useDialog } from '@/components/common/DialogProvider';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export interface UseLeaveConfirmProps {
  isDirty?: boolean;
}

export default function useLeaveConfirm({ isDirty }: UseLeaveConfirmProps) {
  const router = useRouter();
  const { openAlertDialog } = useDialog();
  const [isConfirmed, setConfirmed] = useState(false);

  useEffect(() => {
    function onRouteChangeStart(route: string) {
      if (!isDirty || isConfirmed) {
        return;
      }

      openAlertDialog({
        title: 'Unsaved changes',
        payload:
          'You have unsaved local changes. Are you sure you want to discard them?',
        props: {
          primaryButtonColor: 'error',
          primaryButtonText: 'Discard',
          onPrimaryAction: () => {
            setConfirmed(true);
            router.push(route);
          },
        },
      });

      throw new Error('Route change aborted');
    }

    router.events.on('routeChangeStart', onRouteChangeStart);

    return () => router.events.off('routeChangeStart', onRouteChangeStart);
  }, [isConfirmed, isDirty, openAlertDialog, router, router.events]);
}
