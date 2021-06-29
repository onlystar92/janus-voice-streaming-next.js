import { BehaviorSubject } from 'rxjs';
import nextApply from 'util/observable/next-apply';

const user$ = new BehaviorSubject({
  uuid: null,
  username: null,
  room: null,
  token: null,
});

const nextUser = nextApply(user$);

function setUUID(uuid) {
  nextUser({ uuid });
}

function setUsername(username) {
  nextUser({ username });
}

function setRoom(room) {
  nextUser({ room });
}

function setToken(token) {
  nextUser({ token });
}

export { user$, setUUID, setUsername, setRoom, setToken };
