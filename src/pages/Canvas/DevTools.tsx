import { Card, CardContent, Typography, useTheme } from '@material-ui/core';
import color from 'color';
import { Button } from 'components';
import { BlockStates } from 'models';
import React from 'react';
import { Box, Flex } from 'rebass';
import { Dispatch } from 'redux';
import { createDevTools } from 'redux-devtools';
// @ts-ignore
import { ActionCreators as InstrumentActionCreators } from 'redux-devtools-instrument';
import { Tuple } from 'ts-toolbelt';
import { PayloadAction } from 'typesafe-actions';
import { toObject } from 'utils';
import { Action } from './store';
import { CfudAction, CfudActionType, cfudActionTypes, CfudActionTypes } from './store/blockStates';
import { ScaleAction, scaleActionTypes, ScaleActionTypes } from './store/scale';

type EditableActionTypes = Tuple.Concat<CfudActionTypes, ScaleActionTypes>;
type EditableActionType = EditableActionTypes[number];
const editableActionTypes = [...cfudActionTypes, ...scaleActionTypes] as EditableActionTypes;
const isEditableActionType = (type: string): type is EditableActionType =>
  editableActionTypes.includes(type as EditableActionType);

type EditableAction = CfudAction | ScaleAction;
type EditableActionPayload = EditableAction['payload'];

type EditableActionById = GenericActionById<EditableActionType, EditableActionPayload>;

const isEditableActionById = (action: ActionById): action is EditableActionById =>
  isEditableActionType(action.action.type);

const isCfudActionType = (type: string): type is CfudActionType =>
  cfudActionTypes.includes(type as CfudActionType);

const isCfudAction = (action: EditableAction): action is CfudAction =>
  isCfudActionType(action.type);

export interface MonitorState { }

export type ActionId = number;

export interface GenericActionById<Type extends string, Payload extends any> {
  type: string;
  action: PayloadAction<Type, Payload>;
  timestamp: number;
}

export type ActionById = GenericActionById<Action['type'], Action['payload']>;

export type ActionsById = Record<number, ActionById>;

export interface State {
  blockStates: BlockStates;
}

export interface ComputedState {
  state: State;
}

export interface MonitorProps {
  monitorState: MonitorState;
  actionsById: ActionsById;
  nextActionId: ActionId;
  stagedActionIds: ActionId[];
  skippedActionIds: ActionId[];
  currentStateIndex: number;
  computedStates: ComputedState[];
  isLocked: boolean;
  isPaused: boolean;
  dispatch: Dispatch;
}

export const ActionCreators: IActionCreators = InstrumentActionCreators;

export const actionTypes = [
  'PERFORM_ACTION',
  'RESET',
  'ROLLBACK',
  'COMMIT',
  'SWEEP',
  'TOGGLE_ACTION',
  'SET_ACTIONS_ACTIVE',
  'JUMP_TO_STATE',
  'JUMP_TO_ACTION',
  'REORDER_ACTION',
  'IMPORT_STATE',
  'LOCK_CHANGES',
  'PAUSE_RECORDING',
] as const;

export const actionType = toObject(actionTypes);

export type ActionType = typeof actionType;

export interface IActionCreators {
  performAction(
    action: ActionById,
    trace: ((action: ActionById) => ActionsById) | undefined,
    traceLimit: number,
    toExcludeFromTrace: () => void,
  ):
    | never
    | {
      type: ActionType['PERFORM_ACTION'];
      action: ActionById;
      timestamp: string;
      stack: ActionsById;
    };

  reset(): { type: ActionType['RESET']; timestamp: string; };

  rollback(): { type: ActionType['ROLLBACK']; timestamp: string; };

  commit(): { type: ActionType['COMMIT']; timestamp: string; };

  sweep(): { type: ActionType['SWEEP']; };

  toggleAction(id: number): { type: ActionType['TOGGLE_ACTION']; id: number; };

