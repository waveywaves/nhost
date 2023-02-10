import { useDialog } from '@/components/common/DialogProvider';
import Form from '@/components/common/Form';
import DatabaseRecordInputGroup from '@/components/dataBrowser/DatabaseRecordInputGroup';
import type {
  ColumnInsertOptions,
  DataBrowserGridColumn,
} from '@/types/dataBrowser';
import Button from '@/ui/v2/Button';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

export interface BaseRecordFormProps {
  /**
   * The columns of the table.
   */
  columns: DataBrowserGridColumn[];
  /**
   * Function to be called when the form is submitted.
   */
  onSubmit: (values: Record<string, ColumnInsertOptions>) => Promise<void>;
  /**
   * Function to be called when the operation is cancelled.
   */
  onCancel?: () => void;
  /**
   * Submit button text.
   *
   * @default 'Save'
   */
  submitButtonText?: string;
}

export default function BaseRecordForm({
  columns,
  onSubmit: handleExternalSubmit,
  onCancel,
  submitButtonText = 'Save',
}: BaseRecordFormProps) {
  const { onDirtyStateChange } = useDialog();
  const { requiredColumns, optionalColumns } = columns.reduce(
    (accumulator, column) => {
      if (
        column.isPrimary ||
        (!column.isNullable && !column.defaultValue && !column.isIdentity)
      ) {
        return {
          ...accumulator,
          requiredColumns: [...accumulator.requiredColumns, column],
        };
      }

      return {
        ...accumulator,
        optionalColumns: [...accumulator.optionalColumns, column],
      };
    },
    {
      requiredColumns: [],
      optionalColumns: [],
    },
  );

  const {
    formState: { isSubmitting, dirtyFields },
  } = useFormContext();

  // react-hook-form's isDirty gets true even if an input field is focused, then
  // immediately unfocused - we can't rely on that information
  const isDirty = Object.keys(dirtyFields).length > 0;

  useEffect(() => {
    onDirtyStateChange(isDirty, 'drawer');
  }, [isDirty, onDirtyStateChange]);

  // Stores columns in a map to have constant time lookup. This is necessary
  // for tables with many columns.
  const gridColumnMap = columns.reduce(
    (map, column) => map.set(column.id, column),
    new Map<string, DataBrowserGridColumn>(),
  );

  if (!columns?.length) {
    return (
      <p className="px-10">This table doesn&apos;t contain any columns.</p>
    );
  }

  async function handleSubmit(columnValues: Record<string, any>) {
    const columnIds = Object.keys(columnValues);

    const insertableValues: Record<string, ColumnInsertOptions> =
      columnIds.reduce((options, columnId) => {
        const gridColumn = gridColumnMap.get(columnId);
        const value = columnValues[columnId];

        if (!value && (gridColumn?.defaultValue || gridColumn?.isIdentity)) {
          return {
            ...options,
            [columnId]: {
              value,
              fallbackValue: 'DEFAULT',
            },
          };
        }

        if (!value && gridColumn?.isNullable) {
          return {
            ...options,
            [columnId]: {
              value,
              fallbackValue: 'NULL',
            },
          };
        }

        return {
          ...options,
          [columnId]: {
            value:
              gridColumn.type === 'date' && value instanceof Date
                ? value.toUTCString()
                : value,
          },
        };
      }, {});

    await handleExternalSubmit(insertableValues);
  }

  return (
    <Form
      className="flex flex-auto flex-col content-between overflow-hidden border-t-1 border-gray-200"
      onSubmit={handleSubmit}
    >
      <div className="flex-auto overflow-y-auto">
        {requiredColumns.length > 0 && (
          <DatabaseRecordInputGroup
            columns={requiredColumns}
            className="px-6"
            autoFocusFirstInput
          />
        )}

        {optionalColumns.length > 0 && (
          <DatabaseRecordInputGroup
            title="Optional columns"
            description="These columns are nullable and don't require a value."
            columns={optionalColumns}
            autoFocusFirstInput={requiredColumns.length === 0}
            className={twMerge(
              requiredColumns.length > 0 && 'border-t-1 border-gray-200',
              'px-6 pt-3',
            )}
          />
        )}
      </div>

      <div className="grid flex-shrink-0 grid-flow-col justify-between gap-3 border-t-1 border-gray-200 p-2">
        <Button
          variant="borderless"
          color="secondary"
          onClick={onCancel}
          tabIndex={isDirty ? -1 : 0}
        >
          Cancel
        </Button>

        <Button
          loading={isSubmitting}
          disabled={isSubmitting}
          type="submit"
          className="justify-self-end"
        >
          {submitButtonText}
        </Button>
      </div>
    </Form>
  );
}
