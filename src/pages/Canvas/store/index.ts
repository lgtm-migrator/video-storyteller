import { convertFromRaw, EditorState } from 'draft-js';
import { BlockState } from 'models';
import { equals } from 'ramda';
import { useEffect, useState } from 'react';
import {
  ActionCreatorsMapObject,
  AnyAction,
  bindActionCreators,
  combineReducers,
  createStore,
  Dispatch,
  Reducer,
} from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { createSelector, Selector } from 'reselect';
import blockStates, { BlockStatesAction, RawBlockState } from './blockStates';
import transform, { TransformAction } from './transform';

const actionReducerMap = {
  blockStates,
  transform,
};

type ActionReducerMap = typeof actionReducerMap;

export type State = {
  [key in keyof ActionReducerMap]: ReturnType<ActionReducerMap[key]>;
};

export type Action = BlockStatesAction | TransformAction;

const reducer: Reducer<State, Action> = combineReducers(actionReducerMap);

const composeEnhancers = composeWithDevTools({ name: 'Canvas Store' });

const store = createStore(reducer, /* preloaded state */ composeEnhancers());

export default store;

export const convertFromRawBlockState = ({
  editorState,
  ...block
}: RawBlockState): BlockState => ({
  ...block,
  // eslint-disable-next-line max-len
  editorState: EditorState.moveSelectionToEnd(
    EditorState.createWithContent(convertFromRaw(editorState)),
  ),
});

export const selectBlockStates = (state: State) =>
  state.blockStates.map<BlockState>(convertFromRawBlockState);
export const selectTransform = (state: State) => state.transform;
export const selectScale = createSelector(
  selectTransform,
  ({ scale }) => scale,
);
export const selectPosition = createSelector(
  selectTransform,
  ({ scale, ...position }) => position,
);

export const useSelector = <R>(selector: Selector<State, R>) => {
  const [result, setResult] = useState(selector(store.getState()));

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const newResult = selector(store.getState());
      if (!equals(result, newResult)) {
        setResult(newResult);
      }
    });
    return unsubscribe;
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  return result;
};

// eslint-disable-next-line max-len
export const useActions = <MapObject extends ActionCreatorsMapObject<Action>>(
  actionCreator: MapObject,
) => bindActionCreators(actionCreator, store.dispatch as Dispatch<AnyAction>);
