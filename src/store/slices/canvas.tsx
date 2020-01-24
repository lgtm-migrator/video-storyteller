import { ExtendedLoadingStatus } from 'models';
import { StoryWithId, StoryState } from 'pages/Canvas/CanvasContext';
import { ActionType, createAction, createAsyncAction } from 'typesafe-actions';
import { createReducer, toObject } from 'utils';

export type Durations = number[];

export interface CanvasState {
  saveStoryStatus: ExtendedLoadingStatus;
  lastJumpedToActionId: number;
  durations: Durations;
  stories: StoryState[];
  fetchStoriesStatus: ExtendedLoadingStatus;
}

export const initialCanvasState: CanvasState = {
  saveStoryStatus: 'not started',
  lastJumpedToActionId: -1,
  durations: [],
  stories: [],
  fetchStoriesStatus: 'not started',
};

export const setLastJumpedToActionIdType = 'canvas/lastJumpedToActionId/set';
export const createSetLastJumpedToActionId = createAction(
  setLastJumpedToActionIdType,
  action => (payload: CanvasState['lastJumpedToActionId']) => action(payload),
);
export type CreateSetLastJumpedToActionId = typeof createSetLastJumpedToActionId;
export type SetLastJumpedToActionIdAction = ReturnType<
  CreateSetLastJumpedToActionId
>;

export const setDurationsType = 'canvas/durations/set';
export const createSetDurations = createAction(
  setDurationsType,
  action => (payload: CanvasState['durations']) => action(payload),
);
export type CreateSetDurations = typeof createSetDurations;
export type SetDurationsAction = ReturnType<CreateSetDurations>;

export const saveStoryTypes = [
  'canvas/saveStory/request',
  'canvas/saveStory/success',
  'canvas/saveStory/failure',
] as const;
export const saveStoryType = toObject(saveStoryTypes);
export const createSaveStory = createAsyncAction(...saveStoryTypes)<
  StoryWithId,
  void,
  void
>();

export type CreateSaveStory = typeof createSaveStory;
export type SaveStoryRequest = ReturnType<CreateSaveStory['request']>;
export type SaveStorySuccess = ReturnType<CreateSaveStory['success']>;
export type SaveStoryFailure = ReturnType<CreateSaveStory['failure']>;
export type SaveStoryAction = ActionType<CreateSaveStory>;

export const fetchStoriesTypes = [
  'canvas/fetchStories/request',
  'canvas/fetchStories/success',
  'canvas/fetchStories/failure',
] as const;
export const fetchStoriesType = toObject(fetchStoriesTypes);
export const createFetchStories = createAsyncAction(...fetchStoriesTypes)<
  void,
  Pick<CanvasState, 'stories'>,
  void
>();
export type CreateFetchStories = typeof createFetchStories;
export type FetchStoryAction = ActionType<typeof createFetchStories>;

export type CanvasAction =
  | FetchStoryAction
  | SetLastJumpedToActionIdAction
  | SetDurationsAction
  | SaveStoryAction;

export const canvas = createReducer(initialCanvasState)<CanvasAction>({
  'canvas/fetchStories/request': state => ({
    ...state,
    fetchStoryStatus: 'in progress',
  }),
  'canvas/fetchStories/failure': state => ({
    ...state,
    fetchStoryStatus: 'failure',
  }),
  'canvas/fetchStories/success': (state, { payload: { stories } }) => ({
    ...state,
    fetchStoryStatus: 'completed',
    stories,
  }),
  'canvas/lastJumpedToActionId/set': (state, { payload }) => ({
    ...state,
    lastJumpedToActionId: payload,
  }),
  'canvas/durations/set': (state, { payload }) => ({
    ...state,
    durations: payload,
  }),
  'canvas/saveStory/request': state => ({
    ...state,
    saveStoryStatus: 'in progress',
  }),
  'canvas/saveStory/success': state => ({
    ...state,
    saveStoryStatus: 'completed',
  }),
  'canvas/saveStory/failure': state => ({
    ...state,
    saveStoryStatus: 'failed',
  }),
});
