import { take } from 'rxjs/operators';

export default function takeFirst(observable) {
  return observable.pipe(take(1));
}
