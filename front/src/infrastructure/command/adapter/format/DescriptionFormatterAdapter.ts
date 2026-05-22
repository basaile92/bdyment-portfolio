import { Age, Description } from '../../../../domain/command/model/Description';
import { DescriptionFormatterPort } from '../../../../domain/command/port/format/DescriptionFormatterPort';
import { keepNewLine } from './value-utils';

export class DescriptionFormatterAdapter implements DescriptionFormatterPort {
  format(description: Description): string {
    return this.descriptionToString(description);
  }

  private descriptionToString(description: Description): string {
    return `<div><span class="label">Name:</span><span class="important-value"> ${description.name}</span></div><br/>
          <div><span class="label">Age:</span> ${this.ageToString(description.age)}</div><br/>
          <div><span class="label">Job:</span><span class="important-value"> ${description.job}</span></div><br>
          <div><span class="label">Linked-in: </span><a class="link" target="_blank" href="${description.linkedin}">${description.linkedin}</a></div><br>
          <div><span class="label">GitHub: </span><a class="link" target="_blank" href="${description.github}">${description.github}</a></div><br>
          <div><span class="label">Presentation:</span><span class="important-value"> ${keepNewLine(description.presentation)}</span></div>  `;
  }

  private ageToString(age: Age): string {
    return `<span class="important-value">${age.timeInYear}</span> years or <span class="important-value">${age.timeInDay}</span> days or <span class="important-value">${age.timeInHour}</span> hours`;
  }
}
