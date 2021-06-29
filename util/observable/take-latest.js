import { lastValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

export default function takeLatest(observable) {
  return lastValueFrom(observable.pipe(take(1)));
}
