import { mapEnumToOptions } from '@lsw-abpvue/core';

export enum BookType {
  Undefined = 0,
  Adventure = 1,
  Biography = 2,
  Dystopia = 3,
  Fantasy = 4,
  Horror = 5,
  Science = 6,
  ScienceFiction = 7,
  Poetry = 8,
}

export const bookTypeOptions = mapEnumToOptions(BookType);
