import { append, curry, mergeRight, type } from 'ramda';
import takeFirst from './take-first';

const nextApply = curry((observable, value) => {
  takeFirst(observable).subscribe((currentValue) => {
    let newValue;

    switch (type(currentValue)) {
      case 'Object':
        newValue = mergeRight(currentValue, value);
        break;
      case 'Array':
        newValue = append(value, currentValue);
        break;
      default:
        newValue = currentValue;
        break;
    }

    observable.next(newValue);
  });
});

export default nextApply;
