import { Mission } from '../../../../domain/command/model/Mission';
import { MissionFormatterPort } from '../../../../domain/command/port/format/MissionFormatterPort';
import { separateByComma, separateByNewLine } from './separation-utils';
import { displayDatesAndPlace, keepNewLine } from './value-utils';
import { Skill } from '../../../../domain/command/model/Skill';

export class MissionFormatterAdapter implements MissionFormatterPort {
  format(missions: Mission[]): string {
    return missions.map((mission) => this.missionToString(mission)).reduce(separateByNewLine, '');
  }

  private missionToString(mission: Mission): string {
    return `<div><div>
            <span class="title">${mission.company}</span>
            <span class="subject">${mission.role}</span>
          </div>
          <div>
          ${
            mission.websites && mission.websites.length > 0
              ? mission.websites
                  .map(
                    (website) => `<a class="link" target="_blank" href="${website}">
            ${website}
          </a>`,
                  )
                  .reduce(separateByNewLine)
              : ''
          }
          </div>
          ${displayDatesAndPlace(mission.startYear, mission.endYear, mission.place)}
          <br/><div> ${keepNewLine(mission.description)} </div>
          <br/>
           ${mission.skills.length > 0 ? `<div class="italic">${mission.skills.map(this.skillToString).reduce(separateByComma)}</div>` : ''}
          </div>`;
  }

  private skillToString(skill: Skill): string {
    return `${skill.name}`;
  }
}
