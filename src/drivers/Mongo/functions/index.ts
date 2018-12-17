export function mapId(object: any): any {
  object.id = object._id;
  delete object._id;
  return object;
}
