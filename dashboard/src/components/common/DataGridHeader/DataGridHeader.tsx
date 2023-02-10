import type { DataGridProps } from '@/components/common/DataGrid';
import useDataGridConfig from '@/hooks/useDataGridConfig';
import type { DataBrowserGridColumn } from '@/types/dataBrowser';
import Button from '@/ui/v2/Button';
import Divider from '@/ui/v2/Divider';
import { Dropdown } from '@/ui/v2/Dropdown';
import ArrowDownIcon from '@/ui/v2/icons/ArrowDownIcon';
import ArrowUpIcon from '@/ui/v2/icons/ArrowUpIcon';
import PencilIcon from '@/ui/v2/icons/PencilIcon';
import PlusIcon from '@/ui/v2/icons/PlusIcon';
import TrashIcon from '@/ui/v2/icons/TrashIcon';
import type { DetailedHTMLProps, HTMLProps } from 'react';
import { twMerge } from 'tailwind-merge';

export interface HeaderActionProps
  extends DetailedHTMLProps<HTMLProps<HTMLElement>, HTMLElement> {}

export interface DataGridHeaderProps<T extends object>
  extends Omit<
      DetailedHTMLProps<HTMLProps<HTMLDivElement>, HTMLDivElement>,
      'children'
    >,
    Pick<
      DataGridProps<T>,
      'onRemoveColumn' | 'onEditColumn' | 'onInsertColumn'
    > {
  /**
   * Props to be passed to component slots.
   */
  componentsProps?: {
    /**
     * Props to be passed to the `Edit Column` header action item.
     */
    editActionProps?: HeaderActionProps;
    /**
     * Props to be passed to the `Delete Column` header action item.
     */
    deleteActionProps?: HeaderActionProps;
    /**
     * Props to be passed to the `Delete Column` header action item.
     */
    insertActionProps?: HeaderActionProps;
  };
}

// TODO: Get rid of Data Browser related code from here. This component should
// be generic and not depend on Data Browser related data types and logic.
export default function DataGridHeader<T extends object>({
  className,
  onRemoveColumn,
  onEditColumn,
  onInsertColumn,
  componentsProps,
  ...props
}: DataGridHeaderProps<T>) {
  const { flatHeaders, allowSort, allowResize } = useDataGridConfig<T>();

  return (
    <div
      className={twMerge(
        'sticky top-0 z-30 inline-flex w-full items-center pr-5',
        className,
      )}
      {...props}
    >
      {flatHeaders.map((column: DataBrowserGridColumn<T>) => {
        const headerProps = column.getHeaderProps({
          style: { display: 'inline-grid' },
        });

        return (
          <Dropdown.Root
            className={twMerge(
              'group relative inline-flex self-stretch overflow-hidden bg-white font-display text-xs font-bold text-greyscaleDark focus:outline-none focus-visible:outline-none',
              'border-b-1 border-r-1 border-gray-200',
              column.id === 'selection' && 'sticky left-0 max-w-2',
            )}
            style={{
              ...headerProps.style,
              maxWidth:
                column.id === 'selection' ? 32 : headerProps.style?.maxWidth,
              width:
                column.id === 'selection' ? '100%' : headerProps.style?.width,
              zIndex:
                column.id === 'selection' ? 10 : headerProps.style?.zIndex,
              position: null,
            }}
            key={column.id}
          >
            <Dropdown.Trigger
              className={twMerge(
                'focus:outline-none enabled:hover:bg-gray-100 enabled:focus:bg-gray-100 motion-safe:transition-colors',
                column.isDisabled && 'bg-gray-100',
              )}
              disabled={
                column.isDisabled ||
                column.id === 'selection' ||
                (column.disableSortBy && !onRemoveColumn)
              }
              hideChevron
            >
              <span
                {...headerProps}
                className="relative grid w-full grid-flow-col items-center justify-between p-2"
              >
                {column.render('Header')}

                {allowSort && (
                  <span className="text-greyscaleDark">
                    {column.isSorted && !column.isSortedDesc && (
                      <ArrowUpIcon className="h-3 w-3" />
                    )}

                    {column.isSorted && column.isSortedDesc && (
                      <ArrowDownIcon className="h-3 w-3" />
                    )}
                  </span>
                )}
              </span>

              {allowResize && !column.disableResizing && (
                <span
                  {...column.getResizerProps({
                    onClick: (event: Event) => event.stopPropagation(),
                  })}
                  className="absolute top-0 bottom-0 -right-0.5 z-10 h-full w-1.5 group-hover:bg-slate-900 group-hover:bg-opacity-20 group-active:bg-slate-900 group-active:bg-opacity-20 motion-safe:transition-colors"
                />
              )}
            </Dropdown.Trigger>

            <Dropdown.Content
              menu
              PaperProps={{ className: 'w-52 mt-1' }}
              className="p-0"
            >
              {onEditColumn && (
                <Dropdown.Item
                  onClick={() => onEditColumn(column)}
                  className="grid grid-flow-col items-center gap-2 p-2 text-sm+ font-medium"
                  disabled={componentsProps?.editActionProps?.disabled}
                >
                  <PencilIcon className="h-4 w-4 text-gray-700" />

                  <span>Edit Column</span>
                </Dropdown.Item>
              )}

              {onEditColumn && <Divider component="li" sx={{ margin: 0 }} />}

              {!column.disableSortBy && (
                <Dropdown.Item
                  onClick={() => column.toggleSortBy(false)}
                  className="grid grid-flow-col items-center gap-2 p-2 text-sm+ font-medium"
                >
                  <ArrowUpIcon className="h-4 w-4 text-gray-700" />

                  <span>Sort Ascending</span>
                </Dropdown.Item>
              )}

              {!column.disableSortBy && (
                <Dropdown.Item
                  onClick={() => column.toggleSortBy(true)}
                  className="grid grid-flow-col items-center gap-2 p-2 text-sm+ font-medium"
                >
                  <ArrowDownIcon className="h-4 w-4 text-gray-700" />

                  <span>Sort Descending</span>
                </Dropdown.Item>
              )}

              {onRemoveColumn && !column.isPrimary && (
                <Divider component="li" className="my-1" />
              )}

              {onRemoveColumn && !column.isPrimary && (
                <Dropdown.Item
                  onClick={() => onRemoveColumn(column)}
                  className="grid grid-flow-col items-center gap-2 p-2 text-sm+ font-medium text-red"
                  disabled={componentsProps?.deleteActionProps?.disabled}
                >
                  <TrashIcon className="h-4 w-4 text-red" />

                  <span>Delete Column</span>
                </Dropdown.Item>
              )}
            </Dropdown.Content>
          </Dropdown.Root>
        );
      })}

      {onInsertColumn && (
        <div className="group relative inline-flex w-25 self-stretch overflow-hidden border-b-1 border-r-1 border-gray-200 bg-white font-display text-xs font-bold text-greyscaleDark focus:outline-none focus-visible:outline-none">
          <Button
            onClick={onInsertColumn}
            variant="borderless"
            color="secondary"
            className="h-full w-full rounded-none text-xs hover:shadow-none focus:shadow-none focus:outline-none"
            aria-label="Insert New Column"
            disabled={componentsProps?.insertActionProps?.disabled}
          >
            <PlusIcon className="h-4 w-4 text-greyscaleGrey" />
          </Button>
        </div>
      )}
    </div>
  );
}
