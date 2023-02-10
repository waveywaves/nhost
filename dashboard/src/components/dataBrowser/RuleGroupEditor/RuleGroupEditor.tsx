import { useCurrentWorkspaceAndApplication } from '@/hooks/useCurrentWorkspaceAndApplication';
import type { Rule, RuleGroup } from '@/types/dataBrowser';
import { Alert } from '@/ui/Alert';
import Button from '@/ui/v2/Button';
import PlusIcon from '@/ui/v2/icons/PlusIcon';
import Link from '@/ui/v2/Link';
import Text from '@/ui/v2/Text';
import generateAppServiceUrl from '@/utils/common/generateAppServiceUrl';
import type { DetailedHTMLProps, HTMLProps } from 'react';
import { useMemo } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';
import type { RuleEditorRowProps } from './RuleEditorRow';
import RuleEditorRow from './RuleEditorRow';
import RuleGroupControls from './RuleGroupControls';
import { RuleGroupEditorContext } from './useRuleGroupEditor';

export interface RuleGroupEditorProps
  extends DetailedHTMLProps<HTMLProps<HTMLDivElement>, HTMLDivElement>,
    Pick<RuleEditorRowProps, 'disabledOperators'> {
  /**
   * Determines whether or not the rule group editor is disabled.
   */
  disabled?: boolean;
  /**
   * Schema for the column autocomplete.
   */
  schema: string;
  /**
   * Table for the column autocomplete.
   */
  table: string;
  /**
   * Name of the group editor.
   */
  name: string;
  /**
   * Function to be called when the remove button is clicked.
   */
  onRemove?: VoidFunction;
  /**
   * Determines whether or not remove should be disabled for the rule group.
   */
  disableRemove?: boolean;
  /**
   * Group editor depth.
   *
   * @default 0
   */
  depth?: number;
  /**
   * Maximum depth of the group editor.
   *
   * @default 7
   */
  maxDepth?: number;
}

export default function RuleGroupEditor({
  onRemove,
  name,
  className,
  disableRemove,
  disabledOperators = [],
  depth = 0,
  maxDepth = 7,
  schema,
  table,
  disabled,
  ...props
}: RuleGroupEditorProps) {
  const { currentApplication } = useCurrentWorkspaceAndApplication();
  const form = useFormContext();

  const { control, getValues } = form;
  const {
    fields: rules,
    append: appendRule,
    remove: removeRule,
  } = useFieldArray({
    control,
    name: `${name}.rules`,
  });

  const unsupportedValues: Record<string, any>[] =
    getValues(`${name}.unsupported`) || [];

  const {
    fields: groups,
    append: appendGroup,
    remove: removeGroup,
  } = useFieldArray({
    control,
    name: `${name}.groups`,
  });

  if (!form) {
    throw new Error('RuleGroupEditor must be used in a FormContext.');
  }

  const contextValue = useMemo(
    () => ({
      disabled,
      schema,
      table,
    }),
    [disabled, schema, table],
  );

  return (
    <RuleGroupEditorContext.Provider value={contextValue}>
      <div
        className={twMerge(
          'rounded-lg border border-r-8 border-transparent pl-2',
          depth === 0 && 'bg-greyscale-50',
          depth === 1 && 'bg-greyscale-100',
          depth === 2 && 'bg-greyscale-200',
          depth === 3 && 'bg-greyscale-300',
          depth === 4 && 'bg-greyscale-400',
          depth === 5 && 'bg-greyscale-500',
          depth >= 6 && 'bg-greyscale-600',
          className,
        )}
        {...props}
      >
        <div className="grid grid-flow-row gap-4 lg:gap-2 py-4">
          {(rules as (Rule & { id: string })[]).map((rule, ruleIndex) => (
            <div className="grid grid-cols-[70px_1fr] gap-2" key={rule.id}>
              <div>
                {ruleIndex === 0 && (
                  <Text className="p-2 !font-medium">Where</Text>
                )}

                {ruleIndex > 0 && (
                  <RuleGroupControls name={name} showSelect={ruleIndex === 1} />
                )}
              </div>

              <RuleEditorRow
                name={name}
                index={ruleIndex}
                onRemove={() => removeRule(ruleIndex)}
                disabledOperators={disabledOperators}
              />
            </div>
          ))}

          {(groups as (RuleGroup & { id: string })[]).map(
            (ruleGroup, ruleGroupIndex) => (
              <div
                className="grid grid-cols-[70px_1fr] gap-2"
                key={ruleGroup.id}
              >
                <div>
                  {rules.length === 0 && ruleGroupIndex === 0 && (
                    <Text className="p-2 !font-medium">Where</Text>
                  )}

                  <RuleGroupControls
                    name={name}
                    showSelect={
                      (rules.length === 0 && ruleGroupIndex === 1) ||
                      (rules.length === 1 && ruleGroupIndex === 0)
                    }
                  />
                </div>

                <RuleGroupEditor
                  schema={schema}
                  table={table}
                  onRemove={() => removeGroup(ruleGroupIndex)}
                  disableRemove={rules.length === 0 && groups.length === 1}
                  disabledOperators={disabledOperators}
                  name={`${name}.groups.${ruleGroupIndex}`}
                  depth={depth + 1}
                  disabled={disabled}
                />
              </div>
            ),
          )}

          {unsupportedValues?.length > 0 && (
            <Alert severity="warning" className="text-left">
              <Text>
                This rule group contains one or more objects (e.g: _exists) that
                are not supported by our dashboard yet.{' '}
                {currentApplication && (
                  <span>
                    Please{' '}
                    <Link
                      href={`${generateAppServiceUrl(
                        currentApplication.subdomain,
                        currentApplication.region?.awsName,
                        'hasura',
                      )}/console/data/default/schema/${schema}/tables/${table}/permissions`}
                      underline="hover"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      visit Hasura
                    </Link>{' '}
                    to edit them.
                  </span>
                )}
              </Text>
            </Alert>
          )}
        </div>

        {!disabled && (
          <div className="grid grid-flow-row lg:grid-flow-col lg:justify-between gap-2 pb-2">
            <div className="grid grid-flow-row lg:grid-flow-col gap-2 lg:justify-start">
              <Button
                startIcon={<PlusIcon />}
                variant="borderless"
                onClick={() =>
                  appendRule({ column: '', operator: '_eq', value: '' })
                }
              >
                New Rule
              </Button>

              <Button
                startIcon={<PlusIcon />}
                variant="borderless"
                onClick={() =>
                  appendGroup({
                    operator: '_and',
                    rules: [{ column: '', operator: '_eq', value: '' }],
                    groups: [],
                    unsupported: [],
                  })
                }
                disabled={depth >= maxDepth - 1}
              >
                New Group
              </Button>
            </div>

            {onRemove && (
              <Button
                variant="borderless"
                color="secondary"
                onClick={onRemove}
                disabled={disableRemove}
              >
                Delete Group
              </Button>
            )}
          </div>
        )}
      </div>
    </RuleGroupEditorContext.Provider>
  );
}
