export interface Description {
  name: string;
  age: Age;
  job: string;
  linkedin: string;
  github: string;
  presentation: string;
}

export interface Age {
  timeInHour: number;
  timeInDay: number;
  timeInYear: number;
}
