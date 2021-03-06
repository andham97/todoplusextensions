# TodoPlusExtensions

This extensions builds on the Todo+ extension and adds some overview generation behaviour to get an overview over completed tasks within a given timeframe.

## Features

Allows use of `@overview` tags to generate (Alt+G) a collection of items both started and done. Items can be excluded from the overview with `@exclude` (Alt+E). It allows for general overviews with all started and done tasks, or to specify a from date (to present) `@overview(YY-MM-dd hh:mm)` same format as Todo+ uses.

Supports sorting of entire todo list with started tasks being placed on-top, non-completed tasks in the middle and completed/cancelled tasks in the bottom. Projects are also sorted based on their child task's status in the same order. (See 1.3.0 release notes for more info).

## Release Notes

### 0.6.1
- Fixed sorting now correctly merging old archive with new tasks.
- New handling of comments (* marked lines) where these are moved with the tasks.
- Fixed cursor location after sort, stops moving cursor to end of file.

### 0.6.0
- Added archive on sorting where all done/cancelled tasks are moved into an archive project in the bottom.
  - Project structure is persisted within archive and outside
- Known issue: Archiving ignores @exclude tags, so be careful when using archive sorting.
- Known issue: Sorting in lists where @overview tags has been used (it exist multiple of the same completed tasks will result in multiple entries in the archive).
- Known issue: @overview generation does not respect project structure so might have side effects where tasks look like their children of some tasks, when in-fact they're children of a sub-project whos context is not respected of overviews.

### 0.5.0
- Added setting to avoid re-arranging root level projects
- Changed default value on project spacing on sort setting
- Added support for bullet point lists, considered always done, but sorted on top as these are in the context of the parent item
- Fixed sorting order of done and started items, now done will be in the bottom and started non-done in the top as planned
- Fixed unneccessary spacing on first-item projects avoiding empty line in top of file and if project is first child of another item

### 0.4.0
- Added sorting of todo items
  - New setting to apply extra spacing to non-root projects.
  - Projects are considdered done/cancelled, and sorted based on this, if all sub-tasks/projects are done/cancelled
  - `@started` non-completed tasks on top
  - non-completed, non-started tasks in the middle
  - `@done` and `@cancelled` are sorted in the bottom
-New setting differenciates like so:
From:
```
Project1:
  ??? Item 1 @started(21-12-07 19:12) @done(21-12-07 19:12) @lasted(55s)
  Sub project:
    ??? Item 1 @started(21-12-07 19:12) @done(21-12-07 19:12) @lasted(55s)
  ??? Item 2
  ??? Item 3 @started(21-12-07 19:12)
Project2:
  ??? Item 1 @started(21-12-07 19:12) @done(21-12-07 19:12) @lasted(55s)
Project3:
  ??? Item 2
```

To (with only root level enabled):
```
Project1:
  ??? Item 3 @started(21-12-07 19:12)
  ??? Item 2
  ??? Item 1 @started(21-12-07 19:12) @done(21-12-07 19:12) @lasted(55s)
  Sub project:
    ??? Item 1 @started(21-12-07 19:12) @done(21-12-07 19:12) @lasted(55s)

Project3:
  ??? Item 2

Project2:
  ??? Item 1 @started(21-12-07 19:12) @done(21-12-07 19:12) @lasted(55s)
```

To (with setting disabled):
```
Project1:
  ??? Item 3 @started(21-12-07 19:12)
  ??? Item 2
  ??? Item 1 @started(21-12-07 19:12) @done(21-12-07 19:12) @lasted(55s)

  Sub project:
    ??? Item 1 @started(21-12-07 19:12) @done(21-12-07 19:12) @lasted(55s)

Project3:
  ??? Item 2

Project2:
  ??? Item 1 @started(21-12-07 19:12) @done(21-12-07 19:12) @lasted(55s)
```

### 0.3.0
- Added ability to toggle exclude on multiple lines at once
- Fixed issue with generate overview where month were one behind selected month
- Fixed minor spacing issue where 2 whitespaces could end up before tag was inserted for time and exclude tags

### 0.2.0
- Added `@time` tag (Alt+t) to tag comments etc. with current timestamp

### 0.1.0

Initial release of TodoPlusExtensions
- Overview generation with from date
- Exclude tag