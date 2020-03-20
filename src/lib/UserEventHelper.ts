import { isNumber } from './DataValidator';
import { EVENT_STATUS, USER_EVENT_STATUS } from './EventHelper';
import { getDb } from './Firebase';
import { DB_PATHS } from './DBHelper';

export function verifyStatus(status: any) {
  if (!isNumber(status)) {
    throw new Error('Status is not a number.');
  }

  const stat = Number(status);

  if (
    stat !== USER_EVENT_STATUS.ATTENDING &&
    stat !== USER_EVENT_STATUS.MAYBE &&
    stat !== USER_EVENT_STATUS.NO
  ) {
    throw new Error('Not a valid status type.');
  }

  return stat;
}

export async function getEventData(eid: string) {
  if (!eid) {
    throw new Error('Invalid event id provided.');
  }

  const snapshot = await getDb()
    .collection(DB_PATHS.EVENTS)
    .where('eid', '==', eid)
    .get();

  if (snapshot.docs.length !== 1) {
    throw new Error('Event could not be found.');
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  if (!doc.exists || !data) {
    throw new Error('Event could not be found.');
  }

  if (data.status !== EVENT_STATUS.ACTIVE) {
    throw new Error('Event is currently not active.');
  }

  return data;
}

export function getStringFromStatus(status: number) {
  switch (status) {
    case USER_EVENT_STATUS.ATTENDING:
      return 'Attending';
    case USER_EVENT_STATUS.MAYBE:
      return 'Maybe';
    case USER_EVENT_STATUS.NO:
      return 'Not Attending';
    default:
      return '';
  }
}

export async function verifyEventCapacity(eid: string) {
  const event = await getDb()
    .collection(DB_PATHS.EVENTS)
    .doc(eid)
    .get()
    .then((doc) => {
      return doc.data();
    });

  if (!event) {
    throw new Error('Event data not found.');
  }

  const attendees = await getDb()
    .collection(DB_PATHS.EVENT_USERS)
    .where('eid', '==', eid)
    .where('status', '==', USER_EVENT_STATUS.ATTENDING)
    .get();

  if (event.capacity <= attendees.docs.length) {
    throw new Error('This event is full.');
  }
}
