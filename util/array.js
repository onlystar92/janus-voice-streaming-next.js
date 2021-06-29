import { append, equals, includes, reject } from 'ramda';

function appendIfNotPresent(element, array) {
  return includes(element, array) ? array : append(element, array);
}

function remove(element, array) {
  return reject(equals(element), array);
}

export { appendIfNotPresent, remove };
