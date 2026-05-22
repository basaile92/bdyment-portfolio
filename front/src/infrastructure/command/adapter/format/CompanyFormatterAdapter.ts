import { Company } from '../../../../domain/command/model/Company';
import { CompanyFormatterPort } from '../../../../domain/command/port/format/CompanyFormatterPort';
import { displayDatesAndPlace, displayValueIfPresent } from './value-utils';
import { separateByNewLine } from './separation-utils';

export class CompanyFormatterAdapter implements CompanyFormatterPort {
  format(companies: Company[]): string {
    return companies.map(this.companyToString).reduce(separateByNewLine, '');
  }

  private companyToString(company: Company): string {
    return `<div><div>
            <span class="title">${company.name}</span>
            <span class="subject">${company.role}</span>
          </div>
          ${displayValueIfPresent(
            company.website,
            `<a class="link" target="_blank" href="${company.website}">
            ${company.website}
          </a>`,
          )}
          ${displayDatesAndPlace(company.startYear, company.endYear, company.place)}
          ${company.description ? `<br/><div>${company.description}</div>` : ''}</div>`;
  }
}
