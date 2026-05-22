export interface Command {
  command: string;
  usages: Usage[];
}

export interface Usage {
  parameter: string;
  description: string;
}
