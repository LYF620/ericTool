
import styles from './index.module.less';
import { observer } from 'mobx-react-lite';
import { Context, useModel, useStore } from './store';

const __page__ = observer(function __page__() {
  const { history } = useStore();
  return (
    <div className={styles.__module__}>

    </div>);
});

export default () => {
  const model = useModel();

  return (
    <Context.Provider value={model}>
      <__page__ />
    </Context.Provider>
  );
};