  setActionsActive(
    start: number,
    end: number,
    active: boolean,
  ): {
    type: ActionType['SET_ACTIONS_ACTIVE'];
    start: number;
    end: number;
    active: boolean;
  };

  reorderAction(
    actionId: ActionId,
    beforeActionId: ActionId,
  ): {
    type: ActionType['REORDER_ACTION'];
    actionId: ActionId;
    beforeActionId: ActionId;
  };

  jumpToState(
    index: number,
  ): { type: ActionType['JUMP_TO_STATE']; index: number; };

  jumpToAction(
    actionId: ActionId,
  ): { type: ActionType['JUMP_TO_ACTION']; actionId: ActionId; };

  importState(
    nextLiftedState: MonitorProps['monitorState'],
    noRecompute: boolean,
  ): {
    type: ActionType['IMPORT_STATE'];
    nextLiftedState: MonitorProps['monitorState'];
    noRecompute: boolean;
  };

  lockChanges(
    status: boolean,
  ): { type: ActionType['LOCK_CHANGES']; status: boolean; };

  pauseRecording(
    status: boolean,
  ): { type: ActionType['PAUSE_RECORDING']; status: boolean; };
}

const StoryMonitor = (props: MonitorProps) => {
  const { dispatch, actionsById, stagedActionIds, currentStateIndex } = props;
  console.log(props); // eslint-disable-line no-console

  const cfudTypeBackgroundColorMap: Record<CfudActionType, React.CSSProperties['background']> = {
    create: 'green',
    focus: 'blue',
    update: 'yellow',
    delete: 'red',
  };

  const actionsByIdArray = Object.values(actionsById);

  const [hoveredActionId, setHoveredActionId] = React.useState('');

  const theme = useTheme();

  return (
    <Flex height="100%">
      <Flex flexDirection="column" style={{ borderRight: '1px solid #ccc' }} mr={2} pr={2}>
        <Button
          onClick={() => {
            dispatch(ActionCreators.reset());
          }}
        >
          Reset
        </Button>
      </Flex>
      <Flex style={{ overflowX: 'auto' }} width="100%" height="100%">
        {actionsByIdArray
          .filter(isEditableActionById)
          .map(({ timestamp, action }, i) => {
            const currentActionIndex = actionsByIdArray
              .findIndex(actionById => actionById.timestamp === timestamp);
            const isCurrentAction = currentStateIndex === currentActionIndex;

            const isCfud = isCfudAction(action as EditableAction);

            return (
              <Box
                key={timestamp}
                mt={10}
                mb={10}
                mr={10}
                height="calc(100% - 20px)"
              >
                <Card
                  style={{
                    background: isCfudActionType(action.type) ? color(cfudTypeBackgroundColorMap[action.type]).alpha(isCurrentAction ? 0.5 : 0.2).toString() : 'inherit',
                    width: 300 - 2 * 10,
                    height: '100%',
                    border: isCfud && (action as CfudAction).payload.id === hoveredActionId ? `1px solid ${theme.palette.primary.dark}` : 'none',
                  }}
                  onMouseEnter={() => {
                    if (isCfud) {
                      setHoveredActionId((action as CfudAction).payload.id);
                    }
                  }}
                  onMouseLeave={() => {
                    if (isCfud) {
                      setHoveredActionId('');
                    }
                  }}
                  onClick={() => {
                    const currentActionId = stagedActionIds[currentActionIndex];
                    dispatch(ActionCreators.jumpToAction(currentActionId));
                  }}
                >

                  <CardContent>
                    <Typography>
                      Type: {action.type}
                    </Typography>
                    {isCfudAction(action as EditableAction) && (
                      <Typography>
                        Id: {(action as CfudAction).payload.id}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Box>
            );
          })}
      </Flex>
    </Flex>
  );
};

// @ts-ignore
export default createDevTools(<StoryMonitor />);
