---
name: Release issue template
about: Steps to follow for Release process
title: ''
labels: ''
assignees: ''

---

- Release Steps:
  - [ ] update language.json - should we automate?
  - [ ] configure netlify to auto-build release branch `release-v*.*` (add as additional branch to Deploy contexts under https://app.netlify.com/sites/gateway-edit/settings/deploys)
  - [ ]  create release branch `release-v*.*`
  - [ ]  Ping QA that release branch is ready for testing (https://release-v*.*--gateway-edit.netlify.app/)

- When QA has OK'd release branch, make final release by merging to main:
  - [ ] Create PR from `release-v*.*` branch to main branch.
  - [ ] Merge pull request `release-v*.*` branch to main . Record new build version for v*.* here: 
  - [ ] Ping QA that release is live at https://gatewayedit.com/ - inform them that current build to verify is now version recorded above ^^^
  - [ ] Final Go ahead for publish from QA
  - [ ] Create a tag
  - [ ] Publish release notes.
  - [ ] Add release notes to the draft release and publish on github.
  - [ ] Announce on forum.door43.org

- Merge release-v*.* back into develop branch:
  - [ ] create PR to merge single-scripture-rcl release-v*.* branch into master
  - [ ] create PR to merge translation-helps-rcl release-v*.* branch into master
  - [ ] create PR to merge resource-workspace-rcl release-v*.*  branch into master
  - [ ] create PR to merge GWE release-v*.* branch into develop
  - [ ] review and merge the above PRs
