import { TypeScriptProject } from 'arch-unit-ts/dist/arch-unit/core/domain/TypeScriptProject';
import { RelativePath } from 'arch-unit-ts/dist/arch-unit/core/domain/RelativePath';
import { classes, noClasses } from 'arch-unit-ts/dist/main';

describe('Hexagonal Architecture Test', () => {
  const srcProject = new TypeScriptProject(RelativePath.of('src'), '**/*.test.ts');

  describe('Domain', () => {
    it('Should not depend on outside', () => {
      classes()
        .that()
        .resideInAPackage('..domain..')
        .should()
        .onlyDependOnClassesThat()
        .resideInAnyPackage('..domain..')
        .because('Domain model should only depend on domains and a very limited set of external dependencies')
        .check(srcProject.allClasses());
    });
  });

  describe('Application without initializer', () => {
    it('Should not depend on infrastructure', () => {
      noClasses()
        .that()
        .resideInAPackage('..application.component..')
        .or()
        .resideInAPackage('..application.model..')
        .should()
        .dependOnClassesThat()
        .resideInAnyPackage('..infrastructure..')
        .because('Application should only depend on domain, not on infrastructure')
        .check(srcProject.allClasses());
    });
  });
  describe('Infrastructure', () => {
    it('Should not depend on application', () => {
      noClasses()
        .that()
        .resideInAPackage('..infrastructure..')
        .should()
        .dependOnClassesThat()
        .resideInAnyPackage('..application..')
        .because('Infrastructure should only depend on domain, not on application')
        .check(srcProject.allClasses());
    });
  });
});
