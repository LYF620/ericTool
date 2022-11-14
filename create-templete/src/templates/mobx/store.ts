import { useSetState } from 'ahooks';
import { Result } from 'antd-mobile';
import Item from 'antd-mobile/es/components/dropdown/item';
import { runInAction } from 'mobx';
import { useLocalObservable } from 'mobx-react-lite';
import { useMemo, useRef } from 'react';
import useQuery from '@/hooks/useQuery';
import globalStore from '@/store/index';
import { createStore } from '@/utils/createStore';
import { useHistory, useLocation } from 'react-router-dom';

export function useModel() {
  const history = useHistory();

  const eId = () => {
    return sessionStorage.getItem('eid');
  };

  const pId = () => {
    return globalStore.projectId;
  };

  const { state } = useLocation();

  const store = useLocalObservable(() => ({}));

  return {
    store,
    history,
  };
}

const store = createStore(useModel);
export const Context = store.Context;
export const useStore = store.useStore;
