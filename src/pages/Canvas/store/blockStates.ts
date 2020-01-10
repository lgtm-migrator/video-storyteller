/* eslint-disable indent */

import { ContentState, convertToRaw, RawDraftContentState } from 'draft-js';
import { BlockState, WithId } from 'models';
import { update } from 'ramda';
import { createAction, PayloadAction } from 'typesafe-actions';
import { Required } from 'utility-types';
import { createReducer, toObject } from 'utils';
import { v4 } from 'uuid';

export type RawBlockState = Omit<BlockState, 'editorState'> & {
  editorState: RawDraftContentState;
};
export type RawBlockStates = RawBlockState[];

export const convertToRawBlockState = <
  T extends Pick<BlockState, 'editorState'>
>({
  editorState,
  ...block
}: T) => ({
  ...block,
  editorState: convertToRaw(editorState.getCurrentContent()),
});

export const initialState: RawBlockStates = [];

export const cudActionTypes = ['create', 'update', 'delete'] as const;
export const cudActionType = toObject(cudActionTypes);
export type CudActionTypes = typeof cudActionTypes;
export type CudActionType = CudActionTypes[number];

export const createCreateAction = createAction(
  cudActionType.create,
  action => ({
    editorState,
    ...payload
  }: Omit<BlockState, 'id' | 'editorState'> & { editorState: string }) =>
    action({
      ...payload,
      id: v4(),
      editorState: convertToRaw(ContentState.createFromText(editorState)),
    }),
);
export type CreateAction = ReturnType<typeof createCreateAction>;

type UpdateBlockPayload = Required<Partial<BlockState>, 'id'>;
export const createUpdateAction: (
  payload: UpdateBlockPayload,
) => PayloadAction<
  typeof cudActionType.update,
  Partial<RawBlockState> & WithId
> = createAction(
  cudActionType.update,
  action => ({ editorState, ...rest }: UpdateBlockPayload) =>
    editorState
      ? action(
          convertToRawBlockState({
            ...rest,
            editorState,
          }),
        )
      : action(rest),
);
export type UpdateAction = ReturnType<typeof createUpdateAction>;

export const createDeleteAction = createAction(
  cudActionType.delete,
  action => (payload: WithId) => action(payload),
);
export type DeleteAction = ReturnType<typeof createDeleteAction>;

export type CudAction = CreateAction | UpdateAction | DeleteAction;

export type CudActions = CudAction[];

export type BlockStatesAction = CudAction;

export default createReducer(initialState)<BlockStatesAction>({
  create: (state, { payload }) => state.concat(payload),
  update: (state, { payload }) => {
    const blockIndex = state.findIndex(block => block.id === payload.id);

    const updatedBlock = { ...state[blockIndex], ...payload };

    const updatedBlocks = update(blockIndex, updatedBlock, state);

    return updatedBlocks;
  },
  delete: (state, { payload }) => state.filter(({ id }) => id !== payload.id),
});
