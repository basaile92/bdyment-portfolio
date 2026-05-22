export interface ErrorHelpPort {
  help(
    parameter:
      | 'companies'
      | 'description'
      | 'help'
      | 'hobbies'
      | 'languages'
      | 'missions'
      | 'projects'
      | 'skills'
      | 'studies',
  ): Promise<string>;
}
