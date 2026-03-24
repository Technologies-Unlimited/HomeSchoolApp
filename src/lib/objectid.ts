import { ObjectId } from "mongodb";

export function isValidObjectId(value: string): boolean {
  return ObjectId.isValid(value) && new ObjectId(value).toString() === value;
}
