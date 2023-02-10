import { useDialog } from '@/components/common/DialogProvider';
import { useCurrentWorkspaceAndApplication } from '@/hooks/useCurrentWorkspaceAndApplication';
import { ApplicationStatus } from '@/types/application';
import Chip from '@/ui/Chip';
import Button from '@/ui/v2/Button';
import Text from '@/ui/v2/Text';
import { triggerToast } from '@/utils/toast';
import { useUpdateApplicationMutation } from '@/utils/__generated__/graphql';

const migrationSteps = [
  {
    title: 'Your project will be paused',
  },
  {
    title: 'Your database will be migrated to its own dedicated instance',
  },
  {
    title: 'Your project will be resumed',
  },
];

export default function OverviewMigration() {
  const { openAlertDialog } = useDialog();
  const [updateApplication] = useUpdateApplicationMutation({
    refetchQueries: ['getOneUser'],
  });
  const { currentApplication } = useCurrentWorkspaceAndApplication();

  return (
    <div className="pb-12">
      <div className="flex flex-col gap-2">
        <Text variant="h3" className="lg:!font-bold">
          Migrate Database
          <span className="relative -top-0.5 ml-2 self-center">
            <Chip variant="filled">New</Chip>
          </span>
        </Text>

        <Text variant="subtitle1" className="!font-medium">
          Migrate your project&apos;s data to its own Postgres instance and get
          root access to your database.
        </Text>
      </div>

      <div className="mt-6 flex flex-row place-content-between rounded-lg">
        <Button
          variant="outlined"
          color="secondary"
          className="w-full border-1 hover:border-1"
          onClick={() => {
            openAlertDialog({
              title: 'Migrate Database',
              payload: (
                <div className="flex flex-col gap-6 pb-8">
                  <Text>
                    Your project&apos;s data will be moved to a new and
                    dedicated Postgres instance with root access.
                  </Text>

                  <div className="flex flex-col gap-4">
                    <Text className="text-sm+ text-greyscaleDark">
                      Steps to migrate:
                    </Text>
                    <div className="grid grid-rows-3 gap-4">
                      {migrationSteps.map((step, index) => (
                        <div key={step.title} className="col-span-1">
                          <div className="flex h-11 flex-row gap-3">
                            <div className="flex items-center">
                              <div className="flex h-8 w-8 flex-col items-center justify-center self-center rounded-md bg-veryLightGray align-middle font-semibold">
                                <span className="text-[15px] font-semibold leading-[22px] text-greyscaleGreyDark">
                                  {index + 1}
                                </span>
                              </div>
                            </div>
                            <div className="flex w-[312px] items-center">
                              <Text className="text-sm+ font-normal text-greyscaleDark">
                                {step.title}
                              </Text>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg bg-card p-2.5">
                    <Text className="text-sm+ font-normal text-greyscaleGreyDark">
                      You can expect some downtime while we are moving your data
                      around. The time to migrate is dependent on your database
                      size.
                    </Text>
                  </div>
                </div>
              ),
              props: {
                contentProps: {
                  className: 'py-0',
                },
                PaperProps: {
                  className: 'max-w-[29.25rem] mx-auto p-6 rounded-lg',
                },
                primaryButtonText: 'Start Migration',

                onPrimaryAction: async () => {
                  try {
                    await updateApplication({
                      variables: {
                        appId: currentApplication.id,
                        app: {
                          desiredState: ApplicationStatus.Migrating,
                        },
                      },
                    });

                    localStorage.setItem(
                      `migration-${currentApplication.id}`,
                      new Date().toISOString(),
                    );

                    triggerToast(`${currentApplication.name} set to migrate.`);
                  } catch (e) {
                    triggerToast(
                      `Error trying to migrate ${currentApplication.name}`,
                    );
                  }
                },
                actionsProps: {
                  className: 'flex flex-row-reverse place-content-between',
                },
              },
            });
          }}
        >
          Start Migrating
        </Button>
      </div>
    </div>
  );
}
